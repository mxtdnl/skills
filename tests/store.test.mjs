import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryAdapter, LocalStorageAdapter, MemoryStorage, NOT_SAVED_NOTICE, keyPrefix, migrateStoredNamespaces } from '../src/core/store.js';
import * as fx from './fixtures.mjs';
import { SCHEMA_VERSION } from '../src/core/version.js';

const adapters = {
  MemoryAdapter: () => new MemoryAdapter(),
  LocalStorageAdapter: () => new LocalStorageAdapter({ storage: new MemoryStorage() }),
};

for (const [name, make] of Object.entries(adapters)) {
  test(`${name}: save, load, list, remove`, async () => {
    const s = make();
    await s.save('sitting', fx.sitting());
    await s.save('sitting', fx.sitting({ id: 'S-1111111111111111' }));
    assert.deepEqual(await s.load('sitting', 'S-0123456789ABCDEF'), fx.sitting());
    assert.equal(await s.load('sitting', 'S-ZZZZZZZZZZZZZZZZ'), null);
    assert.deepEqual((await s.list('sitting')).map((r) => r.id), ['S-0123456789ABCDEF', 'S-1111111111111111']);
    assert.deepEqual(await s.list('taskAttempt'), []);
    assert.equal(await s.remove('sitting', 'S-1111111111111111'), true);
    assert.equal(await s.remove('sitting', 'S-1111111111111111'), false);
    assert.equal((await s.list('sitting')).length, 1);
  });

  test(`${name}: invalid records and unknown types are refused`, async () => {
    const s = make();
    await assert.rejects(s.save('sitting', { ...fx.sitting(), mode: 'exam' }), /Invalid sitting/);
    await assert.rejects(s.save('person', {}), /Unknown record type/);
    assert.deepEqual(await s.list('sitting'), []);
  });

  test(`${name}: exportAll and importAll round-trip`, async () => {
    const a = make();
    await a.save('participant', fx.participant());
    await a.save('sitting', fx.sitting());
    await a.save('taskAttempt', fx.attempt());
    await a.save('selfReport', fx.selfReport());
    const bundle = await a.exportAll();
    assert.equal(bundle.format, 'skills5c-export');
    assert.equal(bundle.schemaVersion, SCHEMA_VERSION);
    assert.match(bundle.exportedAt, /^\d{4}-/);
    const b = make();
    const result = await b.importAll(JSON.parse(JSON.stringify(bundle)));
    assert.deepEqual(result, { imported: 4, rejected: [], migrations: [] });
    assert.deepEqual((await b.exportAll()).records, bundle.records);
  });

  test(`${name}: importAll rejects invalid records and keeps the valid ones`, async () => {
    const s = make();
    const bundle = { format: 'skills5c-export', schemaVersion: SCHEMA_VERSION, records: { sitting: [fx.sitting(), { ...fx.sitting({ id: 'S-1111111111111111' }), seed: 'x' }], spam: [{}] } };
    const r = await s.importAll(bundle);
    assert.equal(r.imported, 1);
    assert.equal(r.rejected.length, 2);
    assert.deepEqual(r.rejected.map((x) => x.type).sort(), ['sitting', 'spam']);
    await assert.rejects(s.importAll({ hello: 1 }), /not a skills5c-export file/);
    await assert.rejects(s.importAll({ format: 'skills5c-export', schemaVersion: 99, records: {} }), /newer than this build/);
  });

  test(`${name}: clear removes every record in the namespace and nothing else`, async () => {
    const s = make();
    await s.save('participant', fx.participant());
    await s.save('sitting', fx.sitting());
    assert.equal(await s.clear(), 2);
    assert.deepEqual(await s.list('participant'), []);
    assert.deepEqual(await s.list('sitting'), []);
  });

  test(`${name}: importAll replace mode clears existing records`, async () => {
    const s = make();
    await s.save('sitting', fx.sitting({ id: 'S-1111111111111111' }));
    await s.importAll({ format: 'skills5c-export', schemaVersion: SCHEMA_VERSION, records: { sitting: [fx.sitting()] } }, { mode: 'replace' });
    assert.deepEqual((await s.list('sitting')).map((r) => r.id), ['S-0123456789ABCDEF']);
  });
}

test('LocalStorageAdapter namespaces keys as skills5c:v<SCHEMA_VERSION>:<type>:<id>', async () => {
  const storage = new MemoryStorage();
  storage.setItem('other-app', 'x');
  const s = new LocalStorageAdapter({ storage });
  await s.save('sitting', fx.sitting());
  assert.equal(keyPrefix(), `skills5c:v${SCHEMA_VERSION}:`);
  assert.ok(storage.getItem(`skills5c:v${SCHEMA_VERSION}:sitting:S-0123456789ABCDEF`));
  assert.equal(s.persistent, true);
  assert.equal(s.notice, null);
  assert.equal(storage.getItem('other-app'), 'x', 'other keys are left alone');
  assert.equal((await s.exportAll()).records.sitting.length, 1);
});

test('LocalStorageAdapter persists across instances (reload)', async () => {
  const storage = new MemoryStorage();
  await new LocalStorageAdapter({ storage }).save('taskAttempt', fx.attempt());
  assert.deepEqual(await new LocalStorageAdapter({ storage }).load('taskAttempt', fx.attempt().id), fx.attempt());
});

test('LocalStorageAdapter falls back to memory when storage is missing or throws', async () => {
  const throwing = { get length() { throw new Error('SecurityError'); }, key() { throw new Error('x'); }, getItem() { throw new Error('x'); }, setItem() { throw new Error('SecurityError'); }, removeItem() { throw new Error('x'); } };
  for (const storage of [null, throwing]) {
    const s = new LocalStorageAdapter({ storage });
    assert.equal(s.persistent, false);
    assert.equal(s.notice, NOT_SAVED_NOTICE);
    assert.match(s.notice, /progress will not be saved/);
    await s.save('sitting', fx.sitting());
    assert.equal((await s.list('sitting')).length, 1, 'still works in memory');
  }
});

test('LocalStorageAdapter switches to memory when a write fails later (quota) and keeps earlier data', async () => {
  const storage = new MemoryStorage();
  const s = new LocalStorageAdapter({ storage });
  await s.save('sitting', fx.sitting());
  let notified = null;
  s.onStatusChange((st) => { notified = st; });
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  await s.save('taskAttempt', fx.attempt());
  assert.equal(s.persistent, false);
  assert.deepEqual(notified, { persistent: false, notice: NOT_SAVED_NOTICE });
  assert.equal((await s.list('sitting')).length, 1, 'earlier data copied into memory');
  assert.equal((await s.list('taskAttempt')).length, 1, 'failed write retried in memory');
});

test('LocalStorageAdapter clear leaves keys outside the namespace alone', async () => {
  const storage = new MemoryStorage();
  storage.setItem('other-app', 'x');
  storage.setItem('skills5c:v1:sitting:S-0123456789ABCDEF', 'old namespace left for migration');
  const s = new LocalStorageAdapter({ storage, migrations: [] });
  await s.save('sitting', fx.sitting({ id: 'S-1111111111111111' }));
  assert.equal(await s.clear(), 1);
  assert.equal(storage.getItem('other-app'), 'x');
});

test('a corrupt stored entry reads as missing rather than crashing', async () => {
  const storage = new MemoryStorage();
  storage.setItem(`skills5c:v${SCHEMA_VERSION}:sitting:S-0123456789ABCDEF`, '{not json');
  const s = new LocalStorageAdapter({ storage });
  assert.equal(await s.load('sitting', 'S-0123456789ABCDEF'), null);
  assert.deepEqual(await s.list('sitting'), []);
});

test('MemoryAdapter is not persistent and shows no notice (tests only)', () => {
  const s = new MemoryAdapter();
  assert.equal(s.persistent, false);
  assert.equal(s.notice, null);
});

test('migrateStoredNamespaces moves an older namespace forward and removes the old keys', () => {
  const storage = new MemoryStorage();
  // A hypothetical version-1 record being moved to version 2 by a test-only migration.
  storage.setItem('skills5c:v1:sitting:S-0123456789ABCDEF', JSON.stringify(fx.sitting()));
  const migrations = [{ from: 1, to: 2, describe: 'add note', migrate: (b) => ({ ...b, schemaVersion: 2, records: { sitting: b.records.sitting.map((r) => ({ ...r, note: '' })) } }) }];
  const log = migrateStoredNamespaces(storage, migrations, 2);
  assert.equal(storage.getItem('skills5c:v1:sitting:S-0123456789ABCDEF'), null);
  const moved = JSON.parse(storage.getItem('skills5c:v2:sitting:S-0123456789ABCDEF'));
  assert.equal(moved.schemaVersion, 2);
  assert.equal(moved.note, '');
  assert.match(log[0], /v1: 1 record\(s\) migrated to v2/);
});

test('migrateStoredNamespaces leaves data alone when a migration is missing', () => {
  const storage = new MemoryStorage();
  storage.setItem('skills5c:v1:sitting:S-0123456789ABCDEF', JSON.stringify(fx.sitting()));
  assert.throws(() => migrateStoredNamespaces(storage, [], 2), /no migration from schema version 1/);
  assert.ok(storage.getItem('skills5c:v1:sitting:S-0123456789ABCDEF'));
});
