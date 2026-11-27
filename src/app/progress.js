// Progress, windows, forms and programme sittings: the rules of the application shell, as pure
// functions over the stored records. No DOM and no storage access, so they are unit-tested in
// tests/progress.test.mjs.
//
// `data` is { participant, sittings, attempts, selfReports }, as loaded by loadData().
//
// Rules (docs/ARCHITECTURE.md, Application shell):
//   - A sitting covers one skill in one mode. Its steps are stepsFor(skill, mode): the
//     self-report (assessment only), then the tasks, in order.
//   - Practice sittings are unlimited, never counted as evidence, and have no window.
//   - Assessment sittings belong to a window: "self" (started by the student from a skill page)
//     or "programme:<code>" (started with a coach's sitting code). A participant has at most one
//     assessment sitting per skill per window.
//   - A programme code starts a full battery: one assessment sitting per available skill, in the
//     fixed canonical order, recorded in each sitting's `programme.skillOrder`.

import { SCHEMA_VERSION, APP_VERSION, SCORING_VERSION } from '../core/version.js';
import { newSittingId } from '../core/ids.js';
import { randomSeed } from '../core/rng.js';
import { stepsFor } from '../skills/registry.js';
import { assignForm } from '../skills/runner.js';

export const SELF_WINDOW = 'self';
export const programmeWindowId = (code) => `programme:${code}`;

/** Load every record the shell needs. */
export async function loadData(store) {
  const [participants, sittings, attempts, selfReports] = await Promise.all([
    store.list('participant'), store.list('sitting'), store.list('taskAttempt'), store.list('selfReport'),
  ]);
  const participant = participants[0] || null;
  const mine = participant ? sittings.filter((s) => s.participantId === participant.id) : [];
  const ids = new Set(mine.map((s) => s.id));
  return {
    participant,
    sittings: mine.sort(byStart),
    attempts: attempts.filter((a) => ids.has(a.sittingId)),
    selfReports: selfReports.filter((r) => ids.has(r.sittingId)),
  };
}

function byStart(a, b) {
  return a.startedAt === b.startedAt ? a.id.localeCompare(b.id) : a.startedAt.localeCompare(b.startedAt);
}

/**
 * Normalise a coach's sitting code: upper case, spaces removed. The format is 2 to 12 letters
 * or digits, a hyphen and a window digit, for example "SEP26-1" (start of programme) and
 * "SEP26-2" (end). Returns null if malformed.
 * @param {string} input
 * @returns {{ code: string, window: number } | null}
 */
export function parseSittingCode(input) {
  if (typeof input !== 'string') return null;
  const code = input.toUpperCase().replace(/\s+/g, '');
  const m = /^[A-Z0-9]{2,12}-([1-9])$/.exec(code);
  return m ? { code, window: Number(m[1]) } : null;
}

/** The stored record (attempt or self-report) of one step in one sitting, or null. */
export function recordFor(data, sitting, step) {
  const list = step.kind === 'selfReport'
    ? data.selfReports.filter((r) => r.sittingId === sitting.id && r.skillId === sitting.skillId)
    : data.attempts.filter((a) => a.sittingId === sitting.id && a.taskId === step.id);
  return list.find((r) => r.status === 'complete') || list.find((r) => r.status === 'in-progress') || null;
}

/** @returns {'not-started' | 'in-progress' | 'complete'} */
export function stepState(data, sitting, step) {
  const r = recordFor(data, sitting, step);
  return r ? r.status : 'not-started';
}

/** The first step of a sitting that is not complete, or null when every step is complete. */
export function nextStep(data, sitting, steps) {
  return steps.find((s) => stepState(data, sitting, s) !== 'complete') || null;
}

/** @returns {'not-started' | 'in-progress' | 'complete'} */
export function sittingState(data, sitting, steps) {
  if (!sitting) return 'not-started';
  if (sitting.completedAt || steps.every((s) => stepState(data, sitting, s) === 'complete')) return 'complete';
  return 'in-progress';
}

/** Sittings of one skill in one mode, oldest first. */
export function sittingsOf(data, skillId, mode) {
  return data.sittings.filter((s) => s.skillId === skillId && s.mode === mode);
}

/** The latest practice sitting of a skill, or null. */
export const latestPractice = (data, skillId) => sittingsOf(data, skillId, 'practice').at(-1) || null;

/** The self-directed assessment sitting of a skill (window "self"), or null. */
export const selfAssessment = (data, skillId) => sittingsOf(data, skillId, 'assessment').find((s) => s.windowId === SELF_WINDOW) || null;

/**
 * Status of a skill in one mode, for the hub tile.
 * Practice: the latest practice sitting. Assessment: the latest assessment sitting, any window.
 * @returns {'not-started' | 'in-progress' | 'complete'}
 */
export function modeStatus(data, skill, mode) {
  const sitting = sittingsOf(data, skill.id, mode).at(-1) || null;
  return sittingState(data, sitting, stepsFor(skill, mode));
}

/** Latest activity across every record, as an ISO date-time, or null. */
export function lastActivity(data) {
  const times = [];
  if (data.participant) times.push(data.participant.createdAt);
  for (const s of data.sittings) times.push(s.startedAt, s.completedAt);
  for (const r of [...data.attempts, ...data.selfReports]) times.push(r.updatedAt);
  return times.filter(Boolean).sort().at(-1) || null;
}

/** Build a new sitting record (not saved). */
export function newSitting({ participant, skillId, mode, windowId = null, programme = null, formId, now = () => Date.now(), seed = randomSeed() }) {
  return {
    type: 'sitting',
    schemaVersion: SCHEMA_VERSION,
    id: newSittingId(),
    participantId: participant.id,
    skillId,
    mode,
    windowId,
    programme,
    formId: mode === 'practice' ? 'practice' : formId,
    seed,
    appVersion: APP_VERSION,
    scoringVersion: SCORING_VERSION,
    startedAt: new Date(now()).toISOString(),
    completedAt: null,
  };
}

/** Form for a new self-directed assessment sitting of a skill. */
export function formForSelfAssessment(data, skillId) {
  const previous = sittingsOf(data, skillId, 'assessment').at(-1);
  return assignForm({ participantId: data.participant.id, previousFormId: previous ? previous.formId : null });
}

/**
 * Can a self-directed assessment of this skill be started? One per skill in the "self" window.
 * @returns {{ ok: boolean, reason?: string, sitting?: object }}
 */
export function canStartSelfAssessment(data, skillId) {
  const existing = selfAssessment(data, skillId);
  if (existing) return { ok: false, reason: 'exists', sitting: existing };
  if (activeProgramme(data)) return { ok: false, reason: 'programme' };
  return { ok: true };
}

/** Every programme sitting with this code, in battery order. */
export function programmeSittings(data, code) {
  return data.sittings.filter((s) => s.programme && s.programme.code === code).sort((a, b) => a.programme.position - b.programme.position);
}

/**
 * The programme battery in progress, if any: the most recent programme code with an incomplete
 * sitting. Returns { code, window, skillOrder, sittings } or null.
 * @param {object} data
 * @param {(skillId: string) => object | undefined} [getSkill]  registry lookup, to judge completeness by steps
 */
export function activeProgramme(data, getSkill) {
  const codes = [...new Set(data.sittings.filter((s) => s.programme).map((s) => s.programme.code))];
  for (const code of codes.reverse()) {
    const sittings = programmeSittings(data, code);
    const incomplete = sittings.some((s) => {
      if (s.completedAt) return false;
      const skill = getSkill && getSkill(s.skillId);
      return skill ? sittingState(data, s, stepsFor(skill, 'assessment')) !== 'complete' : true;
    });
    if (incomplete) return { code, window: sittings[0].programme.window, skillOrder: sittings[0].programme.skillOrder, sittings };
  }
  return null;
}

/**
 * Check a programme code before starting a battery.
 * @returns {{ ok: true, code: string, window: number } | { ok: false, reason: 'format' | 'used' | 'active' | 'empty' }}
 */
export function checkProgrammeCode(data, input, skillOrder) {
  const parsed = parseSittingCode(input);
  if (!parsed) return { ok: false, reason: 'format' };
  if (programmeSittings(data, parsed.code).length) return { ok: false, reason: 'used' };
  if (activeProgramme(data)) return { ok: false, reason: 'active' };
  if (!skillOrder.length) return { ok: false, reason: 'empty' };
  return { ok: true, ...parsed };
}

/**
 * The sittings of a new programme battery (not saved): one assessment sitting per skill, in the
 * fixed order given, each recording the order and its position in it. The form of every skill is
 * set by the window number (assignForm).
 */
export function newProgrammeSittings({ participant, code, window, skillOrder, now = () => Date.now() }) {
  const formId = assignForm({ participantId: participant.id, programmeWindow: window });
  return skillOrder.map((skillId, position) => newSitting({
    participant,
    skillId,
    mode: 'assessment',
    windowId: programmeWindowId(code),
    programme: { code, window, skillOrder: skillOrder.slice(), position },
    formId,
    now,
  }));
}

/**
 * The next step of a programme battery: the first incomplete step of the first incomplete
 * sitting, in the fixed order. Returns { sitting, step } or null.
 */
export function nextProgrammeStep(data, programme, getSkill) {
  for (const s of programme.sittings) {
    const skill = getSkill(s.skillId);
    if (!skill) continue;
    const step = nextStep(data, s, stepsFor(skill, 'assessment'));
    if (step) return { sitting: s, step };
  }
  return null;
}

/**
 * May this step be started now? Practice steps may be taken in any order. Assessment steps are
 * taken in order; in a programme battery, every earlier skill must be complete first.
 */
export function stepAllowed(data, sitting, step, steps, getSkill) {
  if (sitting.mode === 'practice') return true;
  const first = nextStep(data, sitting, steps);
  if (!first || first.id !== step.id) return stepState(data, sitting, step) === 'complete';
  if (sitting.programme && getSkill) {
    const earlier = programmeSittings(data, sitting.programme.code).filter((s) => s.programme.position < sitting.programme.position);
    return earlier.every((s) => {
      const skill = getSkill(s.skillId);
      return !skill || sittingState(data, s, stepsFor(skill, 'assessment')) === 'complete';
    });
  }
  return true;
}
