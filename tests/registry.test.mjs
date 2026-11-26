import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRegistry, loadSkills, validateManifest, validateContent, EXAMPLE_MODULES, SKILL_MODULES } from '../src/skills/registry.js';
import { runTask, itemsFor, assignForm } from '../src/skills/runner.js';
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
});

test('loadSkills imports the example module', async () => {
  const reg = await loadSkills(EXAMPLE_MODULES);
  assert.deepEqual(reg.list().map((s) => s.id), ['_example']);
  assert.equal(reg.getTask('_example', 'pick').type, 'choice');
  assert.equal(reg.getTask('_example', 'nope'), undefined);
  assert.equal(reg.get('nope'), undefined);
});

test('no production skills are registered before S6, and the stub is never among them', () => {
  assert.deepEqual(SKILL_MODULES, []);
  assert.ok(!SKILL_MODULES.some((s) => s.includes('_example')));
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
  assert.deepEqual(itemsFor(exampleContent, 'practice', 'practice').map((i) => i.id), ['EX-PICK-P01']);
  assert.deepEqual(itemsFor(exampleContent, 'assessment', 'A').map((i) => i.id), ['EX-PICK-A01', 'EX-PICK-A02']);
  assert.deepEqual(itemsFor(exampleContent, 'assessment', 'B').map((i) => i.id), ['EX-PICK-B01', 'EX-PICK-B02']);
  assert.throws(() => itemsFor(exampleContent, 'practice', 'A'), RangeError);
  assert.throws(() => itemsFor(exampleContent, 'assessment', 'practice'), RangeError);
});

test('assignForm counterbalances: second sitting gets the other form', () => {
  assert.equal(assignForm({ seed: 2 }), 'A');
  assert.equal(assignForm({ seed: 3 }), 'B');
  assert.equal(assignForm({ seed: 2, previousFormId: 'A' }), 'B');
  assert.equal(assignForm({ seed: 3, previousFormId: 'B' }), 'A');
});

test('runTask scores and saves a valid attempt with timings and versions', async () => {
  const store = new MemoryAdapter();
  const skill = fakeSkill();
  let t = 1_700_000_000_000;
  const attempt = await runTask({ skill, task: skill.tasks[0], sitting: fx.sitting({ formId: 'B' }), store, el: null, multiplier: 1.5, now: () => t }).done;
  assert.deepEqual(validate('taskAttempt', attempt).errors, []);
  assert.deepEqual(attempt.itemResponses.map((r) => [r.itemId, r.rtMs]), [['FB1', 500]]);
  assert.equal(attempt.rawScore, 1);
  assert.equal(attempt.scoringVersion, '0.2.0');
  assert.deepEqual(attempt.timing, { limitMs: 60_000, multiplier: 1.5, extendedMs: 0, pausedMs: 0, expired: false });
  assert.deepEqual(await store.load('taskAttempt', attempt.id), attempt);
});

test('runTask refuses invalid content', async () => {
  const skill = fakeSkill();
  skill.tasks[0].loadContent = async () => ({ formA: [{ id: 'x' }], formB: [], practice: [] });
  await assert.rejects(runTask({ skill, task: skill.tasks[0], sitting: fx.sitting(), store: new MemoryAdapter(), el: null }).done, /Content for fake\/t1 is invalid/);
});

test('runTask cancel saves nothing', async () => {
  const store = new MemoryAdapter();
  const skill = fakeSkill();
  skill.tasks[0].mount = () => () => {};
  const run = runTask({ skill, task: skill.tasks[0], sitting: fx.sitting(), store, el: null });
  run.cancel();
  assert.equal(await run.done, null);
  assert.deepEqual(await store.list('taskAttempt'), []);
});

test('example score() counts correct choices against the form key', () => {
  const task = example.tasks[0];
  const form = exampleContent.formA;
  const r = (itemId, choice) => ({ itemId, response: { choice } });
  assert.deepEqual(task.score({ itemResponses: [r('EX-PICK-A01', 1), r('EX-PICK-A02', 0)] }, form), { rawScore: 1, score: { EX1: 0.5 } });
  assert.deepEqual(task.score({ itemResponses: [r('EX-PICK-B01', 2)] }, form), { rawScore: 0, score: { EX1: 0 } }, 'items from another form never score');
  assert.deepEqual(task.score({ itemResponses: [] }, []), { rawScore: 0, score: { EX1: null } });
});
