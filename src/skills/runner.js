// Runs one task of one skill within a sitting and stores the attempt.
//
// The runner is the only code that turns a task's raw responses into a TaskAttempt record: it
// picks the item pool for the sitting's mode and form, builds the task context, collects
// responses, calls the task's pure score() function, and saves the result. Tasks never write to
// storage themselves.

import { createRng, seedFromString } from '../core/rng.js';
import { createTimer } from '../core/timing.js';
import { newAttemptId } from '../core/ids.js';
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
 * Form for a new assessment sitting. A participant's second sitting gets the other form, so
 * nobody sees the same items twice; the first form is assigned by seed parity, which splits a
 * cohort roughly in half between A-then-B and B-then-A (audit D-2).
 * @param {{ seed: number, previousFormId?: string | null }} args
 * @returns {'A' | 'B'}
 */
export function assignForm({ seed, previousFormId = null }) {
  if (previousFormId === 'A') return 'B';
  if (previousFormId === 'B') return 'A';
  return (seed >>> 0) % 2 === 0 ? 'A' : 'B';
}

/**
 * Mount a task, wait for it to finish, score it and save the attempt.
 *
 * @param {object} args
 * @param {object} args.skill        manifest from the registry
 * @param {object} args.task         one entry of skill.tasks
 * @param {object} args.sitting      a valid Sitting record
 * @param {object} args.store        storage adapter (store.js)
 * @param {HTMLElement | null} args.el  where the task renders
 * @param {number} [args.multiplier=1]  accommodation multiplier for timed tasks
 * @param {() => number} [args.now]
 * @returns {{ done: Promise<object | null>, cancel: () => void }}  done resolves with the saved
 *   TaskAttempt, or null if cancelled
 */
export function runTask({ skill, task, sitting, store, el, multiplier = 1, now = () => Date.now() }) {
  let cleanup = null;
  let cancelled = false;
  let timer = null;
  let finish = () => {};
  const responses = [];

  const done = (async () => {
    const content = await task.loadContent();
    const problems = validateContent(content);
    if (problems.length) throw new TypeError(`Content for ${skill.id}/${task.id} is invalid:\n${problems.join('\n')}`);
    const items = itemsFor(content, sitting.mode, sitting.formId);
    const rng = createRng(seedFromString(`${sitting.seed}:${skill.id}:${task.id}`));

    const finished = new Promise((resolve) => {
      finish = resolve;
      const ctx = {
        skillId: skill.id,
        taskId: task.id,
        mode: sitting.mode,
        formId: sitting.formId,
        items,
        rng,
        now,
        /** Create the task's timer, with the participant's accommodation applied. */
        createTimer(limitMs, opts = {}) {
          timer = createTimer({ limitMs, multiplier, now, ...opts });
          return timer;
        },
        /**
         * Record one item response. shownAt is epoch ms from ctx.now(); rtMs is computed here.
         * @param {{ itemId: string, response: *, shownAt: number, answeredAt?: number | null }} r
         */
        record({ itemId, response, shownAt, answeredAt = now() }) {
          responses.push({
            itemId,
            response: response === undefined ? null : response,
            rtMs: answeredAt === null ? null : Math.max(0, answeredAt - shownAt),
            shownAt: new Date(shownAt).toISOString(),
          });
        },
        complete: () => resolve(),
      };
      cleanup = task.mount(el, ctx) || null;
    });

    if (cancelled) finish(); // cancelled while content was loading
    await finished;
    if (cleanup) cleanup();
    if (cancelled) return null;

    const attempt = {
      type: 'taskAttempt',
      schemaVersion: SCHEMA_VERSION,
      id: newAttemptId(),
      sittingId: sitting.id,
      skillId: skill.id,
      taskId: task.id,
      itemResponses: responses,
      rawScore: null,
      score: null,
      scoringVersion: SCORING_VERSION,
    };
    if (timer) attempt.timing = timer.stop();
    const { rawScore, score } = task.score(attempt, items);
    attempt.rawScore = rawScore;
    attempt.score = score;
    return store.save('taskAttempt', attempt);
  })();

  return {
    done,
    /** Unmount without saving; done resolves with null. */
    cancel() {
      cancelled = true;
      finish();
    },
  };
}
