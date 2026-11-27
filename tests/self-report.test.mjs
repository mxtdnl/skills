// Self-report content and scoring (S6, scoringVersion 1.0.0-draft; docs/SCORING.md, Self-report).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SKILL_CATALOGUE, validateContent, loadSkills, SKILL_MODULES, stepsFor } from '../src/skills/registry.js';
import { runStep, isProgrammeEnd } from '../src/skills/runner.js';
import {
  keyed, scoreSelfReport, screensOf, qualityIndicators, latestResponses, AGREEMENT_SCALE,
  FAST_MEDIAN_MS, LONG_RUN_MIN,
} from '../src/skills/common/self-report-score.js';
import { MemoryAdapter } from '../src/core/store.js';
import { validate } from '../src/core/schema.js';
import { SCORING_VERSION } from '../src/core/version.js';
import * as fx from './fixtures.mjs';

const content = Object.fromEntries(await Promise.all(SKILL_CATALOGUE.map(async (s) => [s.id, await import(`../content/${s.id}/self-report.js`)])));
const facetsOf = (skillId) => SKILL_CATALOGUE.find((s) => s.id === skillId).facets.map((f) => f.code);
const T0 = Date.parse('2026-11-27T09:00:00.000Z');
const iso = (ms) => new Date(ms).toISOString();

/** Responses to `items`, one screen per facet, each item answered `gapMs` after the previous one. */
function answers(items, value, { gapMs = 3000 } = {}) {
  const out = [];
  let t = T0;
  for (const screen of screensOf(items)) {
    const shown = t;
    let rt = 0;
    for (const it of screen.items) {
      rt += gapMs;
      out.push({ itemId: it.id, response: typeof value === 'function' ? value(it) : value, rtMs: rt, shownAt: iso(shown) });
    }
    t = shown + rt + 1000;
  }
  return out;
}

// ---------------------------------------------------------------------------- content

test('every skill has a valid self-report content module with no practice pool', () => {
  for (const s of SKILL_CATALOGUE) {
    const c = content[s.id];
    assert.deepEqual(validateContent(c), [], s.id);
    assert.deepEqual(c.practice, [], `${s.id}: a self-report has no practice pool`);
  }
});

test('each form has 8 to 10 items, covers every facet, and forms A and B are parallel', () => {
  for (const s of SKILL_CATALOGUE) {
    const codes = facetsOf(s.id);
    for (const form of ['formA', 'formB']) {
      const items = content[s.id][form];
      assert.ok(items.length >= 8 && items.length <= 10, `${s.id} ${form}: ${items.length} items`);
      for (const it of items) assert.ok(codes.includes(it.facet), `${it.id}: facet ${it.facet} is not a facet of ${s.id}`);
      for (const code of codes) assert.ok(items.filter((it) => it.facet === code).length >= 2, `${s.id} ${form}: ${code} needs at least 2 items`);
    }
    for (const code of codes) {
      const n = (form) => content[s.id][form].filter((it) => it.facet === code).length;
      assert.equal(n('formA'), n('formB'), `${s.id} ${code}: same number of items on both forms`);
    }
  }
});

test('keying is recorded per item and balanced: about half positive, half negative', () => {
  for (const s of SKILL_CATALOGUE) {
    for (const form of ['formA', 'formB']) {
      const items = content[s.id][form];
      for (const it of items) assert.ok(it.keying === '+' || it.keying === '-', `${it.id}: keying`);
      const pos = items.filter((it) => it.keying === '+').length;
      assert.ok(Math.abs(pos - (items.length - pos)) <= 1, `${s.id} ${form}: ${pos} positive of ${items.length}`);
    }
    for (const code of facetsOf(s.id)) {
      const both = [...content[s.id].formA, ...content[s.id].formB].filter((it) => it.facet === code);
      assert.ok(both.some((it) => it.keying === '+') && both.some((it) => it.keying === '-'), `${s.id} ${code}: both keyings`);
    }
  }
});

test('items are drafts with a recorded source; IPIP items cite their code, scale and original wording', () => {
  for (const s of SKILL_CATALOGUE) {
    const c = content[s.id];
    for (const it of [...c.formA, ...c.formB, ...c.retrospective]) {
      assert.equal(it.status, 'draft', it.id);
      assert.match(it.id, new RegExp(`^${it.facet.slice(0, 2)}-SR-[ABR]\\d{2}$`), it.id);
      assert.ok(it.source && (it.source.type === 'new' || it.source.type === 'ipip'), `${it.id}: source`);
      if (it.source.type === 'ipip') {
        assert.match(it.source.code, /^[A-Z]\d+$/, `${it.id}: IPIP item code`);
        assert.ok(it.source.scale.startsWith('IPIP '), `${it.id}: IPIP scale`);
        assert.equal(it.source.key, it.keying, `${it.id}: keyed as on the IPIP scale`);
        assert.equal(it.text, `I ${it.source.original.replace(/^Am /, 'am ').replace(/^([A-Z])/, (m) => m.toLowerCase())}`, `${it.id}: IPIP wording kept`);
      }
    }
  }
});

test('statements are plain: one sentence, straight quotes, no double negatives, no duplicates', () => {
  const seen = new Set();
  for (const s of SKILL_CATALOGUE) {
    const c = content[s.id];
    for (const it of [...c.formA, ...c.formB, ...c.retrospective]) {
      assert.match(it.text, /^[A-Z][^.!?]*\.$/, `${it.id}: one sentence ending in a full stop`);
      assert.doesNotMatch(it.text, /[‘’“”]/, `${it.id}: straight quotes`);
      const negations = (it.text.match(/\b(not|never|no|nobody|nothing|without|n't)\b|n't\b/gi) || []).length;
      assert.ok(negations <= 1, `${it.id}: at most one negation (no double negatives)`);
      // The retrospective stem alone is 17 words (build plan S6), so those items may be longer.
      const max = it.retrospective ? 26 : 20;
      assert.ok(it.text.split(' ').length <= max, `${it.id}: at most ${max} words`);
      assert.ok(!seen.has(it.text), `${it.id}: duplicate statement`);
      seen.add(it.text);
    }
  }
});

test('no forced-choice or faking items exist', () => {
  for (const s of SKILL_CATALOGUE) {
    for (const it of [...content[s.id].formA, ...content[s.id].formB, ...content[s.id].retrospective]) {
      assert.ok(!('options' in it) && !('scores' in it), `${it.id}: no forced-choice fields`);
      assert.doesNotMatch(it.text, /^I have never\b/i, `${it.id}: no lie-scale item`);
      assert.deepEqual(Object.keys(it).filter((k) => !['id', 'status', 'facet', 'keying', 'text', 'source', 'retrospective'].includes(k)), [], it.id);
    }
  }
});

test('one retrospective item per facet, positively keyed, with the "Looking back" stem', () => {
  for (const s of SKILL_CATALOGUE) {
    const r = content[s.id].retrospective;
    assert.deepEqual(r.map((it) => it.facet), facetsOf(s.id), s.id);
    for (const it of r) {
      assert.equal(it.retrospective, true);
      assert.equal(it.keying, '+');
      assert.ok(it.text.startsWith('Looking back, at the start of the programme I would have rated myself as'), it.id);
    }
  }
});

test('the agreement scale has five labelled points', () => {
  assert.deepEqual(AGREEMENT_SCALE, ['Strongly disagree', 'Disagree', 'Neither agree nor disagree', 'Agree', 'Strongly agree']);
});

// ---------------------------------------------------------------------------- reverse keying

test('keyed() reverses negatively keyed items and leaves positive items as answered', () => {
  for (let v = 1; v <= 5; v++) {
    assert.equal(keyed(v, '+'), v);
    assert.equal(keyed(v, '-'), 6 - v);
  }
  assert.throws(() => keyed(0, '+'), RangeError);
  assert.throws(() => keyed(3, '?'), RangeError);
});

test('facet means use reversed scores for negative items; the skill mean is the mean of facet means', () => {
  const items = [
    { id: 'X1', facet: 'F1', keying: '+' },
    { id: 'X2', facet: 'F1', keying: '-' },
    { id: 'X3', facet: 'F2', keying: '+' },
    { id: 'X4', facet: 'F2', keying: '+' },
    { id: 'X5', facet: 'F2', keying: '-' },
  ];
  const r = (itemId, response) => ({ itemId, response, rtMs: 2000, shownAt: iso(T0) });
  // Strong on both facets: agree with positives, disagree with negatives.
  const strong = scoreSelfReport({ responses: [r('X1', 5), r('X2', 1), r('X3', 4), r('X4', 5), r('X5', 2)] }, items, ['F1', 'F2']);
  assert.deepEqual(strong.score, { F1: 5, F2: 13 / 3, skill: (5 + 13 / 3) / 2 });
  // The mirror pattern scores at the other end: agreement alone never raises the score.
  const weak = scoreSelfReport({ responses: [r('X1', 1), r('X2', 5), r('X3', 2), r('X4', 1), r('X5', 4)] }, items, ['F1', 'F2']);
  assert.deepEqual(weak.score, { F1: 1, F2: 5 / 3, skill: (1 + 5 / 3) / 2 });
});

test('real content: answering in the direction of the facet gives 5, the opposite gives 1', () => {
  for (const s of SKILL_CATALOGUE) {
    for (const form of ['formA', 'formB']) {
      const items = content[s.id][form];
      const high = scoreSelfReport({ responses: answers(items, (it) => (it.keying === '+' ? 5 : 1)) }, items, facetsOf(s.id)).score;
      const low = scoreSelfReport({ responses: answers(items, (it) => (it.keying === '+' ? 1 : 5)) }, items, facetsOf(s.id)).score;
      for (const k of [...facetsOf(s.id), 'skill']) {
        assert.equal(high[k], 5, `${s.id} ${form} ${k}`);
        assert.equal(low[k], 1, `${s.id} ${form} ${k}`);
      }
    }
  }
});

test('the score is on the 1 to 5 scale and has only facet codes and "skill": no consistency statistic', () => {
  const items = content.critical.formA;
  const out = scoreSelfReport({ responses: answers(items, 3) }, items, facetsOf('critical'));
  assert.deepEqual(Object.keys(out.score), ['CT1', 'CT2', 'CT3', 'CT4', 'skill']);
  for (const v of Object.values(out.score)) assert.ok(v >= 1 && v <= 5);
  assert.deepEqual(Object.keys(out).sort(), ['quality', 'score']);
  assert.ok(!JSON.stringify(out).match(/consisten|faking|split/i));
});

// ---------------------------------------------------------------------------- straight-lining

test('straight-liners get the score their answers imply, with no penalty, and the quality flag set', () => {
  const items = content.collaboration.formA;
  const codes = facetsOf('collaboration');
  for (let v = 1; v <= 5; v++) {
    const out = scoreSelfReport({ responses: answers(items, v) }, items, codes);
    // Expected score computed independently from the keying: no adjustment of any kind.
    const expected = {};
    for (const c of codes) {
      const f = items.filter((it) => it.facet === c);
      expected[c] = f.reduce((n, it) => n + (it.keying === '+' ? v : 6 - v), 0) / f.length;
    }
    expected.skill = codes.reduce((n, c) => n + expected[c], 0) / codes.length;
    assert.deepEqual(out.score, expected, `all ${v}`);
    assert.equal(out.quality.straightLining, true, `all ${v}`);
    assert.equal(out.quality.longestRun, items.length);
    assert.equal(out.quality.longRun, true);
    assert.equal(out.quality.missing, 0);
  }
  // Balanced keying keeps a straight-liner near the midpoint: all "Agree" on form A.
  const agree = scoreSelfReport({ responses: answers(items, 4) }, items, codes).score;
  assert.deepEqual(agree, { CO1: 10 / 3, CO2: 8 / 3, CO3: 10 / 3, skill: 28 / 9 });
  assert.ok(Math.abs(agree.skill - 3) < 0.5, 'midpoint-adjacent');
  // All "Neither agree nor disagree" is exactly the midpoint.
  assert.equal(scoreSelfReport({ responses: answers(items, 3) }, items, codes).score.skill, 3);
});

test('straight-lining on every form of every skill stays within half a point of the midpoint', () => {
  for (const s of SKILL_CATALOGUE) {
    for (const form of ['formA', 'formB']) {
      const items = content[s.id][form];
      for (const v of [1, 2, 4, 5]) {
        const skill = scoreSelfReport({ responses: answers(items, v) }, items, facetsOf(s.id)).score.skill;
        assert.ok(Math.abs(skill - 3) <= 0.5, `${s.id} ${form} all ${v}: ${skill}`);
      }
    }
  }
});

test('varied answers are not flagged; long identical runs and fast responding are', () => {
  const items = content.communication.formB;
  const codes = facetsOf('communication');
  const varied = scoreSelfReport({ responses: answers(items, (it) => (it.keying === '+' ? 4 : 2)) }, items, codes).quality;
  assert.equal(varied.straightLining, false);
  assert.equal(varied.fastResponding, false);
  assert.equal(varied.medianItemMs, 3000);
  assert.ok(varied.longestRun < LONG_RUN_MIN);
  assert.equal(varied.longRun, false);

  // A run of LONG_RUN_MIN identical answers, then different ones: longRun but not straight-lining.
  let i = 0;
  const run = scoreSelfReport({ responses: answers(items, () => (i++ < LONG_RUN_MIN ? 4 : 1)) }, items, codes).quality;
  assert.equal(run.longestRun, LONG_RUN_MIN);
  assert.equal(run.longRun, true);
  assert.equal(run.straightLining, false);

  // Fast: 400 ms per item.
  const fast = scoreSelfReport({ responses: answers(items, (it) => (it.keying === '+' ? 4 : 2), { gapMs: 400 }) }, items, codes);
  assert.equal(fast.quality.medianItemMs, 400);
  assert.ok(fast.quality.medianItemMs < FAST_MEDIAN_MS);
  assert.equal(fast.quality.fastResponding, true);
  // Quality indicators never change the score.
  const slow = scoreSelfReport({ responses: answers(items, (it) => (it.keying === '+' ? 4 : 2), { gapMs: 5000 }) }, items, codes);
  assert.deepEqual(fast.score, slow.score);
});

test('time per item is the gap between answers on the same screen', () => {
  const items = [
    { id: 'X1', facet: 'F1', keying: '+' }, { id: 'X2', facet: 'F1', keying: '+' }, { id: 'X3', facet: 'F1', keying: '-' },
  ];
  const r = (itemId, response, rtMs) => ({ itemId, response, rtMs, shownAt: iso(T0) });
  const q = qualityIndicators(items, latestResponses([r('X1', 4, 2000), r('X2', 3, 2500), r('X3', 2, 6500)]));
  assert.equal(q.medianItemMs, 2000); // gaps 2000, 500, 4000
});

// ---------------------------------------------------------------------------- missing items

test('missing items are handled explicitly: a facet needs at least half its items answered', () => {
  const items = content.collaboration.formA; // three items per facet
  const codes = facetsOf('collaboration');
  const all = answers(items, (it) => (it.keying === '+' ? 5 : 1));
  const without = (ids) => all.filter((r) => !ids.includes(r.itemId));

  // One of three CO1 items missing: 2 of 3 answered, facet scored from the two.
  const one = scoreSelfReport({ responses: without(['CO-SR-A01']) }, items, codes);
  assert.equal(one.score.CO1, 5);
  assert.equal(one.score.skill, 5);
  assert.equal(one.quality.missing, 1);
  assert.equal(one.quality.answered, items.length - 1);

  // Two of three CO1 items missing: fewer than half answered, so CO1 and the skill mean are null.
  const two = scoreSelfReport({ responses: without(['CO-SR-A01', 'CO-SR-A02']) }, items, codes);
  assert.equal(two.score.CO1, null);
  assert.equal(two.score.CO2, 5);
  assert.equal(two.score.skill, null);
  assert.equal(two.quality.missing, 2);

  // Two items per facet (critical thinking): one answered is half, which is enough.
  const ct = content.critical.formA;
  const ctAll = answers(ct, (it) => (it.keying === '+' ? 4 : 2));
  const half = scoreSelfReport({ responses: ctAll.filter((r) => r.itemId !== 'CT-SR-A01') }, ct, facetsOf('critical'));
  assert.equal(half.score.CT1, 4);
  const none = scoreSelfReport({ responses: ctAll.filter((r) => !['CT-SR-A01', 'CT-SR-A02'].includes(r.itemId)) }, ct, facetsOf('critical'));
  assert.equal(none.score.CT1, null);
  assert.equal(none.score.skill, null);
});

test('no responses: every score null, quality says nothing was answered and flags nothing', () => {
  const items = content.curiosity.formB;
  const out = scoreSelfReport({ responses: [] }, items, facetsOf('curiosity'));
  assert.deepEqual(out.score, { CU1: null, CU2: null, CU3: null, skill: null });
  assert.deepEqual(out.quality, { items: 9, answered: 0, missing: 9, straightLining: false, medianItemMs: null, fastResponding: false, longestRun: 0, longRun: false });
});

test('invalid values count as missing; other forms\' items are ignored; the latest answer counts', () => {
  const items = [{ id: 'X1', facet: 'F1', keying: '+' }, { id: 'X2', facet: 'F1', keying: '-' }];
  const r = (itemId, response) => ({ itemId, response, rtMs: 2000, shownAt: iso(T0) });
  for (const bad of [0, 6, 2.5, '4', null, { v: 4 }]) {
    const out = scoreSelfReport({ responses: [r('X1', bad), r('X2', 2)] }, items, ['F1']);
    assert.equal(out.score.F1, 4, `bad value ${JSON.stringify(bad)} ignored`);
    assert.equal(out.quality.missing, 1);
  }
  const other = scoreSelfReport({ responses: [r('X1', 5), r('X2', 1), r('Y9', 1)] }, items, ['F1']);
  assert.equal(other.score.F1, 5);
  const changed = scoreSelfReport({ responses: [r('X1', 1), r('X2', 1), r('X1', 5)] }, items, ['F1']);
  assert.equal(changed.score.F1, 5, 'the changed answer counts, not the first');
  // A later invalid entry replaces an earlier valid one: the item is then missing, explicitly.
  const cleared = scoreSelfReport({ responses: [r('X1', 5), r('X2', 1), r('X1', null)] }, items, ['F1']);
  assert.equal(cleared.score.F1, 5);
  assert.equal(cleared.quality.missing, 1);
});

// ---------------------------------------------------------------------------- retrospective

test('isProgrammeEnd is true only for assessment sittings in an even programme window', () => {
  const prog = (window) => fx.sitting({ windowId: `programme:SEP26-${window}`, programme: { code: `SEP26-${window}`, window, skillOrder: ['_example'], position: 0 } });
  assert.equal(isProgrammeEnd(prog(1)), false);
  assert.equal(isProgrammeEnd(prog(2)), true);
  assert.equal(isProgrammeEnd(fx.sitting()), false);
  assert.equal(isProgrammeEnd(fx.sitting({ mode: 'practice', formId: 'practice', windowId: null })), false);
});

async function runSelfReport(skillId, sitting, respond) {
  const reg = await loadSkills(SKILL_MODULES);
  const skill = reg.get(skillId);
  const step = stepsFor(skill, 'assessment')[0];
  const shown = [];
  const def = { ...step.def, mount: (el, ctx) => { shown.push(...ctx.items); for (const it of ctx.items) ctx.record({ itemId: it.id, response: respond(it), shownAt: T0, answeredAt: T0 + 2000 }); ctx.complete(); } };
  const record = await runStep({ skill, step: { ...step, def }, sitting, store: new MemoryAdapter(), el: null, now: () => T0 + 5000 }).done;
  return { record, shown };
}

test('retrospective items are shown and scored only in an end-of-programme sitting, apart from the skill score', async () => {
  const base = { skillId: 'creativity', formId: 'B' };
  const start = await runSelfReport('creativity', fx.sitting({ ...base, windowId: 'programme:SEP26-1', programme: { code: 'SEP26-1', window: 1, skillOrder: ['creativity'], position: 0 } }), (it) => (it.keying === '+' ? 4 : 2));
  assert.equal(start.shown.some((it) => it.retrospective), false);
  assert.equal(start.record.retrospective, undefined);

  const endSitting = fx.sitting({ ...base, windowId: 'programme:SEP26-2', programme: { code: 'SEP26-2', window: 2, skillOrder: ['creativity'], position: 0 } });
  const end = await runSelfReport('creativity', endSitting, (it) => (it.retrospective ? 2 : it.keying === '+' ? 4 : 2));
  assert.deepEqual(end.shown.filter((it) => it.retrospective).map((it) => it.id), ['CR-SR-R01', 'CR-SR-R02', 'CR-SR-R03', 'CR-SR-R04']);
  assert.deepEqual(end.record.retrospective, { CR1: 2, CR2: 2, CR3: 2, CR4: 2 });
  assert.deepEqual(end.record.score, start.record.score, 'retrospective answers never change the skill score');
  assert.equal(end.record.quality.items, 8, 'quality is computed over the form\'s items only');
  assert.deepEqual(validate('selfReport', end.record).errors, []);

  const self = await runSelfReport('creativity', fx.sitting(base), () => 3);
  assert.equal(self.shown.some((it) => it.retrospective), false, 'self-directed sittings have no retrospective items');
});

test('a completed self-report stores score, quality and the current scoringVersion, and validates', async () => {
  const { record } = await runSelfReport('collaboration', fx.sitting({ skillId: 'collaboration' }), () => 4);
  assert.equal(record.scoringVersion, SCORING_VERSION);
  assert.equal(record.quality.straightLining, true);
  assert.equal(record.score.skill, 28 / 9);
  assert.deepEqual(validate('selfReport', record).errors, []);
});

test('quality and retrospective may not be stored on an in-progress self-report', () => {
  const r = fx.selfReport({ status: 'in-progress', score: null, completedAt: null, quality: { items: 1, answered: 0, missing: 1, straightLining: false, medianItemMs: null, fastResponding: false, longestRun: 0, longRun: false } });
  assert.ok(validate('selfReport', r).errors.some((e) => e.path === '$.quality'));
});
