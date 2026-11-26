// Skill registry: the only place that lists skill modules. The hub, results and export code read
// manifests from here; nothing else hard-codes the list of skills (audit section 4).
//
// The skill module contract is specified in docs/ARCHITECTURE.md. validateManifest() enforces the
// parts of it that can be checked without running a task.

/** Production skill modules, in canonical order (CLAUDE.md, 5C accent mapping). Added in S6 to S10. */
export const SKILL_MODULES = [];

/** Developer-only modules. Never listed in the student-facing hub. */
export const EXAMPLE_MODULES = ['./_example/index.js'];

const SLUG = /^[a-z0-9_][a-z0-9_-]*$/;
const FACET = /^[A-Z]{2}[0-9]+$/;
const TOKEN = /^--[a-z0-9-]+$/;

/**
 * Check a manifest against the contract. Returns a list of problems; empty means valid.
 * @param {any} m
 * @returns {string[]}
 */
export function validateManifest(m) {
  const errs = [];
  const at = (p, msg) => errs.push(`${p}: ${msg}`);
  if (!m || typeof m !== 'object') return ['manifest: must be an object'];
  const id = typeof m.id === 'string' ? m.id : '(no id)';
  if (typeof m.id !== 'string' || !SLUG.test(m.id)) at(id, 'id must be a lower-case slug');
  if (typeof m.label !== 'string' || !m.label.trim()) at(id, 'label is required');
  if (typeof m.accentToken !== 'string' || !TOKEN.test(m.accentToken)) at(id, 'accentToken must be a CSS custom property name such as --skill-critical');
  if (!Array.isArray(m.facets) || m.facets.length === 0) at(id, 'facets must be a non-empty array');
  else {
    const codes = new Set();
    m.facets.forEach((f, i) => {
      if (!f || !FACET.test(f.code)) at(`${id}.facets[${i}]`, 'code must look like CT1');
      else if (codes.has(f.code)) at(`${id}.facets[${i}]`, `duplicate code ${f.code}`);
      else codes.add(f.code);
      if (!f || typeof f.label !== 'string' || !f.label.trim()) at(`${id}.facets[${i}]`, 'label is required');
    });
  }
  const facetCodes = new Set((m.facets || []).map((f) => f && f.code));
  if (m.selfReport !== null) {
    const sr = m.selfReport;
    if (!sr || typeof sr !== 'object') at(id, 'selfReport must be an object or null');
    else {
      if (typeof sr.loadContent !== 'function') at(`${id}.selfReport`, 'loadContent() is required');
      if (typeof sr.score !== 'function') at(`${id}.selfReport`, 'score() is required');
      if (!(sr.estMinutes > 0)) at(`${id}.selfReport`, 'estMinutes must be positive');
    }
  }
  if (!Array.isArray(m.tasks) || m.tasks.length === 0) at(id, 'tasks must be a non-empty array');
  else {
    const ids = new Set();
    m.tasks.forEach((t, i) => {
      const p = `${id}.tasks[${i}]`;
      if (!t || typeof t !== 'object') return at(p, 'must be an object');
      if (typeof t.id !== 'string' || !SLUG.test(t.id)) at(p, 'id must be a lower-case slug');
      else if (ids.has(t.id)) at(p, `duplicate task id ${t.id}`);
      else ids.add(t.id);
      if (typeof t.label !== 'string' || !t.label.trim()) at(p, 'label is required');
      if (typeof t.type !== 'string' || !SLUG.test(t.type)) at(p, 'type must be a slug');
      if (!(t.estMinutes > 0)) at(p, 'estMinutes must be positive');
      if (typeof t.mount !== 'function') at(p, 'mount(el, ctx) is required');
      if (typeof t.score !== 'function') at(p, 'score(attempt, form) is required');
      if (typeof t.loadContent !== 'function') at(p, 'loadContent() is required');
      if (!Array.isArray(t.facets) || t.facets.length === 0) at(p, 'facets must list the facet codes the task measures');
      else t.facets.forEach((c) => { if (!facetCodes.has(c)) at(p, `facet ${c} is not declared by the skill`); });
    });
  }
  return errs;
}

/**
 * Check a content module: { formA, formB, practice }, each an array of items with a unique id
 * and status 'draft' or 'reviewed'. Practice and assessment pools never share an item (global
 * rule); forms A and B never share an item either (parallel forms, audit D-2).
 * @param {any} content
 * @returns {string[]}
 */
export function validateContent(content) {
  const errs = [];
  if (!content || typeof content !== 'object') return ['content: must be an object'];
  const seen = new Map();
  for (const pool of ['formA', 'formB', 'practice']) {
    const list = content[pool];
    if (!Array.isArray(list)) { errs.push(`${pool}: must be an array`); continue; }
    list.forEach((item, i) => {
      const p = `${pool}[${i}]`;
      if (!item || typeof item.id !== 'string' || !/^[A-Za-z0-9_.-]+$/.test(item.id)) return errs.push(`${p}: id is required`);
      if (item.status !== 'draft' && item.status !== 'reviewed') errs.push(`${p} ${item.id}: status must be "draft" or "reviewed"`);
      if (seen.has(item.id)) errs.push(`${p} ${item.id}: id also used in ${seen.get(item.id)}`);
      else seen.set(item.id, pool);
    });
  }
  return errs;
}

/**
 * @typedef {object} Registry
 * @property {() => object[]} list
 * @property {(id: string) => object | undefined} get
 * @property {(skillId: string, taskId: string) => object | undefined} getTask
 */

/**
 * Build a registry from manifests. Throws if any manifest is invalid, if two skills share an id,
 * or if two skills share an accent (each skill owns its hue; CLAUDE.md, 5C accent mapping).
 * @param {object[]} manifests
 * @returns {Registry}
 */
export function createRegistry(manifests) {
  const errs = [];
  const byId = new Map();
  const accents = new Map();
  for (const m of manifests) {
    const e = validateManifest(m);
    if (e.length) { errs.push(...e); continue; }
    if (byId.has(m.id)) errs.push(`${m.id}: duplicate skill id`);
    if (accents.has(m.accentToken)) errs.push(`${m.id}: accent ${m.accentToken} already used by ${accents.get(m.accentToken)}`);
    byId.set(m.id, m);
    accents.set(m.accentToken, m.id);
  }
  if (errs.length) throw new TypeError(`Invalid skill manifests:\n${errs.join('\n')}`);
  const list = [...byId.values()];
  return {
    list: () => list.slice(),
    get: (id) => byId.get(id),
    getTask: (skillId, taskId) => byId.get(skillId)?.tasks.find((t) => t.id === taskId),
  };
}

/**
 * Import skill modules (each default-exports a manifest) and build a registry.
 * @param {string[]} [specifiers]  paths relative to this file
 * @param {(specifier: string) => Promise<{ default: object }>} [importer]
 * @returns {Promise<Registry>}
 */
export async function loadSkills(specifiers = SKILL_MODULES, importer = (s) => import(new URL(s, import.meta.url).href)) {
  const mods = await Promise.all(specifiers.map((s) => importer(s)));
  return createRegistry(mods.map((m) => m.default));
}
