// Runs one step (a self-report or a task) of one skill within a sitting and stores it.
//
// The runner is the only code that turns a step's raw responses into a TaskAttempt or
// SelfReport record: it picks the item pool for the sitting's mode and form, builds the step
// context, collects responses, calls the step's pure score() function, and saves the result.
// Steps never write to storage themselves.
//
// Autosave (S5). The record is saved as soon as the step starts (status "in-progress"), again
// after every response, and once more, scored, on completion (status "complete"). Passing the
// in-progress record back as `existing` resumes the step at the next unanswered item: the
// step reads ctx.resume (the responses already recorded) and carries on from there.

import { createRng, seedFromString } from '../core/rng.js';
import { createTimer } from '../core/timing.js';
import { newAttemptId, newSelfReportId } from '../core/ids.js';
import { SCHEMA_VERSION, SCORING_VERSION } from '../core/version.js';
import { validateContent } from './registry.js';

/**
 * Items for a sitting. Practice sittings get the practice pool; assessment sittings get form A
 * or B. The pools never mix (global rule).
 * @param {{ formA: object[], formB: object[], practice: object[] }} content
 * @param {'practice' | 'assessment'} mode
 * @param {string} formId
 * @returns {object[]}
 */
export function itemsFor(content, mode, formId) {
  if (mode === 'practice') {
    if (formId !== 'practice') throw new RangeError('itemsFor: practice mode uses formId "practice"');
    return content.practice.slice();
  }
  if (mode === 'assessment') {
    if (formId === 'A') return content.formA.slice();
    if (formId === 'B') return content.formB.slice();
    throw new RangeError(`itemsFor: unknown assessment form "${formId}"`);
  }
  throw new RangeError(`itemsFor: unknown mode "${mode}"`);
}

/**
 * The form a participant takes first: the parity of a hash (FNV-1a, rng.js seedFromString) of
 * their participant ID. Even means A first, odd means B first, which splits a cohort roughly in
 * half between A-then-B and B-then-A (audit D-2). Because it depends only on the code, a
 * student who re-enters their code on another device keeps the same order.
 * @param {string} participantId
 * @returns {'A' | 'B'}
 */
export function firstForm(participantId) {
  return seedFromString(participantId) % 2 === 0 ? 'A' : 'B';
}

/**
 * True for an assessment sitting at the end of the programme: a programme sitting whose window
 * is even (window 2 is the end; the same parity rule as assignForm). Only these sittings show a
 * self-report's retrospective items (audit D-5).
 * @param {object} sitting
 * @returns {boolean}
 */
export function isProgrammeEnd(sitting) {
  return Boolean(sitting && sitting.mode === 'assessment' && sitting.programme && sitting.programme.window % 2 === 0);
}

/** @param {'A' | 'B'} formId */
export const otherForm = (formId) => (formId === 'A' ? 'B' : 'A');

/**
 * Form for a new assessment sitting of one skill.
 *   - Programme sittings: the window number in the sitting code decides. Odd windows (1, the
 *     start of the programme) get the participant's first form; even windows (2, the end) get
 *     the other. This holds even if the student's browser data was lost in between.
 *   - Self-directed sittings: the other form from the participant's most recent assessment
 *     sitting of the same skill, or their first form if there is none.
 * @param {{ participantId: string, programmeWindow?: number | null, previousFormId?: string | null }} args
 * @returns {'A' | 'B'}
 */
export function assignForm({ participantId, programmeWindow = null, previousFormId = null }) {
  const first = firstForm(participantId);
  if (programmeWindow !== null) return programmeWindow % 2 === 1 ? first : otherForm(first);
  if (previousFormId === 'A' || previousFormId === 'B') return otherForm(previousFormId);
  return first;
}

/**
 * Mount a step, autosave every response, and on completion score it and save the record.
 *
 * @param {object} args
 * @param {object} args.skill        manifest from the registry
 * @param {{ kind: 'task' | 'selfReport', id: string, def: object }} args.step  from stepsFor()
 * @param {object} args.sitting      a valid Sitting record
 * @param {object} args.store        storage adapter (store.js)
 * @param {HTMLElement | null} args.el  where the step renders
 * @param {object | null} [args.existing]  an in-progress record of this step, to resume
 * @param {number} [args.multiplier=1]  accommodation multiplier for timed tasks
 * @param {() => number} [args.now]
 * @param {(error: Error) => void} [args.onSaveError]  called if an autosave fails
 * @returns {{ done: Promise<object | null>, cancel: () => Promise<void>, flush: () => Promise<void> }}
 *   done resolves with the completed record, or null if cancelled (the in-progress record stays
 *   saved, so the step can be resumed)
 */
export function runStep({ skill, step, sitting, store, el, existing = null, multiplier = 1, now = () => Date.now(), onSaveError = () => {} }) {
  const isTask = step.kind === 'task';
  const type = isTask ? 'taskAttempt' : 'selfReport';
  const listKey = isTask ? 'itemResponses' : 'responses';
  const def = step.def;
  const iso = () => new Date(now()).toISOString();

  if (existing && (existing.status !== 'in-progress' || existing.sittingId !== sitting.id || existing.type !== type)) {
    throw new RangeError('runStep: existing must be an in-progress record of this step in this sitting');
  }

  /** The record as it stands. Mutated in place and saved after every change. */
  const record = existing
    ? structuredClone(existing)
    : {
        type,
        schemaVersion: SCHEMA_VERSION,
        id: isTask ? newAttemptId() : newSelfReportId(),
        sittingId: sitting.id,
        skillId: skill.id,
        ...(isTask ? { taskId: step.id } : {}),
        [listKey]: [],
        ...(isTask ? { rawScore: null } : {}),
        score: null,
        scoringVersion: SCORING_VERSION,
        status: 'in-progress',
        startedAt: iso(),
        updatedAt: iso(),
        completedAt: null,
      };

  let cleanup = null;
  let cancelled = false;
  let timer = null;
  let finish = () => {};
  let queue = Promise.resolve();

  // Saves run one after another, in order, so a later response never lands before an earlier one.
  const save = () => {
    const snapshot = structuredClone(record);
    queue = queue.then(() => store.save(type, snapshot)).then(() => {}, (e) => onSaveError(e));
    return queue;
  };
  const touch = () => {
    record.updatedAt = iso();
    if (timer && record.status === 'in-progress') record.timerSnapshot = timer.snapshot();
  };

  const done = (async () => {
    const content = await def.loadContent();
    const problems = validateContent(content);
    if (problems.length) throw new TypeError(`Content for ${skill.id}/${step.id} is invalid:\n${problems.join('\n')}`);
    const items = itemsFor(content, sitting.mode, sitting.formId);
    // End-of-programme retrospective items follow the form's own items (self-reports only).
    if (!isTask && isProgrammeEnd(sitting) && Array.isArray(content.retrospective)) items.push(...content.retrospective);
    const taskSeed = seedFromString(`${sitting.seed}:${skill.id}:${step.id}`);
    const rng = createRng(taskSeed);
    if (cancelled) return null; // cancelled while content was loading: nothing to save
    if (!existing) save();

    const finished = new Promise((resolve) => {
      finish = resolve;
      const ctx = {
        skillId: skill.id,
        taskId: step.id,
        kind: step.kind,
        mode: sitting.mode,
        formId: sitting.formId,
        /** True in an end-of-programme sitting (retrospective items are then among ctx.items). */
        programmeEnd: isProgrammeEnd(sitting),
        items,
        rng,
        /** A generator for one item, the same on every mount, so a resumed step shows the same order. */
        rngFor: (itemId) => createRng(seedFromString(`${taskSeed}:${itemId}`)),
        /** Responses already recorded (when resuming). Continue from the next item. */
        resume: structuredClone(record[listKey]),
        now,
        /** Create the step's timer, with the participant's accommodation applied; restored when resuming. */
        createTimer(limitMs, opts = {}) {
          const restore = record.timerSnapshot;
          timer = restore
            ? createTimer({ now, ...opts, limitMs: restore.limitMs, multiplier: restore.multiplier, restore })
            : createTimer({ limitMs, multiplier, now, ...opts });
          return timer;
        },
        /**
         * Record one item response and autosave. shownAt is epoch ms from ctx.now().
         * @param {{ itemId: string, response: *, shownAt: number, answeredAt?: number | null }} r
         * @returns {Promise<void>} resolves when saved
         */
        record({ itemId, response, shownAt, answeredAt = now() }) {
          record[listKey].push({
            itemId,
            response: response === undefined ? null : response,
            rtMs: answeredAt === null ? null : Math.max(0, answeredAt - shownAt),
            shownAt: new Date(shownAt).toISOString(),
          });
          touch();
          return save();
        },
        /** Save the timer state without a response (for example, after a pause). */
        checkpoint() { touch(); return save(); },
        complete: () => resolve(),
      };
      cleanup = def.mount(el, ctx) || null;
    });

    await finished;
    if (cleanup) cleanup();
    if (cancelled) { await queue; return null; }

    if (timer) record.timing = timer.stop();
    delete record.timerSnapshot;
    const result = def.score(record, items);
    if (isTask) record.rawScore = result.rawScore === undefined ? null : result.rawScore;
    record.score = result.score === undefined ? null : result.score;
    // Self-reports (scoringVersion 1.0.0-draft): retrospective means and response-quality
    // indicators, kept for the coach view and never shown to the student.
    if (!isTask && result.retrospective !== undefined) record.retrospective = result.retrospective;
    if (!isTask && result.quality !== undefined) record.quality = result.quality;
    record.scoringVersion = SCORING_VERSION;
    record.status = 'complete';
    record.updatedAt = iso();
    record.completedAt = record.updatedAt;
    await queue;
    return store.save(type, structuredClone(record));
  })();

  return {
    done,
    /** Stop without completing. Pauses the timer and saves, so the step resumes where it was. */
    async cancel() {
      if (cancelled) return;
      cancelled = true;
      if (timer && timer.state === 'running') timer.pause();
      if (timer) { touch(); save(); }
      finish();
      await queue;
    },
    /** Resolves when every pending autosave has finished. */
    flush: () => queue,
  };
}

/**
 * runStep for a task, kept for the S3 call shape: runTask({ skill, task, sitting, store, el }).
 * @param {object} args  as runStep, with `task` (one entry of skill.tasks) in place of `step`
 */
export function runTask({ task, ...rest }) {
  return runStep({ ...rest, step: { kind: 'task', id: task.id, def: task } });
}
