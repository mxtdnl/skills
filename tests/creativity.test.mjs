// Creativity tasks (S8): content rules, text handling, scoring and adversarial response patterns
// (audit A-6, B-2, E-1; audit/BUILD-PLAN.md S8). The task UI is covered by tests/e2e.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { validateContent, validateManifest, stepsFor } from '../src/skills/registry.js';
import creativity from '../src/skills/creativity/index.js';
import { loadDictionary, tokenise, canonical, prepareLine } from '../src/skills/creativity/text.js';
import { analyse, indicators, score, compile, linesOf, MIN_FLUENCY_FOR_ORIGINALITY, MAX_LINES } from '../src/skills/creativity/ideas-score.js';
import { creativitySummary } from '../src/skills/creativity/summary.js';
import * as llm from '../src/skills/creativity/llm-scorer.js';
import * as t1 from '../content/creativity/cr-t1.js';
import * as t2 from '../content/creativity/cr-t2.js';
import * as autNorms from '../content/creativity/aut-norms.js';
import * as problemNorms from '../content/creativity/problem-norms.js';
import * as sr from '../content/creativity/self-report.js';

before(async () => { await loadDictionary(); });

const POOLS = ['formA', 'formB', 'practice'];
const ALL = [...POOLS.flatMap((p) => t1[p]), ...POOLS.flatMap((p) => t2[p])];
const BOX = t1.formA[0];
const JAR = t1.formB[0];
const FLAT = t2.formA[0];
const JOB = t2.formB[0];
const run = (lines, item) => indicators(analyse(lines, item), item);
const attempt = (itemId, lines, extra = {}) => ({ itemResponses: [{ itemId, response: { lines, final: true, elapsedMs: 1000, ...extra } }] });

// ------------------------------------------------------------------ manifest and content

test('the creativity manifest has the self-report and two timed idea-list tasks', () => {
  assert.deepEqual(validateManifest(creativity), []);
  assert.deepEqual(creativity.tasks.map((t) => [t.id, t.type]), [['cr-t1', 'idea-list'], ['cr-t2', 'idea-list']]);
  assert.deepEqual(creativity.tasks[0].facets, ['CR1', 'CR2', 'CR3']);
  assert.equal(creativity.tasks[1].facets[0], 'CR4');
  assert.deepEqual(stepsFor(creativity, 'assessment').map((s) => s.id), ['self-report', 'cr-t1', 'cr-t2']);
  assert.deepEqual(stepsFor(creativity, 'practice').map((s) => s.id), ['cr-t1', 'cr-t2']);
});

test('content is valid, all draft, one fixed item per form, practice uses other objects, IDs unique', async () => {
  const seen = new Set();
  for (const [task, mod] of [['T1', t1], ['T2', t2]]) {
    const loaded = await creativity.tasks[task === 'T1' ? 0 : 1].loadContent();
    assert.deepEqual(validateContent(loaded), []);
    assert.equal(mod.formA.length, 1, `${task}: one fixed object per form`);
    assert.equal(mod.formB.length, 1);
    assert.ok(mod.practice.length >= 1);
    for (const pool of POOLS) {
      for (const it of mod[pool]) {
        assert.equal(it.status, 'draft', it.id);
        assert.match(it.id, new RegExp(`^CR-${task}-${pool === 'practice' ? 'P' : pool.slice(-1)}\\d\\d$`));
        assert.ok(!seen.has(it.id));
        seen.add(it.id);
      }
    }
    const subject = (it) => it.object || it.situation;
    const assessed = new Set([...mod.formA, ...mod.formB].map(subject));
    for (const it of mod.practice) assert.ok(!assessed.has(subject(it)), `${it.id}: practice uses another object or situation`);
    assert.notEqual(subject(mod.formA[0]), subject(mod.formB[0]));
  }
  assert.ok(t1.practice.length >= 2, 'the practice pool has more than one object');
  for (const it of [...sr.formA, ...sr.formB, ...sr.retrospective]) assert.ok(!seen.has(it.id));
});

test('frequency tables are marked provisional and author-estimated, and every entry is well formed', () => {
  for (const m of [autNorms, problemNorms]) assert.equal(m.STATUS, 'provisional, author-estimated, replace with pilot norms');
  for (const item of ALL) {
    assert.ok(Array.isArray(item.norms) && item.norms.length >= 10, `${item.id} has a table`);
    const cats = new Set(item.categories.map((c) => c.id));
    const ids = new Set();
    for (const e of item.norms) {
      assert.ok(!ids.has(e.id), `${item.id} ${e.id} unique`);
      ids.add(e.id);
      assert.ok(cats.has(e.category), `${e.id}: category ${e.category} is in the taxonomy`);
      assert.ok(['common', 'occasional', 'rare'].includes(e.freq), e.id);
      assert.ok(e.match.length >= 1 && e.match.every((g) => g.length >= 1 && g.every((a) => typeof a === 'string' && a.trim())), e.id);
      const flat = e.match.flat();
      assert.equal(new Set(flat).size, flat.length, `${e.id}: no alternative is repeated across groups`);
    }
  }
});

test('taxonomies have no "Other" category; practice categories carry hints', () => {
  for (const item of ALL) {
    const ids = item.categories.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length, item.id);
    for (const c of item.categories) {
      assert.doesNotMatch(c.id, /other|misc/i);
      assert.doesNotMatch(c.label, /^other\b|miscellaneous/i);
      assert.ok(c.keywords.length >= 5, `${item.id} ${c.id} keywords`);
    }
  }
  for (const item of [...t1.practice, ...t2.practice]) for (const c of item.categories) assert.ok(c.hint && c.hint.length > 15, `${item.id} ${c.id} hint`);
});

test('every table example is read as a valid idea, matched to its own entry and category', () => {
  for (const item of ALL) {
    for (const e of item.norms) {
      const [r] = analyse([e.example], item);
      assert.equal(r.status, 'valid', `${e.id}: "${e.example}"`);
      assert.equal(r.entry, e.id, `${e.id}: "${e.example}" matched ${r.entry}`);
      assert.equal(r.category, e.category, e.id);
    }
  }
});

test('forms A and B are parallel: same number of categories, tables of similar size and band mix', () => {
  for (const [a, b] of [[BOX, JAR], [FLAT, JOB]]) {
    assert.equal(a.categories.length, b.categories.length, `${a.id} / ${b.id}`);
    assert.ok(Math.abs(a.norms.length - b.norms.length) <= 3, 'table size');
    for (const band of ['common', 'occasional', 'rare']) {
      const n = (it) => it.norms.filter((e) => e.freq === band).length;
      assert.ok(Math.abs(n(a) - n(b)) <= 3, `${a.id} / ${b.id} ${band}: ${n(a)} and ${n(b)}`);
    }
  }
});

// ------------------------------------------------------------------ text handling

test('words are matched as normalised stems: inflections, British and American spelling, accents', () => {
  assert.deepEqual(tokenise("Don't  STORE—café's boxes!"), ['dont', 'store', 'cafes', 'boxes']);
  const same = (a, b) => assert.equal(canonical(a), canonical(b), `${a} / ${b}`);
  same('store', 'storing'); same('store', 'stores'); same('store', 'stored');
  same('box', 'boxes'); same('study', 'studies'); same('study', 'studying'); same('plan', 'planned');
  same('organise', 'organize'); same('colour', 'color'); same('centre', 'center'); same('analyse', 'analyze');
  assert.notEqual(canonical('notes'), canonical('not'), 'an ending is removed only if a word is left');
  assert.notEqual(canonical('tape'), canonical('tap'));
  assert.equal(canonical('four'), 'four', 'a spelling rule applies only if the other spelling is a word');
});

test('a small typing error still counts as a word; long runs of letters do not', () => {
  const task = compile(BOX);
  const p = prepareLine('stroe old clothse', task);
  assert.equal(p.recognised, p.content);
  assert.equal(analyse(['stroe old clothse'], BOX)[0].entry, 'box-store');
  const g = prepareLine('xkqzvw prtlmn', task);
  assert.equal(g.recognised, 0);
});

// ------------------------------------------------------------------ unscorable lines

test('unscorable lines are detected and never credited', () => {
  const r = analyse([
    'asdkj qwpeo zzkw', // non-words
    '!!!', // no letters
    'box', // one word
    'use the box', // nothing beyond the object and a general verb
    'store old clothes',
    'storing old clothes', // the same idea
    'Store the old clothes.', // the same idea
    'store old clothes neatly in the attic', // a superset of an earlier idea
    'it is the one', // function words only
  ], BOX);
  assert.deepEqual(r.map((x) => x.status), ['non-words', 'non-words', 'too-short', 'too-short', 'valid', 'duplicate', 'duplicate', 'duplicate', 'too-short']);
  assert.equal(r[5].duplicateOf, 4);
  const s = indicators(r, BOX);
  assert.deepEqual([s.fluency, s.nonWords, s.tooShort, s.duplicates, s.entered], [1, 2, 3, 3, 9]);
});

test('different ideas that share a word are not duplicates', () => {
  const r = analyse(['store old books', 'store winter clothes', 'not enough sleep', 'not enough money'], BOX);
  assert.deepEqual(r.slice(0, 2).map((x) => x.status), ['valid', 'valid']);
  const p = analyse(['not enough sleep', 'not enough money'], FLAT);
  assert.deepEqual(p.map((x) => x.status), ['valid', 'valid']);
});

test('a line with one unknown word among known words is still scored', () => {
  assert.equal(analyse(['build a tiny zorbing ramp for toys'], BOX)[0].status, 'valid');
});

// ------------------------------------------------------------------ matching and originality

test('matching never works by reverse substring (audit B-2)', () => {
  // "rolling" alone is part of the table phrase "rolling pin", but the idea does not contain it
  const [roll] = analyse(['rolling marbles across the floor'], JAR);
  assert.notEqual(roll.entry, 'jar-roll');
  // An idea containing a common word in a new use gets the more specific or rarer entry
  const [w] = analyse(['a weight to hold down a tent in the wind'], JAR);
  assert.equal(w.entry, 'jar-weight');
  assert.equal(w.points, 1);
  // The two-group entry needs both groups: "moving" alone is not "moving house"
  const [m] = analyse(['moving heavy furniture on it'], BOX);
  assert.notEqual(m.entry, 'box-move');
});

test('points: common 0, occasional 1, rare 2; not in the table 2 if categorised, 1 if not', () => {
  const byText = (lines, item) => analyse(lines, item).map((r) => [r.band, r.points]);
  assert.deepEqual(byText(['store old clothes', 'sit on it as a stool', 'grow seedlings in it'], BOX), [['common', 0], ['occasional', 1], ['rare', 2]]);
  const [unlisted, unplaced] = analyse(['decorate it as a dragon for a parade', 'pretend it is a submarine periscope'], BOX);
  assert.equal(unlisted.entry, null);
  assert.equal(unlisted.category, 'art');
  assert.equal(unlisted.points, 2);
  assert.equal(unplaced.category, null);
  assert.equal(unplaced.points, 1);
});

test('originality is a mean per valid idea, so it does not grow with the number of ideas', () => {
  const few = run(['store old clothes', 'send a parcel by post', 'make a bed for a cat'], BOX);
  const many = run(['store old clothes', 'send a parcel by post', 'make a bed for a cat', 'wrap a birthday present', 'build a fort for children', 'a small table in a bedroom'], BOX);
  assert.equal(few.originality, 0);
  assert.equal(many.originality, 0);
  assert.equal(run(['store old clothes', 'grow seedlings in it'], BOX).originality, null, `null below ${MIN_FLUENCY_FOR_ORIGINALITY} valid ideas`);
});

// ------------------------------------------------------------------ adversarial patterns (S8)

const GIBBERISH = ['asdkj qwpeo', 'zxcvb nmlkj', 'fjdksl hgqwe', 'blorp frindle wazzle', 'qqq www eee', 'lkjh poiu', 'mnbv cxzl'];
const PADDED = {
  uses: [
    'basically just store things in it really',
    'honestly you could store stuff in it',
    'really very good for storing things lol',
    'store your things in it basically',
    'just keep stuff in it',
    'put things inside it maybe',
    'you can literally store stuff in it',
    'store things in it, I guess, honestly',
  ],
  problems: [
    'basically just really stressful stuff honestly',
    'just stress and things lol',
    'honestly really stressful, you know',
    'stressful stuff, I guess, basically',
    'really very stressful things',
  ],
};
const FLOOR = (s, label) => {
  assert.ok(s.fluency <= 1, `${label}: fluency ${s.fluency}`);
  assert.ok(s.flexibility <= 1, `${label}: flexibility ${s.flexibility}`);
  assert.ok(s.originality === null || s.originality === 0, `${label}: originality ${s.originality}`);
  assert.ok(s.uncommon === 0, `${label}: uncommon ${s.uncommon}`);
};

for (const item of [BOX, JAR, FLAT, JOB]) {
  const kind = item.kind;
  test(`${item.id}: gibberish, a repeated phrase, filler-padded common ideas and empty input score at the floor`, () => {
    FLOOR(run(GIBBERISH, item), 'gibberish');
    const phrase = item.norms.find((e) => e.freq === 'common').example;
    FLOOR(run(Array(12).fill(phrase), item), 'one repeated phrase');
    FLOOR(run([phrase, `${phrase}!`, phrase.toUpperCase(), `really ${phrase} basically`, `${phrase} honestly`, `just ${phrase} lol`], item), 'repeated phrase with padding');
    FLOOR(run(PADDED[kind], item), 'filler-padded');
    FLOOR(run([], item), 'empty');
    FLOOR(score({ itemResponses: [] }, [item]).score, 'no response');
  });
}

test('padding a list of valid ideas with filler words changes none of its indicators', () => {
  const plain = ['store old clothes', 'sit on it as a stool', 'grow seedlings in it', 'write a protest sign'];
  const padded = plain.map((l, i) => (i % 2 ? `honestly, ${l}, basically` : `you could really just ${l} I guess`));
  assert.deepEqual(run(padded, BOX), run(plain, BOX));
});

const VARIED = {
  'CR-T1-A01': ['store old clothes', 'sit on it as a stool', 'wear it as a robot helmet', 'slide down a grassy hill on it', 'cut out a stencil for painting', 'insulate a window against the cold', 'make phone music sound louder', 'write a protest sign', 'grow seedlings in it', 'build a marble run for kids'],
  'CR-T1-B01': ['store dry pasta', 'hold a candle', 'grow herbs on a windowsill', 'collect money for a charity', 'make a snow globe', 'cut out biscuits with the rim', 'measure how much rain falls', 'bury a time capsule', 'fill jars with water to play a tune', 'make a soap dispenser'],
  'CR-T2-A01': ['high bills in winter', 'flatmates who never clean', 'loud music late at night', 'guests who stay too long', 'different diets sharing one kitchen', 'personalities that clash', 'not understanding the contract before signing it', 'belongings being stolen', 'slow wifi with everyone online', 'cultural differences causing misunderstandings'],
  'CR-T2-B01': ['not enough time for everything', 'missing lectures because of work', 'stress and burnout', 'not understanding tax on their pay', 'visa rules on how many hours they can work', 'harassment at work', 'dealing with rude customers', 'travelling home late at night', 'shifts that change at short notice', 'no time to apply for internships'],
};

for (const item of [BOX, JAR, FLAT, JOB]) {
  test(`${item.id}: ten sensible, varied ideas score above six common ones on every component`, () => {
    const commons = item.norms.filter((e) => e.freq === 'common').map((e) => e.example);
    while (commons.length < 6) commons.push(...item.norms.filter((e) => e.freq === 'occasional').map((e) => e.example).slice(0, 6 - commons.length));
    const six = run(commons.slice(0, 6), item);
    const ten = run(VARIED[item.id], item);
    assert.equal(ten.fluency, 10, JSON.stringify(analyse(VARIED[item.id], item).filter((r) => r.status !== 'valid')));
    assert.ok(ten.fluency > six.fluency);
    assert.ok(ten.flexibility > six.flexibility, `flexibility ${ten.flexibility} > ${six.flexibility}`);
    assert.ok(ten.originality > six.originality, `originality ${ten.originality} > ${six.originality}`);
  });
}

// ------------------------------------------------------------------ score()

test('score() uses the latest response to a form item and ignores other items and bad shapes', () => {
  const form = [BOX];
  const r = (itemId, response) => ({ itemId, response });
  const a = { itemResponses: [
    r('CR-T1-A01', { lines: ['store old clothes'], final: false, elapsedMs: 10 }),
    r('CR-T1-B01', { lines: ['drink water from it', 'hold a candle', 'save coins in it'], final: true, elapsedMs: 10 }),
    r('CR-T1-A01', 'not an object'),
    r('CR-T1-A01', { lines: ['store old clothes', 'sit on it as a stool', 42, '', '  '], final: true, elapsedMs: 20 }),
  ] };
  const out = score(a, form);
  assert.equal(out.rawScore, 2);
  assert.equal(out.score.entered, 2);
  assert.deepEqual(Object.values(out.score).filter((v) => !(typeof v === 'number' || v === null)), [], 'flat numbers only (data schema)');
  // Practice: the answered item is scored, whichever of the pool it is
  const p = score(attempt('CR-T1-P02', ['wipe up spills', 'dry the dishes', 'a mat for yoga']), t1.practice);
  assert.equal(p.score.categoriesAvailable, t1.practice[1].categories.length);
  assert.equal(p.score.fluency, 3);
});

test('pasted text is capped', () => {
  const lines = Array.from({ length: 500 }, (_, i) => `idea number ${i}`);
  assert.equal(linesOf({ lines }).length, MAX_LINES);
  assert.ok(linesOf({ lines: ['x'.repeat(5000)] })[0].length <= 200);
});

test('the skill summary reports each facet through single indicators and never combines originality with fluency', () => {
  const uses = run(VARIED['CR-T1-A01'], BOX);
  const problems = run(VARIED['CR-T2-A01'], FLAT);
  const s = creativitySummary({ uses, problems });
  assert.equal(s.CR1.uses, uses.fluency);
  assert.equal(s.CR2.uses, uses.flexibility);
  assert.equal(s.CR3.uses, uses.originality);
  assert.equal(s.CR4.problems, problems.fluency);
  assert.equal(s.CR4.originality, problems.originality);
  // Every value is one of the task's own indicators, unchanged: nothing is a sum or a product
  const own = new Set([...Object.values(uses), ...Object.values(problems)]);
  for (const facet of Object.values(s)) for (const v of Object.values(facet)) assert.ok(v === null || own.has(v));
  assert.deepEqual(creativitySummary({}).CR3, { uses: null, problems: null });
  // More ideas alone never raise originality
  const more = run([...VARIED['CR-T1-A01'], 'store winter coats', 'store toys', 'store books'], BOX);
  assert.ok(creativitySummary({ uses: more }).CR3.uses <= s.CR3.uses);
});

// ------------------------------------------------------------------ language-model scorer

test('the language-model scorer is disabled and sends nothing', async () => {
  assert.equal(llm.isEnabled(), false);
  assert.equal(llm.LLM_SCORER.enabled, false);
  const original = globalThis.fetch;
  let called = false;
  globalThis.fetch = () => { called = true; throw new Error('no network'); };
  try {
    assert.deepEqual(await llm.score({ itemId: 'CR-T1-A01', prompt: 'x', lines: ['store old clothes'] }), { status: 'disabled' });
  } finally {
    globalThis.fetch = original;
  }
  assert.equal(called, false);
  assert.throws(() => llm.configure({ endpoint: 'x' }), /disabled/);
  const src = await readFile(new URL('../src/skills/creativity/llm-scorer.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|https?:/);
});
