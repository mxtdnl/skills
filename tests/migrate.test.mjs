import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrate, MIGRATIONS } from '../src/core/migrate.js';
import { SCHEMA_VERSION } from '../src/core/version.js';

// Test-only chain 1 -> 2 -> 3. The real chain (MIGRATIONS) is empty while version 1 is current.
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
