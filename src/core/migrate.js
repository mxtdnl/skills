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

const EPOCH = '1970-01-01T00:00:00.000Z';

/**
 * Version 1 to 2 (S5): consent.toolUse; sitting.skillId, windowId and programme; status and
 * timestamps on task attempts and self-reports. Version 1 data could be made only by the S3
 * developer harness, so the defaults below describe what that harness did:
 *   - consent.toolUse is true: a v1 participant record existed only once the tool was in use;
 *   - sitting.skillId is taken from the sitting's attempts or self-reports, or "_unknown";
 *   - sitting.windowId is "self" for assessment sittings and null for practice; programme null;
 *   - v1 attempts and self-reports were saved only on completion, so status is "complete";
 *     startedAt and completedAt are the first item's shownAt (else the sitting's startedAt,
 *     else the Unix epoch, marking an unknown time), and updatedAt equals completedAt.
 * @param {Bundle} b
 * @returns {Bundle}
 */
function v1to2(b) {
  const r = b.records || {};
  const sittings = r.sitting || [];
  const attempts = r.taskAttempt || [];
  const selfReports = r.selfReport || [];
  const skillOf = new Map();
  for (const a of [...attempts, ...selfReports]) if (a && !skillOf.has(a.sittingId)) skillOf.set(a.sittingId, a.skillId);
  const sittingStart = new Map(sittings.map((s) => [s.id, s.startedAt]));
  const progress = (rec, responses) => {
    const first = (responses || []).map((x) => x && x.shownAt).filter(Boolean).sort()[0];
    const t = first || sittingStart.get(rec.sittingId) || EPOCH;
    return { ...rec, status: 'complete', startedAt: t, updatedAt: t, completedAt: t };
  };
  const records = { ...r };
  if (r.participant) records.participant = r.participant.map((p) => ({ ...p, consent: { ...p.consent, toolUse: true } }));
  if (r.sitting) {
    records.sitting = sittings.map((s) => ({
      ...s,
      skillId: skillOf.get(s.id) || '_unknown',
      windowId: s.mode === 'assessment' ? 'self' : null,
      programme: null,
    }));
  }
  if (r.taskAttempt) records.taskAttempt = attempts.map((a) => progress(a, a.itemResponses));
  if (r.selfReport) records.selfReport = selfReports.map((a) => progress(a, a.responses));
  return { ...b, schemaVersion: 2, records };
}

/**
 * The real migration chain.
 * @type {Migration[]}
 */
export const MIGRATIONS = [
  { from: 1, to: 2, describe: 'consent.toolUse; sitting skillId, windowId, programme; attempt status and timestamps', migrate: v1to2 },
];

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
