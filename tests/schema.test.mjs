import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validate, assertValid, toJsonSchema, RECORD_TYPES } from '../src/core/schema.js';
import * as fx from './fixtures.mjs';

const errorsOf = (type, r) => validate(type, r).errors.map((e) => `${e.path} ${e.message}`);

test('valid fixtures pass', () => {
  for (const [type, make] of [['participant', fx.participant], ['sitting', fx.sitting], ['taskAttempt', fx.attempt], ['selfReport', fx.selfReport]]) {
    assert.deepEqual(errorsOf(type, make()), [], type);
  }
});

test('record types are exactly the four in the data model', () => {
  assert.deepEqual(RECORD_TYPES, ['participant', 'sitting', 'taskAttempt', 'selfReport']);
});

test('missing required fields are reported', () => {
  const r = fx.sitting();
  delete r.seed;
  delete r.scoringVersion;
  assert.deepEqual(errorsOf('sitting', r), ['$.seed is required', '$.scoringVersion is required']);
});

test('unknown fields are rejected, so no name or email can be stored', () => {
  assert.match(errorsOf('participant', fx.participant({ name: 'Ada' }))[0], /\$\.name is not an allowed field/);
  assert.match(errorsOf('participant', fx.participant({ email: 'a@b.c' }))[0], /\$\.email is not an allowed field/);
});

test('enums, patterns and formats are enforced', () => {
  assert.ok(errorsOf('sitting', fx.sitting({ mode: 'exam' })).some((e) => e.startsWith('$.mode must be one of')));
  assert.ok(errorsOf('sitting', fx.sitting({ startedAt: '26/11/2026' })).some((e) => e.includes('ISO 8601')));
  assert.ok(errorsOf('sitting', fx.sitting({ participantId: 'ada@example.com' })).some((e) => e.startsWith('$.participantId does not match')));
  assert.ok(errorsOf('sitting', fx.sitting({ seed: -1 })).some((e) => e.includes('at least 0')));
  assert.ok(errorsOf('sitting', fx.sitting({ seed: 1.5 })).some((e) => e.includes('must be integer')));
  assert.ok(errorsOf('taskAttempt', fx.attempt({ rawScore: NaN })).some((e) => e.includes('finite')));
});

test('item responses need itemId, rtMs and shownAt; response may be any JSON value', () => {
  const ok = (response) => fx.attempt({ itemResponses: [{ itemId: 'X1', response, rtMs: null, shownAt: '2026-11-26T09:00:00Z' }] });
  for (const v of ['text', 3, true, null, [1, 2], { a: { b: 1 } }]) assert.deepEqual(errorsOf('taskAttempt', ok(v)), [], JSON.stringify(v));
  const bad = fx.attempt({ itemResponses: [{ itemId: 'X1', response: 1 }] });
  assert.deepEqual(errorsOf('taskAttempt', bad), ['$.itemResponses[0].rtMs is required', '$.itemResponses[0].shownAt is required']);
});

test('score is a number, null, or one number (or null) per facet', () => {
  for (const score of [0.4, null, { CT1: 0.5, CT2: null }]) assert.deepEqual(errorsOf('taskAttempt', fx.attempt({ score })), []);
  assert.ok(errorsOf('taskAttempt', fx.attempt({ score: 'high' })).length);
  assert.ok(errorsOf('taskAttempt', fx.attempt({ score: { CT1: 'high' } })).length);
});

test('language background is allowed only with consent', () => {
  const lb = { englishFirstLanguage: 'no' };
  assert.deepEqual(errorsOf('participant', fx.participant({ languageBackground: lb })), ['$.languageBackground may be recorded only with consent.languageBackground true']);
  const consented = fx.participant({ languageBackground: lb });
  consented.consent.languageBackground = true;
  assert.deepEqual(errorsOf('participant', consented), []);
});

test('practice sittings use the practice pool and assessment sittings use form A or B', () => {
  const practice = (over) => fx.sitting({ mode: 'practice', formId: 'practice', windowId: null, ...over });
  assert.deepEqual(errorsOf('sitting', practice()), []);
  assert.deepEqual(errorsOf('sitting', practice({ formId: 'A' })), ['$.formId must be "practice" in practice mode']);
  assert.deepEqual(errorsOf('sitting', practice({ windowId: 'self' })), ['$.windowId practice sittings have no window and no programme']);
  assert.deepEqual(errorsOf('sitting', fx.sitting({ mode: 'assessment', formId: 'practice' })), ['$.formId must be A or B in assessment mode']);
});

test('completedAt cannot precede startedAt', () => {
  assert.deepEqual(errorsOf('sitting', fx.sitting({ completedAt: '2026-11-25T09:00:00.000Z' })), ['$.completedAt is before startedAt']);
});

test('records from another schema version are rejected until migrated', () => {
  assert.match(errorsOf('sitting', fx.sitting({ schemaVersion: 1 }))[0], /run migrations first/);
});

test('assessment sittings need a window; programme sittings record their code, window and order', () => {
  assert.deepEqual(errorsOf('sitting', fx.sitting({ windowId: null })), ['$.windowId is required in assessment mode']);
  assert.ok(errorsOf('sitting', fx.sitting({ windowId: 'later' })).some((e) => e.startsWith('$.windowId does not match')));
  const programme = { code: 'SEP26-1', window: 1, skillOrder: ['collaboration', '_example'], position: 1 };
  assert.deepEqual(errorsOf('sitting', fx.sitting({ windowId: 'programme:SEP26-1', programme })), []);
  assert.deepEqual(errorsOf('sitting', fx.sitting({ windowId: 'self', programme })), ['$.windowId must be programme:<code> for a programme sitting']);
  assert.deepEqual(errorsOf('sitting', fx.sitting({ windowId: 'programme:SEP26-1', programme: { ...programme, window: 2 } })), ['$.programme.window must match the last digit of the code']);
  assert.deepEqual(errorsOf('sitting', fx.sitting({ windowId: 'programme:SEP26-1', programme: { ...programme, position: 0 } })), ["$.programme.position must point at this sitting's skill in skillOrder"]);
  assert.deepEqual(errorsOf('sitting', fx.sitting({ windowId: 'programme:SEP26-1', programme: null })), ['$.windowId must be "self" outside a programme sitting']);
});

test('consent to use the tool must be true', () => {
  const p = fx.participant();
  p.consent.toolUse = false;
  assert.deepEqual(errorsOf('participant', p), ['$.consent.toolUse must be "true"']);
});

test('settings accept only the offered time multipliers', () => {
  assert.deepEqual(errorsOf('participant', fx.participant({ settings: { timeMultiplier: 1.5, reducedMotion: true } })), []);
  assert.ok(errorsOf('participant', fx.participant({ settings: { timeMultiplier: 3, reducedMotion: false } })).some((e) => e.startsWith('$.settings.timeMultiplier must be one of')));
});

test('in-progress attempts carry no score and no completion time; complete ones do', () => {
  const inProgress = fx.attempt({ status: 'in-progress', rawScore: null, score: null, completedAt: null, timerSnapshot: { limitMs: null, multiplier: 1, state: 'running', endAt: null, remainingMs: null, extendedMs: 0, pausedMs: 0, pausedAt: null, startedAt: 1 } });
  assert.deepEqual(errorsOf('taskAttempt', inProgress), []);
  assert.deepEqual(errorsOf('taskAttempt', fx.attempt({ status: 'in-progress', completedAt: null })), ['$.score must be null while in progress', '$.rawScore must be null while in progress']);
  assert.deepEqual(errorsOf('taskAttempt', fx.attempt({ completedAt: null })), ['$.completedAt is required when status is complete']);
  assert.deepEqual(errorsOf('taskAttempt', fx.attempt({ timerSnapshot: inProgress.timerSnapshot })), ['$.timerSnapshot is kept only while in progress']);
  assert.deepEqual(errorsOf('selfReport', fx.selfReport({ updatedAt: '2026-11-25T09:00:00.000Z' })), ['$.updatedAt is before startedAt']);
});

test('unknown type and assertValid', () => {
  assert.equal(validate('nope', {}).valid, false);
  assert.throws(() => assertValid('sitting', {}), TypeError);
  assert.equal(assertValid('sitting', fx.sitting()).id, 'S-0123456789ABCDEF');
});

test('docs/data-schema.json is current (regenerate with npm run schema)', () => {
  const onDisk = JSON.parse(readFileSync(new URL('../docs/data-schema.json', import.meta.url), 'utf8'));
  assert.deepEqual(onDisk, toJsonSchema());
});

test('JSON Schema lists required fields and forbids extras', () => {
  const s = toJsonSchema();
  assert.deepEqual(s.$defs.participant.required, ['type', 'schemaVersion', 'id', 'createdAt', 'consent']);
  assert.equal(s.$defs.participant.additionalProperties, false);
  assert.deepEqual(s.$defs.sitting.properties.mode.enum, ['practice', 'assessment']);
  assert.ok(!s.$defs.taskAttempt.required.includes('timing'));
});
