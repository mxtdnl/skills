// Communication tasks (S9): content rules, scoring, adversarial response patterns (always the first
// option, random selection), the rewrite's coach-scorable flag and the disabled rubric scorer
// (audit A-7, B-1, E-1; audit/BUILD-PLAN.md S9).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { validateContent, validateManifest, stepsFor } from '../src/skills/registry.js';
import { runStep } from '../src/skills/runner.js';
import { createRng, seedFromString } from '../src/core/rng.js';
import { MemoryAdapter } from '../src/core/store.js';
import { validate } from '../src/core/schema.js';
import { SCORING_VERSION } from '../src/core/version.js';
import communication from '../src/skills/communication/index.js';
import { scoreClearer, scoreSpot, scoreRewrite, FACETS } from '../src/skills/communication/score.js';
import * as llm from '../src/skills/communication/llm-scorer.js';
import * as t1 from '../content/communication/cm-t1.js';
import * as t2 from '../content/communication/cm-t2.js';
import * as t3 from '../content/communication/cm-t3.js';
import * as sr from '../content/communication/self-report.js';
import * as fx from './fixtures.mjs';

const FORMS = ['formA', 'formB'];
const count = (list, f) => list.reduce((m, x) => { const k = f(x); m[k] = (m[k] || 0) + 1; return m; }, {});
const attempt = (pairs) => ({ itemResponses: pairs.map(([itemId, response]) => ({ itemId, response })) });
const words = (s) => s.trim().split(/\s+/).length;
const CURLY = /[‘’“”]/;
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) < tol, `${msg}: ${a.toFixed(3)} not within ${tol} of ${b}`);

/** The screen order the runner would give an item in a sitting with this seed (runner.js rngFor). */
const rngFor = (seed, itemId) => createRng(seedFromString(`${seedFromString(`${seed}:communication:task`)}:${itemId}`));

// ------------------------------------------------------------------ manifest and pools

test('the communication manifest has the self-report and three tasks, each covering all three facets', () => {
  assert.deepEqual(validateManifest(communication), []);
  assert.deepEqual(communication.tasks.map((t) => t.id), ['cm-t1', 'cm-t2', 'cm-t3']);
  for (const t of communication.tasks) assert.deepEqual(t.facets, FACETS, t.id);
  assert.deepEqual(stepsFor(communication, 'assessment').map((s) => s.id), ['self-report', 'cm-t1', 'cm-t2', 'cm-t3']);
  assert.deepEqual(stepsFor(communication, 'practice').map((s) => s.id), ['cm-t1', 'cm-t2', 'cm-t3']);
});

test('every content module is valid, every item is draft, and no item ID is shared', async () => {
  const seen = new Set([...sr.formA, ...sr.formB, ...sr.retrospective].map((it) => it.id));
  for (const task of communication.tasks) {
    const content = await task.loadContent();
    assert.deepEqual(validateContent(content), [], task.id);
    for (const pool of ['formA', 'formB', 'practice']) {
      assert.ok(content[pool].length > 0, `${task.id} ${pool}`);
      for (const it of content[pool]) {
        assert.equal(it.status, 'draft', it.id);
        assert.match(it.id, new RegExp(`^CM-${task.id.slice(3).toUpperCase()}-${pool === 'practice' ? 'P' : pool.slice(-1)}\\d\\d$`), it.id);
        assert.ok(!seen.has(it.id), `${it.id} used twice`);
        seen.add(it.id);
        assert.ok(!CURLY.test(JSON.stringify(it)), `${it.id}: straight quotes only`);
        assert.ok(['business', 'academic'].includes(it.genre), `${it.id}: genre`);
      }
    }
  }
});

// ------------------------------------------------------------------ CM-T1 Which is clearer?

test('CM-T1 forms: 10 pairs, every clarity dimension, parallel by position, both genres equally', () => {
  for (const f of FORMS) {
    const items = t1[f];
    assert.equal(items.length, 10, f);
    assert.deepEqual(count(items, (it) => it.dimension), { ambiguity: 2, buried: 1, structure: 1, jargon: 2, register: 1, reasoning: 3 }, f);
    assert.deepEqual(count(items, (it) => it.facet), { CM1: 4, CM2: 3, CM3: 3 }, f);
    assert.deepEqual(count(items, (it) => it.genre), { business: 5, academic: 5 }, f);
  }
  t1.formA.forEach((a, i) => {
    const b = t1.formB[i];
    assert.equal(a.dimension, b.dimension, `position ${i}`);
    assert.equal(a.genre, b.genre, `position ${i}`);
  });
});

test('CM-T1 items: two different versions, one key, four distinct reasons including the item\'s dimension once, and a rationale', () => {
  for (const it of [...t1.formA, ...t1.formB, ...t1.practice]) {
    assert.equal(it.facet, t1.DIMENSIONS[it.dimension].facet, it.id);
    assert.equal(it.versions.length, 2, it.id);
    assert.notEqual(it.versions[0], it.versions[1], it.id);
    assert.ok([0, 1].includes(it.key), it.id);
    assert.equal(it.reasons.length, 4, it.id);
    assert.equal(new Set(it.reasons).size, 4, `${it.id}: distinct reasons`);
    for (const r of it.reasons) assert.ok(t1.REASONS[r], `${it.id}: reason ${r}`);
    assert.equal(it.reasons.filter((r) => r === it.dimension).length, 1, it.id);
    assert.equal(it.reasons[it.reasonKey], it.dimension, it.id);
    assert.ok(it.context && it.context.length > 10, it.id);
    assert.ok(words(it.rationale) >= 25, `${it.id}: rationale`);
    for (const v of it.versions) assert.ok(words(v) <= 70, `${it.id}: versions of at most 70 words`);
  }
});

test('CM-T1 "It is shorter" is a distractor only where the clearer version is the longer one (audit A-7)', () => {
  let used = 0;
  for (const it of [...t1.formA, ...t1.formB, ...t1.practice]) {
    if (!it.reasons.includes('shorter')) continue;
    used += 1;
    assert.ok(words(it.versions[it.key]) > words(it.versions[1 - it.key]), `${it.id}: the clearer version must be longer`);
  }
  assert.ok(used >= 2, 'the shortening trap appears on each form');
  for (const f of FORMS) assert.ok(t1[f].some((it) => it.reasons.includes('shorter')), f);
});

test('CM-T1 keys are balanced: Version 1 is the clearer five times per form; each reason position holds the key two or three times', () => {
  for (const f of FORMS) {
    assert.deepEqual(count(t1[f], (it) => it.key), { 0: 5, 1: 5 }, f);
    const positions = count(t1[f], (it) => it.reasonKey);
    for (let p = 0; p < 4; p++) assert.ok(positions[p] >= 2 && positions[p] <= 3, `${f} reason position ${p}: ${positions[p]}`);
  }
});

test('CM-T1 scoring: two points per pair; facet scores are proportions of points; parts are reported; latest answer counts', () => {
  const form = t1.formA;
  const perfect = scoreClearer(attempt(form.map((it) => [it.id, { version: it.key, reason: it.reasonKey }])), form);
  assert.deepEqual(perfect, { rawScore: 20, score: { CM1: 1, CM2: 1, CM3: 1, version: 1, reason: 1 } });
  assert.deepEqual(scoreClearer(attempt([]), form), { rawScore: 0, score: { CM1: 0, CM2: 0, CM3: 0, version: 0, reason: 0 } });
  // Version right, reason wrong on every pair: half the points.
  const half = scoreClearer(attempt(form.map((it) => [it.id, { version: it.key, reason: (it.reasonKey + 1) % 4 }])), form);
  assert.deepEqual(half, { rawScore: 10, score: { CM1: 0.5, CM2: 0.5, CM3: 0.5, version: 1, reason: 0 } });
  // The latest response counts; malformed responses are wrong.
  const it0 = form[0];
  const changed = scoreClearer(attempt([[it0.id, { version: it0.key, reason: it0.reasonKey }], [it0.id, { version: 1 - it0.key, reason: it0.reasonKey }]]), form);
  assert.equal(changed.rawScore, 1);
  assert.equal(scoreClearer(attempt([[it0.id, { version: String(it0.key), reason: null }]]), form).rawScore, 0);
  assert.equal(scoreClearer(attempt([[it0.id, null]]), form).rawScore, 0);
  assert.deepEqual(scoreClearer(attempt([]), []), { rawScore: 0, score: { CM1: null, CM2: null, CM3: null, version: null, reason: null } });
});

// ------------------------------------------------------------------ CM-T2 Spot the problem

test('CM-T2 forms: 6 passages, two per facet, three business and three academic, parallel by position', () => {
  for (const f of FORMS) {
    const items = t2[f];
    assert.equal(items.length, 6, f);
    assert.deepEqual(count(items, (it) => it.problem), { ambiguity: 1, buried: 1, jargon: 1, register: 1, reasoning: 2 }, f);
    assert.deepEqual(count(items, (it) => it.facet), { CM1: 2, CM2: 2, CM3: 2 }, f);
    assert.deepEqual(count(items, (it) => it.genre), { business: 3, academic: 3 }, f);
  }
  t2.formA.forEach((a, i) => assert.equal(a.problem, t2.formB[i].problem, `position ${i}`));
  assert.deepEqual(new Set(t2.practice.map((it) => it.problem)), new Set(t2.PROBLEM_CODES), 'practice covers every kind of problem');
});

test('CM-T2 items: five sentences, nothing marked, one key sentence, a known problem, and a rationale', () => {
  for (const it of [...t2.formA, ...t2.formB, ...t2.practice]) {
    assert.equal(it.sentences.length, 5, it.id);
    assert.ok(Number.isInteger(it.key) && it.key >= 0 && it.key < 5, it.id);
    assert.ok(t2.PROBLEMS[it.problem], it.id);
    assert.equal(it.facet, t2.PROBLEMS[it.problem].facet, it.id);
    assert.ok(words(it.rationale) >= 25, `${it.id}: rationale`);
    for (const s of it.sentences) assert.ok(!/[_*<>]|\[|\]/.test(s), `${it.id}: no marks in the passage`);
    if (it.problem === 'buried') assert.ok(it.key >= 3, `${it.id}: a buried main point comes late`);
  }
});

test('CM-T2 key sentences: every position is used, none more than twice per form', () => {
  for (const f of FORMS) {
    const positions = count(t2[f], (it) => it.key);
    for (let p = 0; p < 5; p++) assert.ok(positions[p] >= 1 && positions[p] <= 2, `${f} sentence ${p + 1}: ${positions[p]}`);
  }
});

test('CM-T2 scoring: all-or-nothing per part; the kind of problem is credited independently of the sentence', () => {
  const form = t2.formB;
  const perfect = scoreSpot(attempt(form.map((it) => [it.id, { sentence: it.key, problem: it.problem }])), form);
  assert.deepEqual(perfect, { rawScore: 12, score: { CM1: 1, CM2: 1, CM3: 1, sentence: 1, problem: 1 } });
  assert.deepEqual(scoreSpot(attempt([]), form), { rawScore: 0, score: { CM1: 0, CM2: 0, CM3: 0, sentence: 0, problem: 0 } });
  // The neighbouring sentence gets nothing for the sentence part: no partial credit for "close".
  const near = scoreSpot(attempt(form.map((it) => [it.id, { sentence: (it.key + 1) % 5, problem: it.problem }])), form);
  assert.deepEqual(near.score, { CM1: 0.5, CM2: 0.5, CM3: 0.5, sentence: 0, problem: 1 });
  const wrongKind = scoreSpot(attempt(form.map((it) => [it.id, { sentence: it.key, problem: it.problem === 'jargon' ? 'register' : 'jargon' }])), form);
  assert.deepEqual(wrongKind.score, { CM1: 0.5, CM2: 0.5, CM3: 0.5, sentence: 1, problem: 0 });
  assert.equal(scoreSpot(attempt([[form[0].id, { sentence: '0', problem: 0 }]]), form).rawScore, 0);
});

// ------------------------------------------------------------------ adversarial: always first, random

test('adversarial: always choosing the first option scores at chance on CM-T1', () => {
  for (const f of FORMS) {
    const form = t1[f];
    const runs = 2000;
    let version = 0; let reason = 0; let facets = 0;
    for (let s = 1; s <= runs; s++) {
      const pairs = form.map((it) => {
        const order = rngFor(s, it.id).shuffle(it.reasons.map((_, i) => i));
        return [it.id, { version: 0, reason: order[0], reasonPosition: 0, reasonOrder: order }];
      });
      const out = scoreClearer(attempt(pairs), form).score;
      version += out.version; reason += out.reason; facets += (out.CM1 + out.CM2 + out.CM3) / 3;
    }
    assert.equal(version / runs, 0.5, `${f}: Version 1 every time is exactly 1 in 2`);
    close(reason / runs, 0.25, 0.02, `${f}: first reason every time`);
    close(facets / runs, 0.375, 0.02, `${f}: facet mean`);
  }
});

test('adversarial: always choosing the first sentence, or any one fixed sentence, scores at or near chance on CM-T2', () => {
  for (const f of FORMS) {
    const form = t2[f];
    for (let p = 0; p < 5; p++) {
      const out = scoreSpot(attempt(form.map((it) => [it.id, { sentence: p, problem: 'ambiguity' }])), form).score;
      assert.ok(out.sentence <= 2 / 6 + 1e-9, `${f}: always sentence ${p + 1} scored ${out.sentence}`);
    }
    const runs = 2000;
    let sentence = 0; let problem = 0;
    for (let s = 1; s <= runs; s++) {
      const pairs = form.map((it) => {
        const order = rngFor(s, it.id).shuffle(t2.PROBLEM_CODES.slice());
        return [it.id, { sentence: 0, problem: order[0], problemPosition: 0, problemOrder: order }];
      });
      const out = scoreSpot(attempt(pairs), form).score;
      sentence += out.sentence; problem += out.problem;
    }
    close(sentence / runs, 0.2, 0.04, `${f}: always sentence 1`);
    close(problem / runs, 0.2, 0.02, `${f}: always the first kind of problem on screen`);
  }
});

test('adversarial: random selection scores at chance on CM-T1 and CM-T2', () => {
  const runs = 3000;
  const rng = createRng(20261127);
  for (const f of FORMS) {
    let version = 0; let reason = 0; let sentence = 0; let problem = 0; let t1Facets = 0; let t2Facets = 0;
    for (let s = 0; s < runs; s++) {
      const a = scoreClearer(attempt(t1[f].map((it) => [it.id, { version: rng.int(2), reason: rng.int(4) }])), t1[f]).score;
      const b = scoreSpot(attempt(t2[f].map((it) => [it.id, { sentence: rng.int(5), problem: t2.PROBLEM_CODES[rng.int(5)] }])), t2[f]).score;
      version += a.version; reason += a.reason; t1Facets += (a.CM1 + a.CM2 + a.CM3) / 3;
      sentence += b.sentence; problem += b.problem; t2Facets += (b.CM1 + b.CM2 + b.CM3) / 3;
    }
    close(version / runs, 0.5, 0.02, `${f} CM-T1 version`);
    close(reason / runs, 0.25, 0.02, `${f} CM-T1 reason`);
    close(t1Facets / runs, 0.375, 0.02, `${f} CM-T1 facets`);
    close(sentence / runs, 0.2, 0.02, `${f} CM-T2 sentence`);
    close(problem / runs, 0.2, 0.02, `${f} CM-T2 problem`);
    close(t2Facets / runs, 0.2, 0.02, `${f} CM-T2 facets`);
  }
});

// ------------------------------------------------------------------ CM-T3 Rewrite

test('CM-T3 content: one passage per form, a five-point checklist, a model and a note on every point', () => {
  assert.equal(t3.formA.length, 1);
  assert.equal(t3.formB.length, 1);
  assert.ok(t3.practice.length >= 1);
  assert.deepEqual(t3.RUBRIC.map((p) => p.id), ['mainPoint', 'words', 'reasons', 'references', 'register']);
  assert.deepEqual(new Set(t3.RUBRIC.map((p) => p.facet)), new Set(FACETS), 'the checklist covers every facet');
  assert.deepEqual(t3.SELF_CHECK.map((o) => o.value), ['yes', 'partly', 'no']);
  for (const it of [...t3.formA, ...t3.formB, ...t3.practice]) {
    for (const k of ['reader', 'goal', 'passage', 'model']) assert.ok(typeof it[k] === 'string' && it[k].length > 10, `${it.id}: ${k}`);
    assert.ok(words(it.passage) <= 80, `${it.id}: a short passage`);
    for (const p of t3.RUBRIC) assert.ok(words(it.notes[p.id] || '') >= 10, `${it.id}: note on ${p.id}`);
  }
});

test('CM-T3 scoring: no automated score; coach-scorable only for a finished, non-empty rewrite', () => {
  const form = t3.formA;
  const id = form[0].id;
  const done = (text, extra = {}) => attempt([[id, { text, final: true, stage: 'check', selfCheck: { mainPoint: 'yes' }, copiedOriginal: false, ...extra }]]);
  assert.deepEqual(scoreRewrite(done('Dear Ms Patel, could I move group?'), form), { rawScore: null, score: null, coachScorable: true });
  assert.deepEqual(scoreRewrite(done('   '), form), { rawScore: null, score: null, coachScorable: false });
  assert.deepEqual(scoreRewrite(done('Some text', { final: false }), form), { rawScore: null, score: null, coachScorable: false });
  assert.deepEqual(scoreRewrite(attempt([]), form), { rawScore: null, score: null, coachScorable: false });
  assert.deepEqual(scoreRewrite(attempt([[id, 'not an object']]), form), { rawScore: null, score: null, coachScorable: false });
  // Nothing about the text changes the result: keyword salad, the original pasted back and a
  // careful rewrite are all simply stored for a coach (audit B-1).
  const salad = scoreRewrite(done('main point first clear reason because therefore plain audience tone'), form);
  const pasted = scoreRewrite(done(form[0].passage), form);
  const careful = scoreRewrite(done(form[0].model), form);
  assert.deepEqual(salad, careful);
  assert.deepEqual(pasted, careful);
});

test('the runner stores the rewrite text and self-check, a null score and coachScorable on completion', async () => {
  const store = new MemoryAdapter();
  const sitting = fx.sitting({ skillId: 'communication', formId: 'B' });
  const def = communication.tasks.find((t) => t.id === 'cm-t3');
  const selfCheck = { mainPoint: 'yes', words: 'partly', reasons: 'yes', references: 'no', register: 'yes' };
  const fake = {
    ...def,
    mount: (el, ctx) => {
      const t0 = ctx.now();
      ctx.record({ itemId: ctx.items[0].id, response: { text: 'Draft', final: false, stage: 'write', selfCheck: {}, copiedOriginal: true }, shownAt: t0 });
      ctx.record({ itemId: ctx.items[0].id, response: { text: 'Could you approve a delay?', final: true, stage: 'check', selfCheck, copiedOriginal: true }, shownAt: t0 });
      ctx.complete();
    },
  };
  const record = await runStep({ skill: communication, step: { kind: 'task', id: 'cm-t3', def: fake }, sitting, store, el: null }).done;
  assert.equal(record.status, 'complete');
  assert.equal(record.scoringVersion, SCORING_VERSION);
  assert.equal(record.score, null);
  assert.equal(record.rawScore, null);
  assert.equal(record.coachScorable, true);
  assert.equal(record.itemResponses.length, 2);
  assert.equal(record.itemResponses[1].itemId, 'CM-T3-B01');
  assert.deepEqual(record.itemResponses[1].response.selfCheck, selfCheck);
  assert.deepEqual(validate('taskAttempt', record).errors, []);
  // The flag is set only on completion.
  assert.ok(validate('taskAttempt', { ...record, status: 'in-progress', completedAt: null, coachScorable: true }).errors.some((e) => e.path === '$.coachScorable'));
});

test('the language-model rubric scorer is disabled and sends nothing', async () => {
  const original = globalThis.fetch;
  let called = false;
  globalThis.fetch = () => { called = true; throw new Error('no network'); };
  try {
    assert.equal(llm.isEnabled(), false);
    assert.equal(llm.LLM_RUBRIC_SCORER.enabled, false);
    assert.deepEqual(await llm.score({ itemId: 'CM-T3-A01', reader: '', goal: '', passage: '', text: 'x', rubric: t3.RUBRIC }), { status: 'disabled' });
    assert.throws(() => llm.configure({ endpoint: 'x' }), /disabled/);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = original;
  }
});

// ------------------------------------------------------------------ no legacy formula

test('no legacy Message Editing formula is ported: no keyword, concision, specificity or novelty scoring in the communication code', () => {
  const dir = fileURLToPath(new URL('../src/skills/communication/', import.meta.url));
  for (const file of ['index.js', 'score.js', 'clearer.js', 'spot.js', 'rewrite.js', 'two-part.js', 'llm-scorer.js']) {
    const code = readFileSync(dir + file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
    assert.ok(!/keyword|concis|specific|novel|scoreME|wordCount|\.length\s*\/\s*\w*words/i.test(code), `${file}: legacy scoring term found`);
  }
});
