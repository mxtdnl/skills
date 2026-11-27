import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrate, MIGRATIONS } from '../src/core/migrate.js';
import { SCHEMA_VERSION } from '../src/core/version.js';
import { validate } from '../src/core/schema.js';

// Test-only chain 1 -> 2 -> 3, separate from the real chain (MIGRATIONS).
const chain = [
  {
    from: 1, to: 2, describe: 'rename sitting.form to formId',
    migrate: (b) => ({ ...b, schemaVersion: 2, records: { ...b.records, sitting: b.records.sitting.map(({ form, ...r }) => ({ ...r, formId: form })) } }),
  },
  {
    from: 2, to: 3, describe: 'add sitting.locale',
    migrate: (b) => ({ ...b, schemaVersion: 3, records: { ...b.records, sitting: b.records.sitting.map((r) => ({ ...r, locale: 'en-GB' })) } }),
  },
];

const v1 = () => ({ schemaVersion: 1, records: { sitting: [{ id: 'S-1', schemaVersion: 1, form: 'A', raw: [1, 2, 3] }] } });

test('applies migrations in order up to the target', () => {
  const { bundle, applied } = migrate(v1(), { migrations: chain, target: 3 });
  assert.equal(bundle.schemaVersion, 3);
  assert.deepEqual(bundle.records.sitting[0], { id: 'S-1', schemaVersion: 3, formId: 'A', raw: [1, 2, 3], locale: 'en-GB' });
  assert.deepEqual(applied, ['1->2: rename sitting.form to formId', '2->3: add sitting.locale']);
});

test('stops at an intermediate target', () => {
  const { bundle } = migrate(v1(), { migrations: chain, target: 2 });
  assert.equal(bundle.schemaVersion, 2);
  assert.equal(bundle.records.sitting[0].formId, 'A');
  assert.equal(bundle.records.sitting[0].locale, undefined);
});

test('does not mutate its input', () => {
  const input = v1();
  const before = JSON.stringify(input);
  migrate(input, { migrations: chain, target: 3 });
  assert.equal(JSON.stringify(input), before);
});

test('a bundle at the target is returned unchanged', () => {
  const b = { schemaVersion: 3, records: { sitting: [] } };
  assert.deepEqual(migrate(b, { migrations: chain, target: 3 }), { bundle: b, applied: [] });
});

test('refuses data newer than the build, gaps in the chain and bad steps', () => {
  assert.throws(() => migrate({ schemaVersion: 4, records: {} }, { migrations: chain, target: 3 }), /newer than this build/);
  assert.throws(() => migrate(v1(), { migrations: [chain[1]], target: 3 }), /no migration from schema version 1/);
  assert.throws(() => migrate(v1(), { migrations: [{ from: 1, to: 3, describe: 'skip', migrate: (b) => b }], target: 3 }), /advance by one version/);
  assert.throws(() => migrate(v1(), { migrations: [{ from: 1, to: 2, describe: 'forgot', migrate: (b) => b }], target: 2 }), /did not set schemaVersion 2/);
  assert.throws(() => migrate({}, { migrations: chain }), /integer schemaVersion/);
});

test('the real chain reaches the current schema version from every earlier version', () => {
  for (let v = 1; v < SCHEMA_VERSION; v++) {
    assert.equal(migrate({ schemaVersion: v, records: {} }).bundle.schemaVersion, SCHEMA_VERSION);
  }
  assert.equal(MIGRATIONS.length, SCHEMA_VERSION - 1);
});

// A bundle exactly as the S3 developer harness (schema version 1) stored it.
const realV1 = () => ({
  schemaVersion: 1,
  records: {
    participant: [{ type: 'participant', schemaVersion: 1, id: 'P-0000-00000', createdAt: '2026-11-26T09:00:00.000Z', consent: { noticeVersion: 'dev-harness', givenAt: '2026-11-26T09:00:00.000Z', programmeEvaluation: false, languageBackground: false } }],
    sitting: [
      { type: 'sitting', schemaVersion: 1, id: 'S-0123456789ABCDEF', participantId: 'P-0000-00000', mode: 'assessment', formId: 'B', seed: 7, appVersion: '0.2.0', scoringVersion: '0.2.0', startedAt: '2026-11-26T09:00:00.000Z', completedAt: null },
      { type: 'sitting', schemaVersion: 1, id: 'S-1111111111111111', participantId: 'P-0000-00000', mode: 'practice', formId: 'practice', seed: 8, appVersion: '0.2.0', scoringVersion: '0.2.0', startedAt: '2026-11-26T10:00:00.000Z', completedAt: null },
    ],
    taskAttempt: [{ type: 'taskAttempt', schemaVersion: 1, id: 'A-0123456789ABCDEF', sittingId: 'S-0123456789ABCDEF', skillId: '_example', taskId: 'pick', itemResponses: [{ itemId: 'EX-PICK-B01', response: { choice: 2, position: 0 }, rtMs: 900, shownAt: '2026-11-26T09:00:05.000Z' }], rawScore: 1, score: { EX1: 0.5 }, scoringVersion: '0.2.0' }],
    selfReport: [],
  },
});

test('the real 1 -> 2 migration produces valid version 2 records and keeps every raw response', () => {
  const { bundle, applied } = migrate(realV1(), { target: 2 });
  assert.equal(applied.length, 1);
  for (const [type, list] of Object.entries(bundle.records)) {
    for (const r of list) assert.deepEqual(validate(type, r).errors, [], `${type} ${r.id}`);
  }
  const [assessment, practice] = bundle.records.sitting;
  assert.equal(assessment.skillId, '_example');
  assert.equal(assessment.windowId, 'self');
  assert.equal(practice.skillId, '_unknown', 'a sitting with no attempts has no known skill');
  assert.equal(practice.windowId, null);
  assert.equal(bundle.records.participant[0].consent.toolUse, true);
  const a = bundle.records.taskAttempt[0];
  assert.equal(a.status, 'complete');
  assert.equal(a.startedAt, '2026-11-26T09:00:05.000Z');
  assert.deepEqual(a.itemResponses, realV1().records.taskAttempt[0].itemResponses);
});
