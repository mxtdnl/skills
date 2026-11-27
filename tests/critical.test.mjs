// Critical thinking tasks (S7): content rules, keys recomputed from the items' own data, scoring,
// and adversarial response patterns (audit A-4, B-4; audit/BUILD-PLAN.md S7).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validateContent, validateManifest, stepsFor } from '../src/skills/registry.js';
import { createRng } from '../src/core/rng.js';
import critical from '../src/skills/critical/index.js';
import { deriveKey, score as scoreSelection } from '../src/skills/critical/selection.js';
import { score as scoreCalibration, CONFIDENCE } from '../src/skills/critical/calibration.js';
import { choiceTask } from '../src/skills/critical/choice.js';
import * as t1 from '../content/critical/ct-t1.js';
import * as t2 from '../content/critical/ct-t2.js';
import * as t3 from '../content/critical/ct-t3.js';
import * as t4 from '../content/critical/ct-t4.js';
import * as sr from '../content/critical/self-report.js';

const scoreT2 = choiceTask({ facet: 'CT2' }).score;
const scoreT4 = choiceTask({ facet: 'CT4' }).score;
const FORMS = ['formA', 'formB'];
const count = (list, f) => list.reduce((m, x) => { const k = f(x); m[k] = (m[k] || 0) + 1; return m; }, {});
const attempt = (pairs) => ({ itemResponses: pairs.map(([itemId, response]) => ({ itemId, response })) });
const words = (s) => s.trim().split(/\s+/).length;

// ------------------------------------------------------------------ manifest and pools

test('the critical thinking manifest has the self-report and four tasks, one per facet', () => {
  assert.deepEqual(validateManifest(critical), []);
  assert.deepEqual(critical.tasks.map((t) => t.id), ['ct-t1', 'ct-t2', 'ct-t3', 'ct-t4']);
  assert.deepEqual(critical.tasks.map((t) => t.facets), [['CT1'], ['CT2'], ['CT3'], ['CT4']]);
  assert.deepEqual(stepsFor(critical, 'assessment').map((s) => s.id), ['self-report', 'ct-t1', 'ct-t2', 'ct-t3', 'ct-t4']);
  assert.deepEqual(stepsFor(critical, 'practice').map((s) => s.id), ['ct-t1', 'ct-t2', 'ct-t3', 'ct-t4']);
});

test('every content module is valid, every item is draft, and no item ID is shared across tasks', async () => {
  const seen = new Set();
  for (const task of critical.tasks) {
    const content = await task.loadContent();
    assert.deepEqual(validateContent(content), [], task.id);
    for (const pool of ['formA', 'formB', 'practice']) {
      assert.ok(content[pool].length > 0, `${task.id} ${pool}`);
      for (const it of content[pool]) {
        assert.equal(it.status, 'draft', it.id);
        assert.match(it.id, new RegExp(`^CT-${task.id.slice(3).toUpperCase()}-${pool === 'practice' ? 'P' : pool.slice(-1)}\\d\\d$`), it.id);
        assert.ok(!seen.has(it.id), `${it.id} used twice`);
        seen.add(it.id);
      }
    }
  }
  for (const it of [...sr.formA, ...sr.formB, ...sr.retrospective]) assert.ok(!seen.has(it.id));
});

// ------------------------------------------------------------------ CT-T1 conditional reasoning

test('CT-T1 forms: 8 items, 4 abstract and 4 deontic, each kind with all four negation patterns', () => {
  for (const f of FORMS) {
    const items = t1[f];
    assert.equal(items.length, 8, f);
    for (const kind of ['abstract', 'deontic']) {
      const ofKind = items.filter((it) => it.kind === kind);
      assert.equal(ofKind.length, 4, `${f} ${kind}`);
      const patterns = new Set(ofKind.map((it) => `${it.negation.antecedent}/${it.negation.consequent}`));
      assert.equal(patterns.size, 4, `${f} ${kind}: every negation pattern once`);
    }
  }
  // Forms are parallel item by item: same kind and negation pattern in the same position.
  t1.formA.forEach((a, i) => {
    const b = t1.formB[i];
    assert.equal(a.kind, b.kind);
    assert.deepEqual(a.negation, b.negation);
  });
});

test('CT-T1 keys: each card shows one of P, not-P, Q, not-Q, and the key is exactly the cards that can break the rule', () => {
  for (const it of [...t1.formA, ...t1.formB, ...t1.practice]) {
    assert.deepEqual(it.cards.map((c) => c.shows).sort(), ['P', 'Q', 'notP', 'notQ'], it.id);
    assert.deepEqual([...it.key].sort(), deriveKey(it).sort(), it.id);
    assert.equal(it.key.length, 2, it.id);
    assert.ok(it.explanation && it.explanation.length > 20, it.id);
  }
});

test('CT-T1 answer patterns vary: the cards to turn are not always the first-mentioned and the negated second', () => {
  for (const f of FORMS) {
    const sets = new Set(t1[f].map((it) => it.key.map((k) => it.cards[k].shows).sort().join('+')));
    assert.equal(sets.size, 4, `${f}: four different answer patterns`);
  }
});

test('CT-T1 content is culturally neutral: speeds in km/h, no ages, no drinking rules', () => {
  for (const it of [...t1.formA, ...t1.formB, ...t1.practice]) {
    const text = [it.setting, it.rule, ...it.cards.map((c) => c.face)].join(' ');
    assert.ok(!/\bmph\b|miles/i.test(text), it.id);
    assert.ok(!/\bage\b|aged|years old|under \d\d|over \d\d|drink|alcohol|beer/i.test(text), it.id);
    if (/speed/i.test(text)) assert.match(text, /km\/h/, it.id);
  }
});

const selectRole = (it, roles) => it.cards.map((c, i) => (roles.includes(c.shows) ? i : -1)).filter((i) => i >= 0);

test('CT-T1 scoring: all-or-nothing; select-all and select-none score 0', () => {
  for (const f of FORMS) {
    const form = t1[f];
    const right = scoreSelection(attempt(form.map((it) => [it.id, { selected: [...it.key].sort(), order: [0, 1, 2, 3] }])), form);
    assert.deepEqual(right, { rawScore: 8, score: { CT1: 1, abstract: 1, deontic: 1 } });
    const all = scoreSelection(attempt(form.map((it) => [it.id, { selected: [0, 1, 2, 3], order: [0, 1, 2, 3] }])), form);
    assert.deepEqual(all, { rawScore: 0, score: { CT1: 0, abstract: 0, deontic: 0 } });
    const none = scoreSelection(attempt(form.map((it) => [it.id, { selected: [], order: [0, 1, 2, 3] }])), form);
    assert.deepEqual(none, { rawScore: 0, score: { CT1: 0, abstract: 0, deontic: 0 } });
    // One card of the two, or the two plus one more, earns nothing (no partial credit, audit B-4).
    const half = scoreSelection(attempt(form.map((it) => [it.id, { selected: [it.key[0]], order: [0, 1, 2, 3] }])), form);
    assert.equal(half.rawScore, 0);
    const extra = scoreSelection(attempt(form.map((it) => [it.id, { selected: [...it.key, [0, 1, 2, 3].find((i) => !it.key.includes(i))], order: [0, 1, 2, 3] }])), form);
    assert.equal(extra.rawScore, 0);
  }
});

test('CT-T1 scoring: abstract and deontic sub-scores are separate; unanswered and malformed responses are incorrect', () => {
  const form = t1.formA;
  const deonticOnly = scoreSelection(attempt(form.filter((it) => it.kind === 'deontic').map((it) => [it.id, { selected: it.key }])), form);
  assert.deepEqual(deonticOnly.score, { CT1: 0.5, abstract: 0, deontic: 1 });
  const bad = scoreSelection(attempt([[form[0].id, null], [form[1].id, { selected: [form[1].key[0], form[1].key[0], form[1].key[1]] }], [form[2].id, { selected: [7, 9] }]]), form);
  assert.equal(bad.rawScore, 0);
  assert.equal(scoreSelection(attempt([]), []).score.CT1, null);
});

test('CT-T1 adversarial: no fixed choice of card types scores above 2 of 8', () => {
  const roles = ['P', 'notP', 'Q', 'notQ'];
  const subsets = [];
  for (let mask = 0; mask < 16; mask++) subsets.push(roles.filter((_, i) => mask & (1 << i)));
  for (const f of FORMS) {
    const form = t1[f];
    for (const s of subsets) {
      const out = scoreSelection(attempt(form.map((it) => [it.id, { selected: selectRole(it, s) }])), form);
      assert.ok(out.rawScore <= 2, `${f}: always choosing ${s.join('+') || 'nothing'} scored ${out.rawScore}`);
    }
    // The classic answer pattern (P and not-Q) and matching bias (the two named cases) each fit one pattern.
    assert.equal(scoreSelection(attempt(form.map((it) => [it.id, { selected: selectRole(it, ['P', 'notQ']) }])), form).rawScore, 2);
    assert.equal(scoreSelection(attempt(form.map((it) => [it.id, { selected: selectRole(it, ['P', 'Q']) }])), form).rawScore, 2);
  }
});

// ------------------------------------------------------------------ CT-T2 argument and evidence

const T2_TYPES = { flaw: 2, assumption: 2, evidence: 1, weaken: 1, fairest: 1, objection: 1 };

test('CT-T2 forms: 8 items with the same item types in the same order; scenarios of 80 words or fewer', () => {
  for (const f of FORMS) {
    const items = t2[f];
    assert.equal(items.length, 8, f);
    assert.deepEqual(count(items, (it) => it.type), T2_TYPES, f);
  }
  assert.deepEqual(t2.formA.map((it) => it.type), t2.formB.map((it) => it.type));
  for (const it of [...t2.formA, ...t2.formB, ...t2.practice]) {
    assert.ok(words(it.scenario) <= 80, `${it.id}: ${words(it.scenario)} words`);
    assert.equal(it.options.length, 4, it.id);
    assert.ok(Number.isInteger(it.key) && it.key >= 0 && it.key < 4, it.id);
    assert.equal(new Set(it.options).size, 4, `${it.id}: options distinct`);
    assert.ok(it.rationale && words(it.rationale) >= 15, `${it.id}: rationale`);
    assert.ok(it.facets.includes('CT2'), it.id);
    assert.ok(!/[‘’“”]/.test(JSON.stringify(it)), `${it.id}: straight quotes only`);
  }
  for (const it of [...t2.formA, ...t2.formB]) if (it.type === 'evidence') assert.deepEqual(it.facets, ['CT2', 'CT4'], it.id);
});

test('CT-T2 keys sit at each original position twice per form, so always-first scores at chance', () => {
  for (const f of FORMS) {
    assert.deepEqual(count(t2[f], (it) => it.key), { 0: 2, 1: 2, 2: 2, 3: 2 }, f);
    const first = scoreT2(attempt(t2[f].map((it) => [it.id, { choice: 0 }])), t2[f]);
    assert.equal(first.score.CT2, 0.25);
  }
});

// The screen order comes from ctx.rngFor(itemId); here a fresh seed stands for each sitting.
function screenFirst(items, seed) {
  return items.map((it) => {
    const order = createRng(seed * 7919 + it.id.length * 31 + it.id.charCodeAt(it.id.length - 1)).shuffle(it.options.map((_, i) => i));
    return [it.id, { choice: order[0], position: 0, order }];
  });
}

test('adversarial: always choosing option A on screen scores at chance on CT-T2 and CT-T4', () => {
  for (const [content, scorer, facet] of [[t2, scoreT2, 'CT2'], [t4, scoreT4, 'CT4']]) {
    for (const f of FORMS) {
      let total = 0;
      const runs = 2000;
      for (let s = 1; s <= runs; s++) total += scorer(attempt(screenFirst(content[f], s)), content[f]).score[facet];
      const mean = total / runs;
      assert.ok(Math.abs(mean - 0.25) < 0.02, `${facet} ${f}: always A averaged ${mean.toFixed(3)}`);
    }
  }
});

test('CT-T2 and CT-T4 scoring: proportion correct; unanswered counts as incorrect; latest answer counts', () => {
  const form = t2.formB;
  assert.deepEqual(scoreT2(attempt(form.map((it) => [it.id, { choice: it.key }])), form), { rawScore: 8, score: { CT2: 1 } });
  assert.deepEqual(scoreT2(attempt([]), form), { rawScore: 0, score: { CT2: 0 } });
  const changed = scoreT2(attempt([[form[0].id, { choice: form[0].key }], [form[0].id, { choice: (form[0].key + 1) % 4 }]]), form);
  assert.equal(changed.rawScore, 0);
  assert.deepEqual(scoreT2(attempt([[form[0].id, { choice: '0' }]]), form).rawScore, 0);
  assert.deepEqual(scoreT4(attempt([]), []), { rawScore: 0, score: { CT4: null } });
});

// ------------------------------------------------------------------ CT-T4 statistical reasoning

test('CT-T4 forms: matched item types, four options, one key, a worked solution', () => {
  for (const f of FORMS) {
    assert.equal(t4[f].length, 6, f);
    assert.deepEqual(count(t4[f], (it) => it.type), { 'base-rate': 2, 'sample-size': 2, proportion: 1, chance: 1 }, f);
  }
  assert.deepEqual(t4.formA.map((it) => it.type), t4.formB.map((it) => it.type));
  for (const it of [...t4.formA, ...t4.formB, ...t4.practice]) {
    assert.equal(it.options.length, 4, it.id);
    assert.equal(new Set(it.options).size, 4, it.id);
    assert.ok(it.rationale && words(it.rationale) >= 15, it.id);
    assert.deepEqual(it.facets, ['CT4'], it.id);
  }
});

test('CT-T4 keys are recomputed from the numbers in each item', () => {
  for (const it of [...t4.formA, ...t4.formB, ...t4.practice]) {
    const c = it.check;
    const answer = it.options[it.key];
    if (c.rule === 'posterior') {
      const p = (c.base * c.hit) / (c.base * c.hit + (1 - c.base) * c.falseAlarm);
      c.ranges.forEach(([lo, hi], i) => {
        const inside = p >= lo && p <= hi;
        assert.equal(inside, i === it.key, `${it.id}: posterior ${p.toFixed(3)} against option ${i}`);
      });
    } else if (c.rule === 'compare') {
      const shares = c.groups.map(([part, whole]) => part / whole);
      assert.notEqual(shares[0], shares[1], it.id);
      const larger = shares[0] > shares[1] ? 0 : 1;
      assert.ok(answer.startsWith(c.labels[larger]), `${it.id}: key should name ${c.labels[larger]}`);
      assert.ok(c.groups[larger][0] < c.groups[1 - larger][0], `${it.id}: the larger share has the smaller count (the trap)`);
    } else if (c.rule === 'likelier') {
      const w = c.base.map((b, i) => b * c.fit[i]);
      assert.notEqual(w[0], w[1], it.id);
      assert.ok(answer.startsWith(c.labels[w[0] > w[1] ? 0 : 1]), it.id);
      assert.ok(c.fit[w[0] > w[1] ? 0 : 1] < c.fit[w[0] > w[1] ? 1 : 0], `${it.id}: the description fits the other group better (the trap)`);
    } else if (c.rule === 'independent') {
      assert.ok(answer.startsWith('Exactly'), it.id);
      assert.ok(answer.includes(`1 in ${Math.round(1 / c.p)}`), it.id);
    } else if (c.rule === 'smaller-sample' || c.rule === 'larger-sample') {
      const pick = c.rule === 'smaller-sample' ? Math.min(...c.sizes) : Math.max(...c.sizes);
      assert.ok(answer.startsWith(c.labels[c.sizes.indexOf(pick)]), it.id);
      assert.ok(answer.includes(String(pick)) || it.scenario.includes(String(pick)), it.id);
    } else {
      assert.fail(`${it.id}: unknown check rule ${c.rule}`);
    }
  }
});

// ------------------------------------------------------------------ CT-T3 calibration

test('CT-T3 forms: 10 two-choice items, matched on kind, difficulty, revision items and key balance', () => {
  for (const f of FORMS) {
    const items = t3[f];
    assert.equal(items.length, 10, f);
    assert.deepEqual(count(items, (it) => it.kind), { comparison: 7, estimation: 3 }, f);
    assert.deepEqual(count(items, (it) => it.difficulty), { easier: 4, harder: 6 }, f);
    assert.deepEqual(count(items, (it) => it.key), { 0: 5, 1: 5 }, f);
    assert.equal(items.filter((it) => it.revision).length, 3, f);
  }
});

test('CT-T3 items have a source URL, a check date and the deciding facts; evidence is plain text', () => {
  for (const it of [...t3.formA, ...t3.formB, ...t3.practice]) {
    assert.equal(it.options.length, 2, it.id);
    assert.ok(it.key === 0 || it.key === 1, it.id);
    assert.ok(Array.isArray(it.source.urls) && it.source.urls.length >= 1, it.id);
    for (const u of it.source.urls) assert.match(u, /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\//, `${it.id}: ${u}`);
    assert.equal(it.source.checked, '2026-11-27', it.id);
    assert.ok(it.facts && it.facts.length > 5, it.id);
    if (it.revision) assert.ok(typeof it.revision.evidence === 'string' && words(it.revision.evidence) >= 8, it.id);
  }
  assert.ok(t3.practice.some((it) => it.revision), 'practice includes a revision item');
});

const answers = (form, { correct, confidence, revised = null }) => {
  const pairs = [];
  form.forEach((it, i) => {
    const right = typeof correct === 'function' ? correct(it, i) : correct;
    const choice = right ? it.key : 1 - it.key;
    const conf = typeof confidence === 'function' ? confidence(it, i) : confidence;
    pairs.push([it.id, { phase: 'initial', choice, position: 0, confidence: conf }]);
    if (it.revision && revised) pairs.push([it.id, { phase: 'revised', position: 0, ...revised(it, choice, conf) }]);
  });
  return attempt(pairs);
};
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} is not ${b}`);

test('CT-T3 scoring: accuracy, mean confidence, overconfidence and Brier score', () => {
  const form = t3.formA;
  const perfect = scoreCalibration(answers(form, { correct: true, confidence: 100 }), form).score;
  near(perfect.accuracy, 1, 'accuracy'); near(perfect.brier, 0, 'brier'); near(perfect.overconfidence, 0, 'over'); near(perfect.CT3, 1, 'CT3');
  const guess = scoreCalibration(answers(form, { correct: (it, i) => i % 2 === 0, confidence: 50 }), form).score;
  near(guess.accuracy, 0.5, 'accuracy'); near(guess.brier, 0.25, 'brier'); near(guess.overconfidence, 0, 'over');
  const mixed = scoreCalibration(answers(form, { correct: (it, i) => i < 7, confidence: (it, i) => (i < 7 ? 90 : 60) }), form);
  assert.equal(mixed.rawScore, 7);
  near(mixed.score.meanConfidence, (7 * 0.9 + 3 * 0.6) / 10, 'mean confidence');
  near(mixed.score.brier, (7 * 0.01 + 3 * 0.36) / 10, 'brier');
  near(mixed.score.overconfidence, mixed.score.meanConfidence - 0.7, 'over');
  assert.ok(CONFIDENCE.every((c) => c >= 50 && c <= 100));
});

test('adversarial: always 100% confident gives poor calibration, worse than always guessing at 50%', () => {
  const form = t3.formB;
  const baseline = 0.25; // Brier score of answering every item at 50%
  for (const acc of [0.5, 0.6, 0.7]) {
    const n = Math.round(acc * 10);
    const out = scoreCalibration(answers(form, { correct: (it, i) => i < n, confidence: 100 }), form).score;
    near(out.overconfidence, 1 - acc, `overconfidence at ${acc}`);
    near(out.brier, 1 - acc, `brier at ${acc}`);
    assert.ok(out.brier > baseline, `brier ${out.brier} at accuracy ${acc} should be worse than ${baseline}`);
  }
  // Always choosing the first option on screen: accuracy at chance (two options).
  let total = 0;
  for (let s = 1; s <= 2000; s++) {
    const pairs = form.map((it) => {
      const order = createRng(s * 104729 + it.id.charCodeAt(it.id.length - 1)).shuffle([0, 1]);
      return [it.id, { phase: 'initial', choice: order[0], position: 0, confidence: 100 }];
    });
    total += scoreCalibration(attempt(pairs), form).score.accuracy;
  }
  assert.ok(Math.abs(total / 2000 - 0.5) < 0.02, `always first: ${total / 2000}`);
});

test('CT-T3 revision: following the evidence gains, ignoring it does not, and final accuracy is recorded', () => {
  const form = t3.formA;
  const toTruth = scoreCalibration(answers(form, { correct: false, confidence: 70, revised: (it) => ({ choice: it.key, confidence: 90 }) }), form).score;
  near(toTruth.revisionAccuracy, 1, 'final accuracy');
  near(toTruth.revisionGain, 0.9 - 0.3, 'gain');
  const stubborn = scoreCalibration(answers(form, { correct: false, confidence: 70, revised: (it, choice, conf) => ({ choice, confidence: conf }) }), form).score;
  near(stubborn.revisionAccuracy, 0, 'final accuracy');
  near(stubborn.revisionGain, 0, 'gain');
  const contrary = scoreCalibration(answers(form, { correct: true, confidence: 80, revised: (it) => ({ choice: 1 - it.key, confidence: 80 }) }), form).score;
  near(contrary.revisionGain, 0.2 - 0.8, 'switching away from the evidence loses');
  // Revised answers never change the initial indices.
  const initialOnly = scoreCalibration(answers(form, { correct: false, confidence: 70 }), form).score;
  near(initialOnly.accuracy, toTruth.accuracy, 'accuracy uses initial answers');
  assert.equal(initialOnly.revisionGain, null);
});

test('CT-T3 missing and invalid responses: indices need at least half the items', () => {
  const form = t3.formA;
  const half = attempt(form.slice(0, 5).map((it) => [it.id, { phase: 'initial', choice: it.key, confidence: 80 }]));
  assert.equal(scoreCalibration(half, form).score.answered, 5);
  assert.notEqual(scoreCalibration(half, form).score.accuracy, null);
  const four = attempt(form.slice(0, 4).map((it) => [it.id, { phase: 'initial', choice: it.key, confidence: 80 }]));
  const out = scoreCalibration(four, form).score;
  assert.equal(out.accuracy, null); assert.equal(out.brier, null); assert.equal(out.CT3, null);
  const invalid = attempt(form.map((it) => [it.id, { phase: 'initial', choice: it.key, confidence: 75 }]));
  assert.equal(scoreCalibration(invalid, form).score.answered, 0);
  const empty = scoreCalibration(attempt([]), form);
  assert.equal(empty.rawScore, 0);
  assert.equal(empty.score.CT3, null);
});
