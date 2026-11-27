// Data model for stored and exported records, and a validator.
//
// The field definitions in RECORDS are the single source of truth: validate() checks records
// against them, and toJsonSchema() turns them into docs/data-schema.json (regenerate with
// `npm run schema`; tests/schema.test.mjs fails if the file is out of date). Prose
// documentation is in docs/DATA-SCHEMA.md.
//
// Every record carries schemaVersion (audit D-6). Sittings also carry appVersion,
// scoringVersion, formId and seed; attempts and self-reports carry scoringVersion and their raw
// responses with timings, so every score can be recomputed.

import { SCHEMA_VERSION } from './version.js';

// ---------------------------------------------------------------------------
// JSDoc types

/**
 * @typedef {object} Consent
 * @property {string} noticeVersion        version of the consent wording the participant saw (src/app/consent.js)
 * @property {string} givenAt              ISO 8601 date-time of the latest consent decision
 * @property {true} toolUse                agreed to use the tool (required to use it at all)
 * @property {boolean} programmeEvaluation agreed to cohort-level programme evaluation use
 * @property {boolean} languageBackground  agreed to record language background (audit E-1)
 */

/**
 * @typedef {object} LanguageBackground
 * @property {'yes' | 'no' | 'prefer-not-to-say'} englishFirstLanguage
 */

/**
 * @typedef {object} Participant
 * @property {'participant'} type
 * @property {number} schemaVersion
 * @property {string} id                       pseudonymous code from ids.newParticipantId()
 * @property {string} createdAt                ISO 8601 date-time
 * @property {Consent} consent
 * @property {LanguageBackground} [languageBackground] only if consent.languageBackground is true
 * @property {Settings} [settings]
 */

/**
 * @typedef {object} Settings
 * @property {1 | 1.5 | 2} timeMultiplier     extended time for timed tasks (audit E-3)
 * @property {boolean} reducedMotion          reduce motion even if the system setting does not
 */

/**
 * @typedef {object} ProgrammeInfo
 * @property {string} code                     coach-provided sitting code, normalised
 * @property {number} window                   window number from the code (1 = start, 2 = end, ...)
 * @property {string[]} skillOrder             the fixed skill order of the full battery
 * @property {number} position                 this sitting's index in skillOrder
 */

/**
 * @typedef {object} Sitting
 * @property {'sitting'} type
 * @property {number} schemaVersion
 * @property {string} id
 * @property {string} participantId
 * @property {string} skillId                  the one skill this sitting covers
 * @property {'practice' | 'assessment'} mode
 * @property {string | null} windowId          assessment: 'self' or 'programme:<code>'; practice: null
 * @property {ProgrammeInfo | null} programme  set when the sitting is part of a programme battery
 * @property {string} formId                   'A' or 'B' for assessment; 'practice' for practice
 * @property {number} seed                     uint32; reproduces every random choice in the sitting
 * @property {string} appVersion
 * @property {string} scoringVersion
 * @property {string} startedAt
 * @property {string | null} completedAt
 */

/**
 * @typedef {object} ItemResponse
 * @property {string} itemId
 * @property {*} response                      raw response, any JSON value
 * @property {number | null} rtMs              time from shownAt to response; null if not answered
 * @property {string} shownAt                  ISO 8601 date-time
 */

/**
 * @typedef {object} TimingLog
 * @property {number | null} limitMs           base limit; null if untimed
 * @property {number} multiplier               accommodation multiplier (1 = none)
 * @property {number} extendedMs               total time added by extensions
 * @property {number} pausedMs                 total time spent paused
 * @property {boolean} expired                 the limit was reached before completion
 */

/**
 * @typedef {object} TaskAttempt
 * @property {'taskAttempt'} type
 * @property {number} schemaVersion
 * @property {string} id
 * @property {string} sittingId
 * @property {string} skillId
 * @property {string} taskId
 * @property {ItemResponse[]} itemResponses
 * @property {number | null} rawScore
 * @property {number | Object<string, number | null> | null} score  a number, or one value per facet
 * @property {string} scoringVersion
 * @property {'in-progress' | 'complete'} status
 * @property {string} startedAt
 * @property {string} updatedAt                last autosave
 * @property {string | null} completedAt
 * @property {TimingLog} [timing]              set on completion of a timed task
 * @property {object} [timerSnapshot]          timing.js snapshot while in progress, for resuming
 */

/**
 * @typedef {object} SelfReport
 * @property {'selfReport'} type
 * @property {number} schemaVersion
 * @property {string} id
 * @property {string} sittingId
 * @property {string} skillId
 * @property {ItemResponse[]} responses
 * @property {number | Object<string, number | null> | null} score
 * @property {Object<string, number | null>} [retrospective]  end-of-programme "then" ratings per facet (schema 3)
 * @property {SelfReportQuality} [quality]     response-quality indicators, coach view only (schema 3)
 * @property {string} scoringVersion
 * @property {'in-progress' | 'complete'} status
 * @property {string} startedAt
 * @property {string} updatedAt
 * @property {string | null} completedAt
 */

/**
 * @typedef {object} SelfReportQuality
 * @property {number} items                    main (not retrospective) items on the form
 * @property {number} answered                 items with a valid answer
 * @property {number} missing                  items without one
 * @property {boolean} straightLining          every answer the same (at least 3 answers)
 * @property {number | null} medianItemMs      median time per item
 * @property {boolean} fastResponding          medianItemMs under 1000
 * @property {number} longestRun               longest run of identical answers, in the order shown
 * @property {boolean} longRun                 longestRun at or above the provisional threshold
 */

// ---------------------------------------------------------------------------
// Field definitions
//
// A field is { type, ...constraints }. type is a JSON type name or an array of them; a field
// with no type accepts any JSON value.
// Constraints: optional, enum, const, pattern, format ('date-time'), minimum, items,
// properties, additionalProperties. Objects reject unknown properties unless
// additionalProperties is given.

const ISO = { type: 'string', format: 'date-time' };
const ID = (prefix) => ({ type: 'string', pattern: `^${prefix}-[0-9A-HJKMNP-TV-Z]{16}$` });
const PARTICIPANT_ID = { type: 'string', pattern: '^P-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{5}$' };
const SLUG = { type: 'string', pattern: '^[a-z0-9_][a-z0-9_-]*$' };
const VERSION = { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+(-[0-9A-Za-z.-]+)?$' };
const SCHEMA_V = { type: 'integer', minimum: 1 };
const SCORE = {
  type: ['number', 'object', 'null'],
  additionalProperties: { type: ['number', 'null'] },
};
const ISO_OR_NULL = { type: ['string', 'null'], format: 'date-time' };
const PROGRESS = {
  status: { type: 'string', enum: ['in-progress', 'complete'] },
  startedAt: ISO,
  updatedAt: ISO,
  completedAt: ISO_OR_NULL,
};
const MS_OR_NULL = { type: ['number', 'null'] };
const TIMER_SNAPSHOT = {
  type: 'object',
  optional: true,
  description: 'State of the task timer while the attempt is in progress (src/core/timing.js snapshot()).',
  properties: {
    limitMs: { type: ['number', 'null'], minimum: 0 },
    multiplier: { type: 'number', minimum: 1 },
    state: { type: 'string', enum: ['idle', 'running', 'paused', 'expired', 'stopped'] },
    endAt: MS_OR_NULL,
    remainingMs: MS_OR_NULL,
    extendedMs: { type: 'number', minimum: 0 },
    pausedMs: { type: 'number', minimum: 0 },
    pausedAt: MS_OR_NULL,
    startedAt: MS_OR_NULL,
  },
};
const ITEM_RESPONSE = {
  type: 'object',
  properties: {
    itemId: { type: 'string', pattern: '^[A-Za-z0-9_.-]+$' },
    response: { description: 'Raw response; any JSON value. Its shape is defined by the task.' },
    rtMs: { type: ['number', 'null'], minimum: 0 },
    shownAt: ISO,
  },
};

export const RECORDS = {
  participant: {
    description: 'One student, identified only by a random pseudonymous code.',
    properties: {
      type: { type: 'string', const: 'participant' },
      schemaVersion: SCHEMA_V,
      id: PARTICIPANT_ID,
      createdAt: ISO,
      consent: {
        type: 'object',
        properties: {
          noticeVersion: { type: 'string' },
          givenAt: ISO,
          toolUse: { type: 'boolean', const: true },
          programmeEvaluation: { type: 'boolean' },
          languageBackground: { type: 'boolean' },
        },
      },
      languageBackground: {
        type: 'object',
        optional: true,
        properties: {
          englishFirstLanguage: { type: 'string', enum: ['yes', 'no', 'prefer-not-to-say'] },
        },
      },
      settings: {
        type: 'object',
        optional: true,
        properties: {
          timeMultiplier: { type: 'number', enum: [1, 1.5, 2] },
          reducedMotion: { type: 'boolean' },
        },
      },
    },
  },
  sitting: {
    description: 'One occasion on which a participant works through one skill\'s steps in one mode with one form.',
    properties: {
      type: { type: 'string', const: 'sitting' },
      schemaVersion: SCHEMA_V,
      id: ID('S'),
      participantId: PARTICIPANT_ID,
      skillId: SLUG,
      mode: { type: 'string', enum: ['practice', 'assessment'] },
      windowId: { type: ['string', 'null'], pattern: '^(self|programme:[A-Z0-9]{2,12}-[1-9])$' },
      programme: {
        type: ['object', 'null'],
        properties: {
          code: { type: 'string', pattern: '^[A-Z0-9]{2,12}-[1-9]$' },
          window: { type: 'integer', minimum: 1, maximum: 9 },
          skillOrder: { type: 'array', items: SLUG },
          position: { type: 'integer', minimum: 0 },
        },
      },
      formId: { type: 'string', pattern: '^(A|B|practice)$' },
      seed: { type: 'integer', minimum: 0, maximum: 4294967295 },
      appVersion: VERSION,
      scoringVersion: VERSION,
      startedAt: ISO,
      completedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  },
  taskAttempt: {
    description: 'One attempt at one task within a sitting, with every raw response and its timing.',
    properties: {
      type: { type: 'string', const: 'taskAttempt' },
      schemaVersion: SCHEMA_V,
      id: ID('A'),
      sittingId: ID('S'),
      skillId: SLUG,
      taskId: SLUG,
      itemResponses: { type: 'array', items: ITEM_RESPONSE },
      rawScore: { type: ['number', 'null'] },
      score: SCORE,
      scoringVersion: VERSION,
      ...PROGRESS,
      timerSnapshot: TIMER_SNAPSHOT,
      timing: {
        type: 'object',
        optional: true,
        properties: {
          limitMs: { type: ['number', 'null'], minimum: 0 },
          multiplier: { type: 'number', minimum: 1 },
          extendedMs: { type: 'number', minimum: 0 },
          pausedMs: { type: 'number', minimum: 0 },
          expired: { type: 'boolean' },
        },
      },
    },
  },
  selfReport: {
    description: 'One skill\'s self-report questionnaire within a sitting.',
    properties: {
      type: { type: 'string', const: 'selfReport' },
      schemaVersion: SCHEMA_V,
      id: ID('R'),
      sittingId: ID('S'),
      skillId: SLUG,
      responses: { type: 'array', items: ITEM_RESPONSE },
      score: SCORE,
      retrospective: {
        type: 'object',
        optional: true,
        description: 'End-of-programme retrospective ("then") rating per facet, 1 to 5; never part of the skill score. Added in schema version 3.',
        additionalProperties: { type: ['number', 'null'] },
      },
      quality: {
        type: 'object',
        optional: true,
        description: 'Response-quality indicators for the coach view. Never shown to the student and never used in a score. Added in schema version 3.',
        properties: {
          items: { type: 'integer', minimum: 0 },
          answered: { type: 'integer', minimum: 0 },
          missing: { type: 'integer', minimum: 0 },
          straightLining: { type: 'boolean' },
          medianItemMs: { type: ['number', 'null'], minimum: 0 },
          fastResponding: { type: 'boolean' },
          longestRun: { type: 'integer', minimum: 0 },
          longRun: { type: 'boolean' },
        },
      },
      scoringVersion: VERSION,
      ...PROGRESS,
    },
  },
};

export const RECORD_TYPES = Object.freeze(Object.keys(RECORDS));

// ---------------------------------------------------------------------------
// Validator

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v;
}

function typeMatches(actual, allowed) {
  return allowed.includes(actual) || (actual === 'integer' && allowed.includes('number'));
}

function check(value, field, path, errors) {
  if (field.type === undefined) {
    if (value === undefined) errors.push({ path, message: 'must be a JSON value' });
    return; // any JSON value
  }
  const allowed = Array.isArray(field.type) ? field.type : [field.type];
  const actual = typeOf(value);
  if (actual === 'number' && !Number.isFinite(value)) {
    errors.push({ path, message: 'must be a finite number' });
    return;
  }
  if (!typeMatches(actual, allowed)) {
    errors.push({ path, message: `must be ${allowed.join(' or ')}, got ${actual}` });
    return;
  }
  if (field.const !== undefined && value !== field.const) errors.push({ path, message: `must be "${field.const}"` });
  if (field.enum && !field.enum.includes(value)) errors.push({ path, message: `must be one of ${field.enum.join(', ')}` });
  if (actual === 'string') {
    if (field.pattern && !new RegExp(field.pattern).test(value)) errors.push({ path, message: `does not match ${field.pattern}` });
    if (field.format === 'date-time' && (!ISO_RE.test(value) || Number.isNaN(Date.parse(value)))) {
      errors.push({ path, message: 'must be an ISO 8601 date-time' });
    }
  }
  if ((actual === 'number' || actual === 'integer')) {
    if (field.minimum !== undefined && value < field.minimum) errors.push({ path, message: `must be at least ${field.minimum}` });
    if (field.maximum !== undefined && value > field.maximum) errors.push({ path, message: `must be at most ${field.maximum}` });
  }
  if (actual === 'array' && field.items) value.forEach((v, i) => check(v, field.items, `${path}[${i}]`, errors));
  if (actual === 'object') {
    const props = field.properties || {};
    for (const [k, f] of Object.entries(props)) {
      if (!(k in value) || value[k] === undefined) {
        if (!f.optional) errors.push({ path: `${path}.${k}`, message: 'is required' });
      } else check(value[k], f, `${path}.${k}`, errors);
    }
    for (const k of Object.keys(value)) {
      if (k in props) continue;
      if (field.additionalProperties) check(value[k], field.additionalProperties, `${path}.${k}`, errors);
      else errors.push({ path: `${path}.${k}`, message: 'is not an allowed field' });
    }
  }
}

// Rules that span fields. Listed in docs/DATA-SCHEMA.md; not expressible in data-schema.json.
function progressRules(r, errors) {
  if (r.status === 'complete' && r.completedAt === null) errors.push({ path: '$.completedAt', message: 'is required when status is complete' });
  if (r.status === 'in-progress') {
    if (r.completedAt !== null) errors.push({ path: '$.completedAt', message: 'must be null while in progress' });
    if (r.score !== null) errors.push({ path: '$.score', message: 'must be null while in progress' });
    if ('rawScore' in r && r.rawScore !== null) errors.push({ path: '$.rawScore', message: 'must be null while in progress' });
    for (const k of ['quality', 'retrospective']) if (r[k] !== undefined) errors.push({ path: `$.${k}`, message: 'is set only on completion' });
  }
  if (r.status === 'complete' && r.timerSnapshot !== undefined) errors.push({ path: '$.timerSnapshot', message: 'is kept only while in progress' });
  if (typeof r.completedAt === 'string' && Date.parse(r.completedAt) < Date.parse(r.startedAt)) errors.push({ path: '$.completedAt', message: 'is before startedAt' });
  if (Date.parse(r.updatedAt) < Date.parse(r.startedAt)) errors.push({ path: '$.updatedAt', message: 'is before startedAt' });
}

const CROSS_FIELD = {
  taskAttempt: progressRules,
  selfReport: progressRules,
  participant(r, errors) {
    if (r.languageBackground !== undefined && r.consent?.languageBackground !== true) {
      errors.push({ path: '$.languageBackground', message: 'may be recorded only with consent.languageBackground true' });
    }
  },
  sitting(r, errors) {
    if (r.mode === 'practice' && r.formId !== 'practice') errors.push({ path: '$.formId', message: 'must be "practice" in practice mode' });
    if (r.mode === 'assessment' && r.formId === 'practice') errors.push({ path: '$.formId', message: 'must be A or B in assessment mode' });
    if (typeof r.completedAt === 'string' && typeof r.startedAt === 'string' && Date.parse(r.completedAt) < Date.parse(r.startedAt)) {
      errors.push({ path: '$.completedAt', message: 'is before startedAt' });
    }
    if (r.mode === 'practice' && (r.windowId !== null || r.programme !== null)) errors.push({ path: '$.windowId', message: 'practice sittings have no window and no programme' });
    if (r.mode === 'assessment' && r.windowId === null) errors.push({ path: '$.windowId', message: 'is required in assessment mode' });
    if (r.programme) {
      if (r.windowId !== `programme:${r.programme.code}`) errors.push({ path: '$.windowId', message: 'must be programme:<code> for a programme sitting' });
      if (Number(r.programme.code.slice(-1)) !== r.programme.window) errors.push({ path: '$.programme.window', message: 'must match the last digit of the code' });
      if (r.programme.skillOrder[r.programme.position] !== r.skillId) errors.push({ path: '$.programme.position', message: 'must point at this sitting\'s skill in skillOrder' });
    } else if (r.windowId !== null && r.windowId !== 'self') errors.push({ path: '$.windowId', message: 'must be "self" outside a programme sitting' });
  },
};

/**
 * Validate a record against its type's definition.
 * @param {string} type  one of RECORD_TYPES
 * @param {unknown} record
 * @returns {{ valid: boolean, errors: { path: string, message: string }[] }}
 */
export function validate(type, record) {
  const def = RECORDS[type];
  if (!def) return { valid: false, errors: [{ path: '$', message: `unknown record type "${type}"` }] };
  const errors = [];
  check(record, { type: 'object', properties: def.properties }, '$', errors);
  if (!errors.length && CROSS_FIELD[type]) CROSS_FIELD[type](record, errors);
  if (!errors.length && record.schemaVersion !== SCHEMA_VERSION) {
    errors.push({ path: '$.schemaVersion', message: `is ${record.schemaVersion}; this build reads ${SCHEMA_VERSION} (run migrations first)` });
  }
  return { valid: errors.length === 0, errors };
}

/** Throw if invalid; otherwise return the record. */
export function assertValid(type, record) {
  const { valid, errors } = validate(type, record);
  if (!valid) {
    const err = new TypeError(`Invalid ${type}: ${errors.map((e) => `${e.path} ${e.message}`).join('; ')}`);
    err.errors = errors;
    throw err;
  }
  return record;
}

// ---------------------------------------------------------------------------
// JSON Schema (draft 2020-12) export

function fieldToJson(field) {
  const out = {};
  if (field.description) out.description = field.description;
  if (field.type === undefined) return out;
  out.type = field.type;
  for (const k of ['const', 'enum', 'pattern', 'format', 'minimum', 'maximum']) if (field[k] !== undefined) out[k] = field[k];
  if (field.items) out.items = fieldToJson(field.items);
  const types = Array.isArray(field.type) ? field.type : [field.type];
  if (types.includes('object')) {
    if (field.properties) {
      out.properties = Object.fromEntries(Object.entries(field.properties).map(([k, f]) => [k, fieldToJson(f)]));
      out.required = Object.entries(field.properties).filter(([, f]) => !f.optional).map(([k]) => k);
    }
    out.additionalProperties = field.additionalProperties ? fieldToJson(field.additionalProperties) : false;
  }
  return out;
}

/** The data model as a JSON Schema document. Written to docs/data-schema.json. */
export function toJsonSchema() {
  const defs = Object.fromEntries(
    Object.entries(RECORDS).map(([name, def]) => [
      name,
      fieldToJson({ type: 'object', description: def.description, properties: def.properties }),
    ]),
  );
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `skills5c-data-schema-v${SCHEMA_VERSION}`,
    title: '5C Skills Assessment data model',
    description: `Records stored under skills5c:v${SCHEMA_VERSION}:* and in JSON exports. Generated from src/core/schema.js; do not edit by hand. Cross-field rules are listed in docs/DATA-SCHEMA.md.`,
    $defs: defs,
    oneOf: Object.keys(defs).map((k) => ({ $ref: `#/$defs/${k}` })),
  };
}
