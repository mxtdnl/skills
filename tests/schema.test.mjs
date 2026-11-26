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
  assert.deepEqual(errorsOf('sitting', fx.sitting({ mode: 'practice', formId: 'practice' })), []);
  assert.deepEqual(errorsOf('sitting', fx.sitting({ mode: 'practice', formId: 'A' })), ['$.formId must be "practice" in practice mode']);
  assert.deepEqual(errorsOf('sitting', fx.sitting({ mode: 'assessment', formId: 'practice' })), ['$.formId must be A or B in assessment mode']);
});

test('completedAt cannot precede startedAt', () => {
  assert.deepEqual(errorsOf('sitting', fx.sitting({ completedAt: '2026-11-25T09:00:00.000Z' })), ['$.completedAt is before startedAt']);
});

test('records from another schema version are rejected until migrated', () => {
  assert.match(errorsOf('sitting', fx.sitting({ schemaVersion: 2 }))[0], /run migrations first/);
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
