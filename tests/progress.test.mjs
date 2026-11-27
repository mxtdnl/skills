import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSittingCode, checkProgrammeCode, newProgrammeSittings, activeProgramme, nextProgrammeStep,
  modeStatus, stepState, nextStep, stepAllowed, lastActivity, newSitting, canStartSelfAssessment,
  formForSelfAssessment, programmeWindowId,
} from '../src/app/progress.js';
import { stepsFor } from '../src/skills/registry.js';
import { firstForm } from '../src/skills/runner.js';
import { validate } from '../src/core/schema.js';
import example from '../src/skills/_example/index.js';
import * as fx from './fixtures.mjs';

const participant = fx.participant();
const empty = () => ({ participant, sittings: [], attempts: [], selfReports: [] });
const getSkill = (id) => (id === '_example' ? example : undefined);
let clock = Date.parse('2026-11-27T09:00:00.000Z');
const now = () => (clock += 1000);

function attempt(sitting, taskId, status = 'complete') {
  return fx.attempt({ id: `A-${String(Math.random()).slice(2, 18).padEnd(16, '0')}`, sittingId: sitting.id, taskId, status, ...(status === 'complete' ? {} : { rawScore: null, score: null, completedAt: null }) });
}
function selfReport(sitting, status = 'complete') {
  return fx.selfReport({ id: `R-${String(Math.random()).slice(2, 18).padEnd(16, '0')}`, sittingId: sitting.id, status, ...(status === 'complete' ? {} : { score: null, completedAt: null }) });
}

test('sitting codes: letters or digits, a hyphen and a window digit; normalised to upper case', () => {
  assert.deepEqual(parseSittingCode(' sep26-1 '), { code: 'SEP26-1', window: 1 });
  assert.deepEqual(parseSittingCode('HULT 2027-2'), { code: 'HULT2027-2', window: 2 });
  for (const bad of ['', 'SEP26', 'SEP26-0', 'S-1', 'SEP26-12', 'SEP_26-1', 'ABCDEFGHIJKLM-1', null]) assert.equal(parseSittingCode(bad), null, String(bad));
});

test('new sittings are valid records', () => {
  const p = newSitting({ participant, skillId: '_example', mode: 'practice', now });
  assert.deepEqual(validate('sitting', p).errors, []);
  assert.equal(p.formId, 'practice');
  const a = newSitting({ participant, skillId: '_example', mode: 'assessment', windowId: 'self', formId: 'B', now });
  assert.deepEqual(validate('sitting', a).errors, []);
});

test('a programme battery has one sitting per skill, in the fixed order, with the window form', () => {
  const order = ['collaboration', 'curiosity', '_example'];
  const start = newProgrammeSittings({ participant, code: 'SEP26-1', window: 1, skillOrder: order, now });
  assert.deepEqual(start.map((s) => [s.skillId, s.programme.position]), [['collaboration', 0], ['curiosity', 1], ['_example', 2]]);
  for (const s of start) {
    assert.deepEqual(validate('sitting', s).errors, []);
    assert.deepEqual(s.programme.skillOrder, order);
    assert.equal(s.windowId, programmeWindowId('SEP26-1'));
    assert.equal(s.formId, firstForm(participant.id));
  }
  const end = newProgrammeSittings({ participant, code: 'SEP26-2', window: 2, skillOrder: order, now });
  assert.ok(end.every((s) => s.formId !== firstForm(participant.id)), 'the end-of-programme window takes the other form');
});

test('checkProgrammeCode refuses malformed, used and overlapping codes', () => {
  const data = empty();
  assert.deepEqual(checkProgrammeCode(data, 'nope', ['_example']), { ok: false, reason: 'format' });
  assert.deepEqual(checkProgrammeCode(data, 'sep26-1', []), { ok: false, reason: 'empty' });
  assert.deepEqual(checkProgrammeCode(data, 'sep26-1', ['_example']), { ok: true, code: 'SEP26-1', window: 1 });
  data.sittings.push(...newProgrammeSittings({ participant, code: 'SEP26-1', window: 1, skillOrder: ['_example'], now }));
  assert.deepEqual(checkProgrammeCode(data, 'SEP26-1', ['_example']), { ok: false, reason: 'used' });
  assert.deepEqual(checkProgrammeCode(data, 'SEP26-2', ['_example']), { ok: false, reason: 'active' });
});

test('the active programme advances step by step and ends when every skill is complete', () => {
  const data = empty();
  const [s] = newProgrammeSittings({ participant, code: 'SEP26-1', window: 1, skillOrder: ['_example'], now });
  data.sittings.push(s);
  let prog = activeProgramme(data, getSkill);
  assert.equal(prog.code, 'SEP26-1');
  assert.equal(nextProgrammeStep(data, prog, getSkill).step.id, 'self-report');
  data.selfReports.push(selfReport(s));
  assert.equal(nextProgrammeStep(data, prog, getSkill).step.id, 'pick');
  data.attempts.push(attempt(s, 'pick'));
  assert.equal(activeProgramme(data, getSkill), null);
});

test('step states and order: assessment steps in order, practice steps in any order', () => {
  const data = empty();
  const s = newSitting({ participant, skillId: '_example', mode: 'assessment', windowId: 'self', formId: 'A', now });
  data.sittings.push(s);
  const steps = stepsFor(example, 'assessment');
  assert.equal(stepState(data, s, steps[0]), 'not-started');
  assert.equal(stepAllowed(data, s, steps[1], steps, getSkill), false, 'the task waits for the self-report');
  data.selfReports.push(selfReport(s, 'in-progress'));
  assert.equal(stepState(data, s, steps[0]), 'in-progress');
  assert.equal(nextStep(data, s, steps).id, 'self-report');
  assert.equal(modeStatus(data, example, 'assessment'), 'in-progress');
  assert.equal(modeStatus(data, example, 'practice'), 'not-started');
  data.selfReports.push(selfReport(s));
  assert.equal(stepState(data, s, steps[0]), 'complete', 'a complete record wins over an in-progress one');
  assert.equal(stepAllowed(data, s, steps[1], steps, getSkill), true);
  const p = newSitting({ participant, skillId: '_example', mode: 'practice', now });
  assert.equal(stepAllowed(data, p, stepsFor(example, 'practice')[0], stepsFor(example, 'practice'), getSkill), true);
});

test('one self-directed assessment per skill; the form alternates from the previous sitting', () => {
  const data = empty();
  assert.deepEqual(canStartSelfAssessment(data, '_example'), { ok: true });
  assert.equal(formForSelfAssessment(data, '_example'), firstForm(participant.id));
  const s = newSitting({ participant, skillId: '_example', mode: 'assessment', windowId: 'self', formId: 'A', now });
  data.sittings.push(s);
  assert.equal(canStartSelfAssessment(data, '_example').reason, 'exists');
  assert.equal(formForSelfAssessment(data, '_example'), 'B');
});

test('practice and assessment are tracked separately', () => {
  const data = empty();
  const p = newSitting({ participant, skillId: '_example', mode: 'practice', now });
  data.sittings.push(p);
  data.attempts.push(attempt(p, 'pick'));
  assert.equal(modeStatus(data, example, 'practice'), 'complete');
  assert.equal(modeStatus(data, example, 'assessment'), 'not-started');
});

test('lastActivity is the latest timestamp across records', () => {
  const data = empty();
  assert.equal(lastActivity(data), participant.createdAt);
  const s = newSitting({ participant, skillId: '_example', mode: 'practice', now });
  data.sittings.push(s);
  data.attempts.push(attempt(s, 'pick', 'in-progress'));
  assert.equal(lastActivity(data), s.startedAt > '2026-11-26T09:00:02.200Z' ? s.startedAt : '2026-11-26T09:00:02.200Z');
});
