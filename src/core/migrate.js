// Versioned migrations for stored and exported data.
//
// Data moves between schema versions as a bundle: { schemaVersion, records: { <type>: [...] } },
// the same shape exportAll() produces (store.js). A migration takes a bundle at version `from`
// and returns a new bundle at `from + 1`. Migrations never mutate their input and never drop raw
// responses, so scores can always be recomputed (audit D-6).
//
// Adding schema version N + 1:
//   1. Bump SCHEMA_VERSION in version.js (this also moves the storage prefix to skills5c:v<N+1>:).
//   2. Append { from: N, to: N + 1, describe, migrate } to MIGRATIONS below.
//   3. Add a test with a real version-N bundle in tests/migrate.test.mjs.
//   4. Document the change in docs/DATA-SCHEMA.md (Migrations) and docs/CHANGELOG.md.
//
// On start-up the local adapter calls migrateStoredNamespaces() to bring older namespaces forward.

import { SCHEMA_VERSION } from './version.js';

/**
 * @typedef {object} Bundle
 * @property {number} schemaVersion
 * @property {Object<string, object[]>} records
 */

/**
 * @typedef {object} Migration
 * @property {number} from
 * @property {number} to
 * @property {string} describe
 * @property {(bundle: Bundle) => Bundle} migrate
 */

/**
 * The real migration chain. Version 1 is the first schema, so the chain is empty.
 * @type {Migration[]}
 */
export const MIGRATIONS = [];

/**
 * Bring a bundle up to `target` by applying migrations in order.
 * @param {Bundle} bundle
 * @param {{ migrations?: Migration[], target?: number }} [options]
 * @returns {{ bundle: Bundle, applied: string[] }}
 */
export function migrate(bundle, { migrations = MIGRATIONS, target = SCHEMA_VERSION } = {}) {
  if (!bundle || typeof bundle !== 'object' || !Number.isInteger(bundle.schemaVersion)) {
    throw new TypeError('migrate: bundle must have an integer schemaVersion');
  }
  if (bundle.schemaVersion > target) {
    throw new RangeError(`migrate: data is schema version ${bundle.schemaVersion}, newer than this build (${target}). Update the tool before importing it.`);
  }
  let current = structuredClone(bundle);
  const applied = [];
  while (current.schemaVersion < target) {
    const step = migrations.find((m) => m.from === current.schemaVersion);
    if (!step) throw new RangeError(`migrate: no migration from schema version ${current.schemaVersion}`);
    if (step.to !== step.from + 1) throw new RangeError(`migrate: migration ${step.from} to ${step.to} must advance by one version`);
    const next = step.migrate(structuredClone(current));
    if (!next || next.schemaVersion !== step.to) {
      throw new Error(`migrate: migration ${step.from} to ${step.to} did not set schemaVersion ${step.to}`);
    }
    for (const list of Object.values(next.records || {})) {
      for (const r of list) r.schemaVersion = step.to;
    }
    applied.push(`${step.from}->${step.to}: ${step.describe}`);
    current = next;
  }
  return { bundle: current, applied };
}
