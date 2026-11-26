// Storage adapters.
//
// Interface (every method returns a Promise, so that a server or LMS adapter can implement the
// same contract later; audit section 4):
//
//   load(type, id)            -> record | null
//   save(type, record)        -> record           validates first; throws on an invalid record
//   list(type)                -> record[]          sorted by id
//   remove(type, id)          -> boolean           true if something was removed
//   exportAll()               -> ExportBundle
//   importAll(bundle, opts)   -> ImportResult      migrates, validates, then writes
//
// plus two properties:
//   persistent  boolean; false when data lives only in memory and is lost on reload
//   notice      string | null; the text to show when persistent is false
//
// LocalStorageAdapter keeps records under skills5c:v<SCHEMA_VERSION>:<type>:<id>. Every access
// to localStorage is wrapped in try/catch (CLAUDE.md, Technical conventions 7). If storage is
// unavailable at start-up, or a write fails later (for example, the quota is full), the adapter
// switches to memory, keeps working and sets `notice`. MemoryAdapter is for tests.

import { SCHEMA_VERSION, APP_VERSION } from './version.js';
import { RECORD_TYPES, validate, assertValid } from './schema.js';
import { migrate, MIGRATIONS } from './migrate.js';

export const KEY_ROOT = 'skills5c';
export const keyPrefix = (version = SCHEMA_VERSION) => `${KEY_ROOT}:v${version}:`;
export const NOT_SAVED_NOTICE = 'Your browser is not letting this tool save data, so your progress will not be saved. If you close or reload this page, your answers will be lost.';
export const EXPORT_FORMAT = 'skills5c-export';

/**
 * @typedef {object} ExportBundle
 * @property {'skills5c-export'} format
 * @property {number} schemaVersion
 * @property {string} appVersion
 * @property {string} exportedAt
 * @property {Object<string, object[]>} records  keyed by record type
 */

/**
 * @typedef {object} ImportResult
 * @property {number} imported
 * @property {{ type: string, id: unknown, errors: { path: string, message: string }[] }[]} rejected
 * @property {string[]} migrations  descriptions of migrations applied
 */

function checkType(type) {
  if (!RECORD_TYPES.includes(type)) throw new TypeError(`Unknown record type "${type}"`);
}

/** A Map with the subset of the Web Storage API the adapters use. */
export class MemoryStorage {
  constructor() { this.map = new Map(); }
  get length() { return this.map.size; }
  key(i) { return [...this.map.keys()][i] ?? null; }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.map.set(k, String(v)); }
  removeItem(k) { this.map.delete(k); }
}

// Shared implementation over any Web Storage-like object.
class KeyValueAdapter {
  /** @param {Storage | MemoryStorage} storage */
  constructor(storage, { persistent }) {
    this.storage = storage;
    this.persistent = persistent;
    this.notice = persistent ? null : NOT_SAVED_NOTICE;
    this.prefix = keyPrefix();
    this.listeners = new Set();
  }

  /** Register a callback for changes to `persistent` / `notice`. Returns an unsubscribe function. */
  onStatusChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  key(type, id) { return `${this.prefix}${type}:${id}`; }

  keys() {
    const out = [];
    for (let i = 0; i < this.storage.length; i++) {
      const k = this.storage.key(i);
      if (k && k.startsWith(this.prefix)) out.push(k);
    }
    return out.sort();
  }

  read(k) {
    const raw = this.storage.getItem(k);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null; // a corrupt entry is treated as missing rather than crashing the tool
    }
  }

  write(k, value) { this.storage.setItem(k, JSON.stringify(value)); }

  async load(type, id) {
    checkType(type);
    return this.read(this.key(type, id));
  }

  async save(type, record) {
    checkType(type);
    assertValid(type, record);
    this.write(this.key(type, record.id), record);
    return record;
  }

  async list(type) {
    checkType(type);
    const p = `${this.prefix}${type}:`;
    return this.keys().filter((k) => k.startsWith(p)).map((k) => this.read(k)).filter(Boolean);
  }

  async remove(type, id) {
    checkType(type);
    const k = this.key(type, id);
    const had = this.storage.getItem(k) !== null;
    this.storage.removeItem(k);
    return had;
  }

  async exportAll() {
    const records = {};
    for (const t of RECORD_TYPES) records[t] = await this.list(t);
    return { format: EXPORT_FORMAT, schemaVersion: SCHEMA_VERSION, appVersion: APP_VERSION, exportedAt: new Date().toISOString(), records };
  }

  /**
   * @param {ExportBundle} bundle
   * @param {{ mode?: 'merge' | 'replace', migrations?: import('./migrate.js').Migration[] }} [options]
   *   merge (default) overwrites records with the same type and id and keeps the rest;
   *   replace removes every existing record first.
   * @returns {Promise<ImportResult>}
   */
  async importAll(bundle, { mode = 'merge', migrations = MIGRATIONS } = {}) {
    if (!bundle || bundle.format !== EXPORT_FORMAT) throw new TypeError(`importAll: not a ${EXPORT_FORMAT} file`);
    const { bundle: current, applied } = migrate(bundle, { migrations });
    const accepted = [];
    const rejected = [];
    for (const [type, list] of Object.entries(current.records || {})) {
      if (!RECORD_TYPES.includes(type)) {
        rejected.push({ type, id: null, errors: [{ path: '$', message: `unknown record type "${type}"` }] });
        continue;
      }
      for (const r of list) {
        const { valid, errors } = validate(type, r);
        if (valid) accepted.push([type, r]);
        else rejected.push({ type, id: r?.id, errors });
      }
    }
    // Validate everything before writing anything.
    if (mode === 'replace') for (const k of this.keys()) this.storage.removeItem(k);
    for (const [type, r] of accepted) this.write(this.key(type, r.id), r);
    return { imported: accepted.length, rejected, migrations: applied };
  }
}

/** In-memory adapter. Nothing survives a reload; `persistent` is false but no notice is set. */
export class MemoryAdapter extends KeyValueAdapter {
  constructor() {
    super(new MemoryStorage(), { persistent: false });
    this.notice = null;
  }
}

function probe(storage) {
  const k = `${KEY_ROOT}:probe`;
  storage.setItem(k, '1');
  const ok = storage.getItem(k) === '1';
  storage.removeItem(k);
  return ok;
}

/**
 * localStorage adapter with an in-memory fallback.
 *
 * @param {{ storage?: Storage | null, migrations?: import('./migrate.js').Migration[] }} [options]
 *   storage defaults to globalThis.localStorage; pass one explicitly in tests.
 */
export class LocalStorageAdapter extends KeyValueAdapter {
  constructor({ storage, migrations = MIGRATIONS } = {}) {
    let backing = null;
    try {
      // Reading window.localStorage itself throws in some browsers when storage is blocked.
      const s = storage === undefined ? globalThis.localStorage : storage;
      if (s && probe(s)) backing = s;
    } catch {
      backing = null;
    }
    super(backing || new MemoryStorage(), { persistent: Boolean(backing) });
    this.migrationLog = [];
    if (backing) {
      try {
        this.migrationLog = migrateStoredNamespaces(backing, migrations);
      } catch (e) {
        // Leave older data untouched; it can still be recovered by a later build.
        this.migrationLog = [`migration failed: ${e.message}`];
      }
    }
    for (const m of ['load', 'list', 'remove', 'save', 'importAll']) {
      const inner = this[m].bind(this);
      this[m] = (...args) => this.guard(inner, args);
    }
  }

  // Run an operation; if localStorage throws, copy what is readable into memory, switch to the
  // memory fallback, set the notice and retry once. Validation errors are not storage errors.
  async guard(fn, args) {
    try {
      return await fn(...args);
    } catch (e) {
      if (!this.persistent || e instanceof TypeError || e instanceof RangeError) throw e;
      this.fallBackToMemory();
      return fn(...args);
    }
  }

  fallBackToMemory() {
    const mem = new MemoryStorage();
    try {
      for (const k of this.keys()) {
        const v = this.storage.getItem(k);
        if (v !== null) mem.setItem(k, v);
      }
    } catch {
      // nothing more can be recovered
    }
    this.storage = mem;
    this.persistent = false;
    this.notice = NOT_SAVED_NOTICE;
    for (const cb of this.listeners) {
      try { cb({ persistent: false, notice: this.notice }); } catch { /* listener errors are ignored */ }
    }
  }
}

/**
 * Move records from older namespaces (skills5c:v<N>: with N < SCHEMA_VERSION) into the current
 * one. Each older namespace is read into a bundle, migrated and written; its keys are removed
 * only after every record has been written. Returns a log of what was done.
 * @param {Storage | MemoryStorage} storage
 * @param {import('./migrate.js').Migration[]} [migrations]
 * @param {number} [target]
 * @returns {string[]}
 */
export function migrateStoredNamespaces(storage, migrations = MIGRATIONS, target = SCHEMA_VERSION) {
  const byVersion = new Map();
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    const m = k && /^skills5c:v(\d+):([A-Za-z]+):(.+)$/.exec(k);
    if (!m) continue;
    const v = Number(m[1]);
    if (v >= target) continue;
    if (!byVersion.has(v)) byVersion.set(v, []);
    byVersion.get(v).push([k, m[2]]);
  }
  const log = [];
  for (const v of [...byVersion.keys()].sort((a, b) => a - b)) {
    const entries = byVersion.get(v);
    const records = {};
    for (const [k, type] of entries) {
      try {
        const r = JSON.parse(storage.getItem(k));
        (records[type] ||= []).push(r);
      } catch {
        log.push(`skipped unreadable entry ${k}`);
      }
    }
    const { bundle, applied } = migrate({ schemaVersion: v, records }, { migrations, target });
    const p = keyPrefix(target);
    for (const [type, list] of Object.entries(bundle.records)) {
      for (const r of list) storage.setItem(`${p}${type}:${r.id}`, JSON.stringify(r));
    }
    for (const [k] of entries) storage.removeItem(k);
    log.push(`v${v}: ${entries.length} record(s) migrated to v${target}`, ...applied);
  }
  return log;
}

/**
 * Show the adapter's notice inside `container` while storage is not persistent, and keep it
 * current. Uses textContent only (audit K-5). Returns an unmount function.
 * @param {{ notice: string | null, onStatusChange?: Function }} adapter
 * @param {HTMLElement} container
 */
export function mountStorageNotice(adapter, container) {
  const doc = container.ownerDocument;
  const el = doc.createElement('div');
  el.className = 'notice storage-notice';
  el.setAttribute('role', 'status');
  const render = () => {
    el.textContent = adapter.notice || '';
    el.hidden = !adapter.notice;
  };
  render();
  container.prepend(el);
  const off = adapter.onStatusChange ? adapter.onStatusChange(render) : () => {};
  return () => { off(); el.remove(); };
}
