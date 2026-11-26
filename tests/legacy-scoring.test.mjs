// Characterisation tests for the legacy prototype's scoring (scoringVersion 0.1.0).
//
// Ported from audit/evidence/harness.mjs, attacks.mjs and cons.mjs. These tests assert
// the CURRENT outputs, including the defective ones recorded in audit/evidence/results.txt
// (for example, keyword salad scoring 86 on Message Editing). They are a regression base,
// not a statement that the outputs are correct. A later fix that changes a value must
// update the expected value here deliberately, bump scoringVersion and record the change
// in docs/SCORING.md and docs/CHANGELOG.md.
//
// Usage: npm test  (or: node --test tests/legacy-scoring.test.mjs)

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const LEGACY_PATH = fileURLToPath(new URL('../legacy/skills-assessment-hult.html', import.meta.url));

// Load the prototype's inline script into a Node VM with a permissive DOM stub,
// exactly as audit/evidence/harness.mjs does. Each call returns a fresh context.
function loadLegacy() {
  const html = readFileSync(LEGACY_PATH, 'utf8');
  let js = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  js = js.replace(/^\s*\(function\(\) \{/, '').replace(/\}\)\(\);\s*$/, '');
  function stub() {
    const f = function () { return stub(); };
    return new Proxy(f, {
      get(t, k) {
        if (k === 'value') return t._v ?? '';
        if (k === Symbol.toPrimitive) return () => '';
        if (k === 'length') return 0;
        if (k === 'forEach') return () => {};
        if (k in t) return t[k];
        return stub();
      },
      set(t, k, v) { t[k === 'value' ? '_v' : k] = v; return true; },
      apply() { return stub(); },
    });
  }
  const els = {};
  const document = {
    getElementById: (id) => (els[id] ??= stub()),
    querySelectorAll: () => [],
    createElement: () => stub(),
    addEventListener: () => {},
    body: stub(),
  };
  const ctx = vm.createContext({
    document, window: { scrollTo() {} },
    setTimeout: () => 0, setInterval: () => 0, clearInterval() {},
    console, Math, Object, Array, JSON, Blob: function () {}, URL: { createObjectURL() { return ''; } },
  });
  vm.runInContext(js, ctx);
  return { C: ctx, E: els };
}

const pct = (x) => Math.round(x * 100);

// ---------------------------------------------------------------- Curiosity: Information Gap
describe('Info Gap (curiosity), scoreIG', () => {
  const { C } = loadLegacy();
  const T = C.igTopics;
  const all = T.map((_, i) => i);
  const novel = all.filter((i) => T[i].novel);
  const nonNovel = all.filter((i) => !T[i].novel);
  function ig(sel) {
    C.state.ig.topics = C.igTopics.slice();
    C.state.ig.revealedIndices = sel;
    C.scoreIG();
    return pct(C.state.scores.curiosity.cognitive);
  }

  test('15 topics, 8 flagged novel', () => {
    assert.equal(T.length, 15);
    assert.equal(novel.length, 8);
  });
  test('click all 15 = 81', () => assert.equal(ig(all), 81));
  test('click 1 novel card = 45', () => assert.equal(ig([novel[0]]), 45));
  test('click only the 8 novel cards = 80', () => assert.equal(ig(novel), 80));
  test('click 1 non-novel card = 5', () => assert.equal(ig([nonNovel[0]]), 5));
  test('click the 7 non-novel cards = 35', () => assert.equal(ig(nonNovel), 35));
  test('click nothing = 0', () => assert.equal(ig([]), 0));
});

// ---------------------------------------------------------------- Critical thinking: Wason
describe('Wason (critical thinking), wasonSubmit + wasonNext', () => {
  const { C } = loadLegacy();
  // Runs all six problems through the real submit/next functions. Card indices refer to
  // the unshuffled card order of each problem, as in the audit evidence.
  function wason(selFn) {
    C.state.taskIndex = -1;
    C.state.wason = { problems: C.wasonProblems.slice(), currentIndex: 0, selected: [], results: [], submitted: false };
    for (let i = 0; i < C.wasonProblems.length; i++) {
      const w = C.state.wason;
      w.selected = selFn(w.problems[w.currentIndex]);
      w.submitted = false;
      C.wasonSubmit();
      C.wasonNext();
    }
    return pct(C.state.scores.criticalThinking.cognitive);
  }

  test('every problem has answer cards [0,3] before shuffling (6/6)', () => {
    assert.equal(C.wasonProblems.length, 6);
    assert.equal(C.wasonProblems.filter((p) => p.correct.join() === '0,3').length, 6);
  });
  test('correct (P, not-Q) every time = 100', () => assert.equal(wason(() => [0, 3]), 100));
  test('select all 4 cards every time = 50', () => assert.equal(wason(() => [0, 1, 2, 3]), 50));
  test('P only = 50', () => assert.equal(wason(() => [0]), 50));
  test('classic matching error P + Q = 25', () => assert.equal(wason(() => [0, 2]), 25));
  test('Q only = 0', () => assert.equal(wason(() => [2]), 0));
});

// ---------------------------------------------------------------- Creativity: AUT
describe('Alternate Uses Task (creativity), scoreAUT', () => {
  const { C, E } = loadLegacy();
  function aut(obj, lines) {
    C.state.aut.object = obj;
    E['aut-textarea'] = { value: lines.join('\n'), disabled: false };
    C.state.taskIndex = -1;
    C.scoreAUT();
    return pct(C.state.scores.creativity.cognitive);
  }
  const gibberish = ['zorp flim gax to blint', 'quax vend pliv to snorf', 'mibble track wun to grell', 'plon fesk tarn to wibb', 'yert sloom drav to kesp', 'vrin hamb trell to oskel', 'jusp ferl mabb to gweth', 'krenn zabb tulp to frax', 'nolb wisp drekk to yamb', 'teld varp quin to sorv'];
  const brickCommon = ['doorstop', 'paperweight', 'build a wall', 'throw it', 'weapon', 'weight'];
  const brickGood = ['heat it in the oven and wrap in a towel as a bed warmer', 'use it as a pizza stone', 'prop a shelf to make a bookcase', 'carve it into a sculpture', 'grind it into red pigment for paint', 'drill holes and use it as a planter for succulents', 'use as a step to reach a high cupboard', 'smash it into chips to make a garden path', 'use it as a dumbbell for workouts', 'mark the edge of a flower bed'];
  const brickWordy = brickCommon.map((s) => s + ' in order to help with things when needed by using it');

  test('seven objects in the taxonomy', () => assert.equal(Object.keys(C.AUT_TAXONOMY).length, 7));
  test('brick: 10 gibberish lines = 61', () => assert.equal(aut('brick', gibberish), 61));
  test('brick: 6 common uses = 27', () => assert.equal(aut('brick', brickCommon), 27));
  test('brick: 10 sensible varied uses = 67', () => assert.equal(aut('brick', brickGood), 67));
  test('brick: common uses padded with filler = 18', () => assert.equal(aut('brick', brickWordy), 18));
  test('originality of "use as ballast weight for a narrowboat" = 0', () =>
    assert.equal(C.autGetOriginality('use as ballast weight for a narrowboat', 'brick'), 0));
  test('originality of "asdf qwerty" = 2 (maximum)', () =>
    assert.equal(C.autGetOriginality('asdf qwerty', 'brick'), 2));
});

// ---------------------------------------------------------------- Communication: Message Editing
describe('Message Editing (communication), scoreME', () => {
  const { C } = loadLegacy();
  function me(fn) {
    C.state.me.passages = C.mePassages.slice();
    C.state.me.responses = C.mePassages.map(fn);
    C.state.taskIndex = -1;
    C.scoreME();
    return pct(C.state.scores.communication.cognitive);
  }
  const human = {
    'Ambiguity': 'The team leader told the senior manager: "Your report has several errors. You need to fix them before the deadline."',
    'Buried key information': 'We cannot approve your funding request at this time. We do appreciate the effort and the strength of your preliminary research.',
    'Jargon': 'Teams across the organisation need to work together more to deliver better results for the people we serve.',
    'Logical gap': 'Sales fell by 18% last quarter. We believe low brand awareness caused the fall, so we are raising the marketing budget by 40% to win back customers.',
    'Register inconsistency': 'Dear Professor Williams, I am writing to ask whether you would supervise my dissertation. I am very interested in your research on neural plasticity and would welcome the chance to discuss it, if you have time.',
  };

  test('five passages, one per human rewrite', () => {
    // Arrays from the VM context have a different Array prototype: copy before deepEqual.
    assert.deepEqual(Array.from(C.mePassages, (p) => p.label).sort(), Object.keys(human).sort());
  });
  test('careful human rewrites = 44', () => assert.equal(me((p) => human[p.label]), 44));
  test('keyword salad (keywords joined by spaces) = 86', () => assert.equal(me((p) => p.keywords.join(' ')), 86));
  test('original passage pasted back unchanged = 33', () => assert.equal(me((p) => p.plain), 33));
  test('keyword salad, comma-separated = 87', () => assert.equal(me((p) => p.keywords.join(', ')), 87));
});

// ---------------------------------------------------------------- Collaboration: Public Goods Game
describe('Public Goods Game (collaboration), pgConfirm', () => {
  const { C, E } = loadLegacy();
  function pg(contributions) {
    C.state.pg = { contributions: [], currentRound: 0, totalRounds: 6 };
    C.state.taskIndex = -1;
    for (const v of contributions) { E['pg-slider'] = { value: String(v) }; C.pgConfirm(); }
    return pct(C.state.scores.collaboration.cognitive);
  }
  test('20 every round = 100', () => assert.equal(pg([20, 20, 20, 20, 20, 20]), 100));
  test('0 every round = 0', () => assert.equal(pg([0, 0, 0, 0, 0, 0]), 0));
  test('10 every round = 50', () => assert.equal(pg([10, 10, 10, 10, 10, 10]), 50));
  test('alternating 0/20 = 30', () => assert.equal(pg([0, 20, 0, 20, 0, 20]), 30));
  test('20 declining to 0 = 41', () => assert.equal(pg([20, 16, 12, 8, 4, 0]), 41));
});

// ---------------------------------------------------------------- Self-assessment
describe('Self-assessment, computeSAScore', () => {
  const { C } = loadLegacy();
  const best = (it) => (it.scores[0] >= it.scores[1] ? 'a' : 'b');
  const worst = (it) => (it.scores[0] < it.scores[1] ? 'a' : 'b');
  // First skill (collaboration), as in the audit evidence.
  function sa(likert, fcPick) {
    const sk = C.saSkills[0];
    sk.likert.forEach((_, i) => { C.state.saResponses[sk.key + '_l' + i] = Array.isArray(likert) ? likert[i] : likert; });
    sk.forcedChoice.forEach((it, i) => { C.state.saResponses[sk.key + '_fc' + i] = fcPick(it); });
    C.computeSAScore(sk);
    const s = C.state.scores[sk.key];
    return { self: pct(s.self), likert: pct(s.selfLikert), fc: pct(s.selfFC), r: Number(s.consistency.toFixed(2)) };
  }

  test('five skills, each with 5 Likert and 4 forced-choice items', () => {
    assert.equal(C.saSkills.length, 5);
    assert.equal(C.saSkills[0].key, 'collaboration');
    for (const s of C.saSkills) {
      assert.equal(s.likert.length, 5);
      assert.equal(s.forcedChoice.length, 4);
    }
  });
  test('all 1 (disagree all) + best FC: self 96, likert 100, fc 94, r 0', () =>
    assert.deepEqual(sa(1, best), { self: 96, likert: 100, fc: 94, r: 0 }));
  test('all 5 (agree all) + worst FC: self 28, likert 0, fc 46, r 0', () =>
    assert.deepEqual(sa(5, worst), { self: 28, likert: 0, fc: 46, r: 0 }));
  test('all 3 midpoint + best FC: self 76, likert 50, fc 94, r 0', () =>
    assert.deepEqual(sa(3, best), { self: 76, likert: 50, fc: 94, r: 0 }));
  test('1,2,1,2,1: self 92, likert 90, fc 94, r 0', () =>
    assert.deepEqual(sa([1, 2, 1, 2, 1], best), { self: 92, likert: 90, fc: 94, r: 0 }));
  test('1,5,1,5,1: self 80, likert 60, fc 94, r 0', () =>
    assert.deepEqual(sa([1, 5, 1, 5, 1], best), { self: 80, likert: 60, fc: 94, r: 0 }));
  test('2,1,2,1,2: self 90, likert 85, fc 94, r 0', () =>
    assert.deepEqual(sa([2, 1, 2, 1, 2], best), { self: 90, likert: 85, fc: 94, r: 0 }));

  test('forced-choice pairs with score gap >= 0.5: 13/20', () => {
    const gaps = [];
    C.saSkills.forEach((s) => s.forcedChoice.forEach((it) => gaps.push(Math.abs(it.scores[0] - it.scores[1]))));
    assert.equal(gaps.length, 20);
    assert.equal(gaps.filter((g) => g >= 0.5).length, 13);
  });
  test('forced-choice theoretical floor and ceiling per skill', () => {
    const range = Object.fromEntries(C.saSkills.map((s) => [s.key, [
      pct(s.forcedChoice.reduce((a, it) => a + Math.min(...it.scores), 0) / 4),
      pct(s.forcedChoice.reduce((a, it) => a + Math.max(...it.scores), 0) / 4),
    ]]));
    assert.deepEqual(range, {
      collaboration: [46, 94], curiosity: [48, 100], criticalThinking: [39, 100], creativity: [66, 95], communication: [53, 98],
    });
  });
});

// ---------------------------------------------------------------- Within-person "consistency" (cons.mjs)
describe('Likert "split-half" consistency over all 3,125 response patterns', () => {
  const { C } = loadLegacy();
  const sk = C.saSkills[0];
  let n = 0, lt3 = 0, lt5 = 0, zero = 0, nan = 0;
  for (let a = 1; a <= 5; a++) for (let b = 1; b <= 5; b++) for (let c = 1; c <= 5; c++) for (let d = 1; d <= 5; d++) for (let e = 1; e <= 5; e++) {
    [a, b, c, d, e].forEach((x, i) => { C.state.saResponses[sk.key + '_l' + i] = x; });
    sk.forcedChoice.forEach((_, i) => { C.state.saResponses[sk.key + '_fc' + i] = 'a'; });
    C.computeSAScore(sk);
    const r = C.state.scores[sk.key].consistency;
    n++; if (r < 0.3) lt3++; if (r < 0.5) lt5++; if (r === 0) zero++; if (Number.isNaN(r)) nan++;
  }
  const share = (k) => (100 * k / n).toFixed(1) + '%';

  test('3,125 patterns', () => assert.equal(n, 3125));
  test('62.5% trigger the "Low internal consistency" notice (r < 0.3)', () => assert.equal(share(lt3), '62.5%'));
  test('65.6% get a "Check consistency" badge (r < 0.5)', () => assert.equal(share(lt5), '65.6%'));
  test('16.0% have r exactly 0', () => assert.equal(share(zero), '16.0%'));
  test('no NaN values', () => assert.equal(nan, 0));
  test('every straight-line pattern gives r = 0', () => {
    for (let v = 1; v <= 5; v++) {
      [0, 1, 2, 3, 4].forEach((i) => { C.state.saResponses[sk.key + '_l' + i] = v; });
      C.computeSAScore(sk);
      assert.equal(C.state.scores[sk.key].consistency, 0, `straight-line ${v}`);
    }
  });
});

// ---------------------------------------------------------------- Composite
describe('Composite, computeAllComposites', () => {
  function composite(cog, self, flags) {
    const { C } = loadLegacy();
    C.state.fakingFlags = flags;
    for (const k of Object.keys(C.state.scores)) Object.assign(C.state.scores[k], { cognitive: cog, self });
    C.computeAllComposites();
    return pct(C.state.scores.collaboration.composite);
  }
  test('performance 0.40, self 1.00, no faking flags = 67', () => assert.equal(composite(0.40, 1.0, 0), 67));
  test('performance 0.60, self 0.45, no faking flags = 53', () => assert.equal(composite(0.60, 0.45, 0), 53));
  test('two or more faking flags shift weight to 65/35', () => assert.equal(composite(0.40, 1.0, 2), 61));
  test('missing scores (null) become 0.5, so composite = 50', () => assert.equal(composite(null, null, 0), 50));
});
