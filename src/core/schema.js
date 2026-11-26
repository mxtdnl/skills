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
 * @property {string} noticeVersion        version of the privacy notice the participant saw
 * @property {string} givenAt              ISO 8601 date-time
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
 */

/**
 * @typedef {object} Sitting
 * @property {'sitting'} type
 * @property {number} schemaVersion
 * @property {string} id
 * @property {string} participantId
 * @property {'practice' | 'assessment'} mode
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
 * @property {TimingLog} [timing]
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
 * @property {string} scoringVersion
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
    },
  },
  sitting: {
    description: 'One occasion on which a participant works through tasks in one mode with one form.',
    properties: {
      type: { type: 'string', const: 'sitting' },
      schemaVersion: SCHEMA_V,
      id: ID('S'),
      participantId: PARTICIPANT_ID,
      mode: { type: 'string', enum: ['practice', 'assessment'] },
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
      scoringVersion: VERSION,
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
const CROSS_FIELD = {
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
