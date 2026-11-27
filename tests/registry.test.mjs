import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRegistry, loadSkills, validateManifest, validateContent, stepsFor, EXAMPLE_MODULES, SKILL_MODULES, SKILL_CATALOGUE, SELF_REPORT_STEP } from '../src/skills/registry.js';
import { runTask, runStep, itemsFor, assignForm, firstForm } from '../src/skills/runner.js';
import { seedFromString } from '../src/core/rng.js';
import { SCORING_VERSION } from '../src/core/version.js';
import * as exampleSelfReport from '../content/_example/self-report.js';
import { MemoryAdapter } from '../src/core/store.js';
import { validate } from '../src/core/schema.js';
import example from '../src/skills/_example/index.js';
import * as exampleContent from '../content/_example/pick.js';
import * as fx from './fixtures.mjs';

// A manifest that renders nothing, for testing the runner without a DOM.
function fakeSkill(over = {}) {
  return {
    id: 'fake',
    label: 'Fake',
    accentToken: '--accent-8',
    facets: [{ code: 'FK1', label: 'Fake facet' }],
    selfReport: null,
    tasks: [{
      id: 't1', label: 'Task', type: 'choice', estMinutes: 1, facets: ['FK1'],
      loadContent: async () => ({ formA: [{ id: 'FA1', status: 'draft' }], formB: [{ id: 'FB1', status: 'draft' }], practice: [{ id: 'FP1', status: 'draft' }] }),
      mount: (el, ctx) => {
        const t0 = ctx.now();
        ctx.createTimer(60_000).start();
        for (const item of ctx.items) ctx.record({ itemId: item.id, response: 'x', shownAt: t0, answeredAt: t0 + 500 });
        ctx.complete();
      },
      score: (attempt) => ({ rawScore: attempt.itemResponses.length, score: attempt.itemResponses.length }),
    }],
    ...over,
  };
}

test('the example manifest satisfies the contract', () => {
  assert.deepEqual(validateManifest(example), []);
  assert.deepEqual(validateContent(exampleContent), []);
  assert.deepEqual(validateContent(exampleSelfReport), []);
});

test('the skill catalogue lists the five skills in canonical order with unique accents', () => {
  assert.deepEqual(SKILL_CATALOGUE.map((s) => s.id), ['collaboration', 'curiosity', 'critical', 'creativity', 'communication']);
  for (const c of SKILL_CATALOGUE) {
    assert.equal(c.accentToken, `--skill-${c.id}`);
    assert.ok(c.facets.length >= 2 && c.facets.length <= 4, c.id);
  }
});

test('stepsFor puts the self-report first in assessment and leaves it out of practice', () => {
  assert.deepEqual(stepsFor(example, 'assessment').map((s) => [s.id, s.kind]), [[SELF_REPORT_STEP, 'selfReport'], ['pick', 'task']]);
  assert.deepEqual(stepsFor(example, 'practice').map((s) => s.id), ['pick']);
  assert.ok(validateManifest(fakeSkill({ tasks: [{ ...fakeSkill().tasks[0], id: SELF_REPORT_STEP }] })).some((e) => e.includes('reserved')));
});

test('loadSkills imports the example module', async () => {
  const reg = await loadSkills(EXAMPLE_MODULES);
  assert.deepEqual(reg.list().map((s) => s.id), ['_example']);
  assert.equal(reg.getTask('_example', 'pick').type, 'choice');
  assert.equal(reg.getTask('_example', 'nope'), undefined);
  assert.equal(reg.get('nope'), undefined);
});

test('the five production skills are registered in canonical order, agree with the catalogue, and the stub is never among them', async () => {
  assert.ok(!SKILL_MODULES.some((s) => s.includes('_example')));
  const reg = await loadSkills(SKILL_MODULES);
  assert.deepEqual(reg.list().map((s) => s.id), SKILL_CATALOGUE.map((c) => c.id));
  for (const c of SKILL_CATALOGUE) {
    const m = reg.get(c.id);
    assert.equal(m.label, c.label);
    assert.equal(m.accentToken, c.accentToken);
    assert.deepEqual(m.facets, c.facets);
    assert.ok(m.selfReport, `${c.id} has a self-report`);
  }
});

test('validateManifest reports contract violations', () => {
  assert.deepEqual(validateManifest(null), ['manifest: must be an object']);
  const bad = fakeSkill({ id: 'Bad', accentToken: 'red', facets: [{ code: 'x' }], selfReport: {}, tasks: [{ id: 't1', facets: ['ZZ9'] }, { id: 't1' }] });
  const errs = validateManifest(bad).join('\n');
  for (const s of ['id must be a lower-case slug', 'accentToken', 'code must look like CT1', 'selfReport: loadContent() is required', 'mount(el, ctx) is required', 'score(attempt, form) is required', 'duplicate task id t1', 'facet ZZ9 is not declared']) {
    assert.ok(errs.includes(s), `missing: ${s}`);
  }
});

test('createRegistry refuses duplicate ids and shared accents', () => {
  assert.throws(() => createRegistry([fakeSkill(), fakeSkill()]), /duplicate skill id/);
  assert.throws(() => createRegistry([fakeSkill(), fakeSkill({ id: 'other' })]), /accent --accent-8 already used by fake/);
  assert.throws(() => createRegistry([{ id: 'x' }]), /Invalid skill manifests/);
});

test('validateContent enforces ids, status and separate pools', () => {
  const item = (id, status = 'draft') => ({ id, status });
  assert.deepEqual(validateContent({ formA: [item('a')], formB: [item('b')], practice: [item('p')] }), []);
  const errs = validateContent({ formA: [item('a'), item('x', 'final')], formB: [item('a')], practice: [item('a')] });
  assert.equal(errs.length, 3);
  assert.ok(errs.some((e) => e.includes('status must be')));
  assert.ok(errs.some((e) => e.startsWith('practice[0] a: id also used in formA')));
  assert.deepEqual(validateContent({ formA: [] }), ['formB: must be an array', 'practice: must be an array']);
});

test('itemsFor keeps practice and assessment pools apart', () => {
  assert.deepEqual(itemsFor(exampleContent, 'practice', 'practice').map((i) => i.id), ['EX-PICK-P01', 'EX-PICK-P02']);
  assert.deepEqual(itemsFor(exampleContent, 'assessment', 'A').map((i) => i.id), ['EX-PICK-A01', 'EX-PICK-A02']);
  assert.deepEqual(itemsFor(exampleContent, 'assessment', 'B').map((i) => i.id), ['EX-PICK-B01', 'EX-PICK-B02']);
  assert.throws(() => itemsFor(exampleContent, 'practice', 'A'), RangeError);
  assert.throws(() => itemsFor(exampleContent, 'assessment', 'practice'), RangeError);
});

test('firstForm uses the parity of a hash of the participant ID: even A first, odd B first', () => {
  const ids = ['P-0000-00000', 'P-7K3M-Q9TX4', 'P-1111-11111', 'P-ABCD-EFGH0'];
  for (const id of ids) assert.equal(firstForm(id), seedFromString(id) % 2 === 0 ? 'A' : 'B', id);
  // Both orders occur, so the parity really splits participants.
  const forms = new Set(Array.from({ length: 40 }, (_, i) => firstForm(`P-0000-${String(i).padStart(5, '0')}`)));
  assert.deepEqual([...forms].sort(), ['A', 'B']);
});

test('assignForm counterbalances by programme window and alternates self-directed sittings', () => {
  const even = ['P-0000-00000', 'P-0000-00001', 'P-0000-00002'].find((id) => firstForm(id) === 'A');
  const odd = Array.from({ length: 40 }, (_, i) => `P-0000-${String(i).padStart(5, '0')}`).find((id) => firstForm(id) === 'B');
  assert.equal(assignForm({ participantId: even, programmeWindow: 1 }), 'A');
  assert.equal(assignForm({ participantId: even, programmeWindow: 2 }), 'B');
  assert.equal(assignForm({ participantId: odd, programmeWindow: 1 }), 'B');
  assert.equal(assignForm({ participantId: odd, programmeWindow: 2 }), 'A');
  assert.equal(assignForm({ participantId: even }), 'A');
  assert.equal(assignForm({ participantId: even, previousFormId: 'A' }), 'B');
  assert.equal(assignForm({ participantId: odd, previousFormId: 'B' }), 'A');
});

test('runTask scores and saves a valid attempt with timings and versions', async () => {
  const store = new MemoryAdapter();
  const skill = fakeSkill();
  let t = 1_700_000_000_000;
  const attempt = await runTask({ skill, task: skill.tasks[0], sitting: fx.sitting({ formId: 'B' }), store, el: null, multiplier: 1.5, now: () => t }).done;
  assert.deepEqual(validate('taskAttempt', attempt).errors, []);
  assert.deepEqual(attempt.itemResponses.map((r) => [r.itemId, r.rtMs]), [['FB1', 500]]);
  assert.equal(attempt.rawScore, 1);
  assert.equal(attempt.scoringVersion, SCORING_VERSION);
  assert.equal(attempt.status, 'complete');
  assert.equal(attempt.completedAt, new Date(t).toISOString());
  assert.deepEqual(attempt.timing, { limitMs: 60_000, multiplier: 1.5, extendedMs: 0, pausedMs: 0, expired: false });
  assert.deepEqual(await store.load('taskAttempt', attempt.id), attempt);
});

test('runTask refuses invalid content', async () => {
  const skill = fakeSkill();
  skill.tasks[0].loadContent = async () => ({ formA: [{ id: 'x' }], formB: [], practice: [] });
  await assert.rejects(runTask({ skill, task: skill.tasks[0], sitting: fx.sitting(), store: new MemoryAdapter(), el: null }).done, /Content for fake\/t1 is invalid/);
});

test('runTask cancelled before it loads saves nothing', async () => {
  const store = new MemoryAdapter();
  const skill = fakeSkill();
  skill.tasks[0].mount = () => () => {};
  const run = runTask({ skill, task: skill.tasks[0], sitting: fx.sitting(), store, el: null });
  await run.cancel();
  assert.equal(await run.done, null);
  assert.deepEqual(await store.list('taskAttempt'), []);
});

// A step that records one response per call to answer(), so a test can stop it part-way.
function stepwiseSkill() {
  const skill = fakeSkill();
  let ctxRef = null;
  skill.tasks[0].loadContent = async () => ({ formA: [{ id: 'FA1', status: 'draft' }, { id: 'FA2', status: 'draft' }, { id: 'FA3', status: 'draft' }], formB: [], practice: [] });
  skill.tasks[0].mount = (el, ctx) => { ctxRef = ctx; ctxRef.mountedWith = ctx.resume.map((r) => r.itemId); return () => {}; };
  const answer = async () => {
    const answered = new Set(ctxRef.resume.map((r) => r.itemId));
    const done = ctxRef.answered || (ctxRef.answered = [...answered]);
    const item = ctxRef.items.find((it) => !done.includes(it.id));
    done.push(item.id);
    await ctxRef.record({ itemId: item.id, response: item.id.toLowerCase(), shownAt: ctxRef.now() });
    if (done.length === ctxRef.items.length) ctxRef.complete();
  };
  return { skill, step: { kind: 'task', id: 't1', def: skill.tasks[0] }, answer, ctx: () => ctxRef };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

test('runStep autosaves after every response and resumes at the next item', async () => {
  const store = new MemoryAdapter();
  const sitting = fx.sitting();
  const a = stepwiseSkill();
  const first = runStep({ skill: a.skill, step: a.step, sitting, store, el: null });
  await tick();
  const [started] = await store.list('taskAttempt');
  assert.equal(started.status, 'in-progress', 'saved as soon as the step starts');
  assert.deepEqual(started.itemResponses, []);
  await a.answer();
  let [saved] = await store.list('taskAttempt');
  assert.deepEqual(saved.itemResponses.map((r) => r.itemId), ['FA1']);
  assert.deepEqual(validate('taskAttempt', saved).errors, []);
  await first.cancel();
  assert.equal(await first.done, null);

  // Reload: resume from the stored in-progress record.
  const b = stepwiseSkill();
  [saved] = await store.list('taskAttempt');
  const second = runStep({ skill: b.skill, step: b.step, sitting, store, el: null, existing: saved });
  await tick();
  assert.deepEqual(b.ctx().mountedWith, ['FA1']);
  await b.answer();
  await b.answer();
  const done = await second.done;
  assert.equal(done.id, saved.id, 'the same record is completed');
  assert.equal(done.status, 'complete');
  assert.deepEqual(done.itemResponses.map((r) => r.itemId), ['FA1', 'FA2', 'FA3']);
  assert.equal((await store.list('taskAttempt')).length, 1);
});

test('rngFor gives the same order for an item on every mount', async () => {
  const seen = [];
  for (let i = 0; i < 2; i++) {
    const a = stepwiseSkill();
    runStep({ skill: a.skill, step: a.step, sitting: fx.sitting(), store: new MemoryAdapter(), el: null });
    await tick();
    seen.push(a.ctx().rngFor('FA2').shuffle([0, 1, 2, 3, 4, 5]));
  }
  assert.deepEqual(seen[0], seen[1]);
});

test('runStep refuses an existing record that is not an in-progress record of this sitting', () => {
  const a = stepwiseSkill();
  assert.throws(() => runStep({ skill: a.skill, step: a.step, sitting: fx.sitting(), store: new MemoryAdapter(), el: null, existing: fx.attempt() }), RangeError);
});

test('runStep saves a timed step\'s timer while in progress and restores it on resume', async () => {
  const store = new MemoryAdapter();
  let t = 1_700_000_000_000;
  const now = () => t;
  const a = stepwiseSkill();
  const inner = a.skill.tasks[0].mount;
  a.skill.tasks[0].mount = (el, ctx) => { const r = inner(el, ctx); ctx.createTimer(60_000).start(); return r; };
  const run = runStep({ skill: a.skill, step: a.step, sitting: fx.sitting(), store, el: null, now, multiplier: 2 });
  await tick();
  t += 10_000;
  await a.answer();
  t += 5_000;
  await run.cancel();
  const [saved] = await store.list('taskAttempt');
  assert.equal(saved.timerSnapshot.state, 'paused', 'leaving pauses the timer');
  assert.equal(saved.timerSnapshot.remainingMs, 120_000 - 15_000);

  const b = stepwiseSkill();
  let timer = null;
  const innerB = b.skill.tasks[0].mount;
  b.skill.tasks[0].mount = (el, ctx) => { const r = innerB(el, ctx); timer = ctx.createTimer(60_000); timer.resume(); return r; };
  const resumed = runStep({ skill: b.skill, step: b.step, sitting: fx.sitting(), store, el: null, now, existing: saved });
  await tick();
  assert.equal(timer.remainingMs(), 105_000);
  await b.answer();
  await b.answer();
  const done = await resumed.done;
  assert.equal(done.timerSnapshot, undefined);
  assert.deepEqual(done.timing, { limitMs: 60_000, multiplier: 2, extendedMs: 0, pausedMs: 0, expired: false });
});

test('runStep resumes a timer saved while running as paused at the moment of the last save (S8)', async () => {
  const store = new MemoryAdapter();
  let t = 1_700_000_000_000;
  const now = () => t;
  const a = stepwiseSkill();
  const inner = a.skill.tasks[0].mount;
  a.skill.tasks[0].mount = (el, ctx) => { const r = inner(el, ctx); ctx.createTimer(60_000).start(); return r; };
  runStep({ skill: a.skill, step: a.step, sitting: fx.sitting(), store, el: null, now });
  await tick();
  t += 20_000;
  await a.answer(); // saved while running, 40 s left
  const [saved] = await store.list('taskAttempt');
  assert.equal(saved.timerSnapshot.state, 'running');

  t += 600_000; // the page was closed for ten minutes, without Save and exit
  const b = stepwiseSkill();
  let timer = null;
  const innerB = b.skill.tasks[0].mount;
  b.skill.tasks[0].mount = (el, ctx) => { const r = innerB(el, ctx); timer = ctx.createTimer(60_000); return r; };
  const resumed = runStep({ skill: b.skill, step: b.step, sitting: fx.sitting(), store, el: null, now, existing: saved });
  await tick();
  assert.equal(timer.state, 'paused', 'the time away is not counted');
  assert.equal(timer.remainingMs(), 40_000);
  timer.resume();
  t += 5_000;
  assert.equal(timer.remainingMs(), 35_000);
  await b.answer();
  await b.answer();
  const done = await resumed.done;
  assert.equal(done.timing.pausedMs, 600_000);
  assert.equal(done.timing.expired, false);
});

test('runStep runs a self-report and stores a SelfReport record', async () => {
  const store = new MemoryAdapter();
  const step = stepsFor(example, 'assessment')[0];
  const fakeSr = {
    ...example.selfReport,
    mount: (el, ctx) => { for (const it of ctx.items) ctx.record({ itemId: it.id, response: 4, shownAt: ctx.now() }); ctx.complete(); },
  };
  const r = await runStep({ skill: example, step: { ...step, def: fakeSr }, sitting: fx.sitting({ formId: 'B' }), store, el: null }).done;
  assert.equal(r.type, 'selfReport');
  assert.deepEqual(r.responses.map((x) => x.itemId), ['EX-SR-B01', 'EX-SR-B02']);
  assert.deepEqual(r.score, { EX1: 4 });
  assert.deepEqual(validate('selfReport', r).errors, []);
});

test('example score() counts correct choices against the form key', () => {
  const task = example.tasks[0];
  const form = exampleContent.formA;
  const r = (itemId, choice) => ({ itemId, response: { choice } });
  assert.deepEqual(task.score({ itemResponses: [r('EX-PICK-A01', 1), r('EX-PICK-A02', 0)] }, form), { rawScore: 1, score: { EX1: 0.5 } });
  assert.deepEqual(task.score({ itemResponses: [r('EX-PICK-B01', 2)] }, form), { rawScore: 0, score: { EX1: 0 } }, 'items from another form never score');
  assert.deepEqual(task.score({ itemResponses: [] }, []), { rawScore: 0, score: { EX1: null } });
});

test('example self-report score() is the mean rating on the form, ignoring other items and bad values', () => {
  const r = (itemId, response) => ({ itemId, response });
  const form = exampleSelfReport.formA;
  assert.deepEqual(example.selfReport.score({ responses: [r('EX-SR-A01', 5), r('EX-SR-A02', 2)] }, form), { score: { EX1: 3.5 } });
  assert.deepEqual(example.selfReport.score({ responses: [r('EX-SR-B01', 5), r('EX-SR-A01', 9), r('EX-SR-A02', 4)] }, form), { score: { EX1: 4 } });
  assert.deepEqual(example.selfReport.score({ responses: [] }, form), { score: { EX1: null } });
});
