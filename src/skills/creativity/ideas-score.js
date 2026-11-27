// Scoring for the two creativity production tasks (docs/SCORING.md, Creativity tasks):
// CR-T1 Alternate uses and CR-T2 Problem finding. Both are lists of ideas, one per line, scored
// the same way against the item's own category list and its provisional frequency table.
//
// Every component is reported separately; nothing is weighted or blended (audit A-6, B-2):
//   fluency       valid, unique ideas
//   flexibility   distinct categories among them (an idea with no category earns nothing)
//   originality   mean points per valid idea from the frequency table, 0 to 2, independent of
//                 how many ideas were written (audit E-1)
// Lines that cannot be scored are counted by reason and never credited:
//   non-words     no letters or digits, or most of the content words are not English words
//   too-short     fewer than two meaningful words, or nothing beyond the object's name and
//                 general verbs such as "use" or "make"
//   duplicate     the same idea as an earlier valid line (same words, a subset, or a large overlap)
//
// Matching is by whole normalised stems only. An idea matches a table entry when every one of the
// entry's word groups is present in the idea (the entry is found in the idea). An idea is never
// matched because it is contained in a table phrase (no reverse substring; audit B-2), and words
// that are not in the table never earn points by being unknown unless the idea is a real,
// categorised idea (see unlisted below).

import { prepareLine, canonicalPhrase, knownWords, tokenise } from './text.js';

/** Points per frequency band (docs/SCORING.md). Bands are author-estimated and PROVISIONAL. */
export const BAND_POINTS = Object.freeze({ common: 0, occasional: 1, rare: 2 });
/** An idea not in the table but in one of the item's categories: treated as rare. */
export const UNLISTED_POINTS = 2;
/** An idea not in the table and in no category: its originality is unknown; scored in the middle. */
export const UNPLACED_POINTS = 1;
/** Originality needs at least this many valid ideas, else it is null. PROVISIONAL. */
export const MIN_FLUENCY_FOR_ORIGINALITY = 3;
/** Minimum meaningful words per idea. */
export const MIN_MEANINGFUL_WORDS = 2;
/** Overlap (Jaccard index of the ideas' core words) at or above which two ideas are the same. */
export const DUPLICATE_OVERLAP = 0.6;
/** Only the first lines and characters are scored, so pasted text cannot run away. */
export const MAX_LINES = 100;
export const MAX_LINE_LENGTH = 200;

const compiled = new WeakMap();

/** Precompute the item's vocabulary, categories and table as stems. Cached per item. */
export function compile(item) {
  if (compiled.has(item)) return compiled.get(item);
  // Every word of the item's own vocabulary counts as known, so a task word missing from the
  // general list (for example "terrarium") is still recognised and stemmed.
  const phrases = [
    ...(item.objectWords || []),
    ...item.categories.flatMap((c) => c.keywords),
    ...(item.norms || []).flatMap((e) => e.match.flat()),
  ];
  const lexiconWords = new Set(phrases.flatMap((p) => tokenise(p)));
  const known = knownWords(lexiconWords);
  const lexicon = new Set();
  const addPhrase = (phrase) => {
    const stems = canonicalPhrase(phrase, known);
    for (const s of stems) lexicon.add(s);
    return stems;
  };
  const objectStems = new Set((item.objectWords || []).flatMap((w) => addPhrase(w)));
  const categories = item.categories.map((c) => ({ id: c.id, keywords: c.keywords.map(addPhrase) }));
  const entries = (item.norms || []).map((e, order) => ({
    id: e.id, category: e.category, freq: e.freq, order,
    groups: e.match.map((group) => group.map(addPhrase)),
  }));
  const out = { lexicon, lexiconWords, known, objectStems, categories, entries };
  compiled.set(item, out);
  return out;
}

/** Position of the first occurrence of the phrase's stems, in order and adjacent, or -1. */
function phraseAt(stems, phrase) {
  if (phrase.length === 0) return -1;
  for (let i = 0; i + phrase.length <= stems.length; i++) {
    let ok = true;
    for (let j = 0; j < phrase.length; j++) if (stems[i + j] !== phrase[j]) { ok = false; break; }
    if (ok) return i;
  }
  return -1;
}
const hasPhrase = (stems, phrase) => phraseAt(stems, phrase) !== -1;

const RANK = { rare: 0, occasional: 1, common: 2 };

/**
 * The best matching entry: the most word groups (most specific); then the rarer band (an idea
 * that contains a rarer listed idea gets credit for it); then the entry whose words come first in
 * the idea; then the first listed. Null if none matches.
 */
function matchEntry(stems, task) {
  let best = null;
  for (const e of task.entries) {
    let at = Infinity;
    let ok = true;
    for (const alts of e.groups) {
      const positions = alts.map((p) => phraseAt(stems, p)).filter((i) => i !== -1);
      if (positions.length === 0) { ok = false; break; }
      at = Math.min(at, ...positions);
    }
    if (!ok) continue;
    const c = { e, at };
    if (!best
      || e.groups.length > best.e.groups.length
      || (e.groups.length === best.e.groups.length && (RANK[e.freq] < RANK[best.e.freq]
        || (RANK[e.freq] === RANK[best.e.freq] && at < best.at)))) best = c;
  }
  return best ? best.e : null;
}

/** The category with the most keyword hits (at least one); a tie goes to the first listed. */
function matchCategory(stems, task) {
  let best = null;
  let bestHits = 0;
  for (const c of task.categories) {
    const hits = c.keywords.filter((k) => hasPhrase(stems, k)).length;
    if (hits > bestHits) { best = c.id; bestHits = hits; }
  }
  return best;
}

function sameIdea(a, b) {
  if (a.length === 0 || b.length === 0) return false;
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  // One is a subset of the other (a one-word idea must be identical, so "no time to apply for
  // internships" does not repeat "not enough time")
  if (Math.min(A.size, B.size) >= 2 && inter === Math.min(A.size, B.size)) return true;
  return inter / (A.size + B.size - inter) >= DUPLICATE_OVERLAP;
}

/**
 * The written lines of a response: strings, trimmed, empty lines dropped, capped.
 * @param {any} response
 * @returns {string[]}
 */
export function linesOf(response) {
  if (!response || !Array.isArray(response.lines)) return [];
  return response.lines
    .filter((l) => typeof l === 'string')
    .map((l) => l.trim().slice(0, MAX_LINE_LENGTH))
    .filter((l) => l.length > 0)
    .slice(0, MAX_LINES);
}

/**
 * @typedef {object} LineResult
 * @property {string} text
 * @property {'valid' | 'non-words' | 'too-short' | 'duplicate'} status
 * @property {string | null} category  category id (valid lines only)
 * @property {string | null} entry     id of the matched table entry (valid lines only)
 * @property {'common' | 'occasional' | 'rare' | null} band
 * @property {number | null} points    originality points (valid lines only)
 * @property {number | null} duplicateOf  index of the earlier line it repeats
 */

/**
 * Classify every line of a response. Pure, given the loaded dictionary.
 * @param {string[]} lines  from linesOf()
 * @param {object} item     a CR-T1 or CR-T2 item with its categories and norms
 * @returns {LineResult[]}
 */
export function analyse(lines, item) {
  const task = compile(item);
  const out = [];
  const valid = [];
  lines.forEach((line, index) => {
    const p = prepareLine(line, task);
    const base = { text: p.text, category: null, entry: null, band: null, points: null, duplicateOf: null };
    if (p.tokens.length === 0 || (p.content > 0 && p.recognised / p.content < 0.5)) { out.push({ ...base, status: 'non-words' }); return; }
    if (p.meaningful < MIN_MEANINGFUL_WORDS || p.core.length === 0) { out.push({ ...base, status: 'too-short' }); return; }
    const earlier = valid.find((v) => sameIdea(v.core, p.core));
    if (earlier) { out.push({ ...base, status: 'duplicate', duplicateOf: earlier.index }); return; }
    valid.push({ index, core: p.core });
    const entry = matchEntry(p.stems, task);
    const category = entry ? entry.category : matchCategory(p.stems, task);
    const points = entry ? BAND_POINTS[entry.freq] : category ? UNLISTED_POINTS : UNPLACED_POINTS;
    out.push({ ...base, status: 'valid', category, entry: entry ? entry.id : null, band: entry ? entry.freq : null, points });
  });
  return out;
}

/**
 * Indicators from analysed lines.
 * @param {LineResult[]} results
 * @param {object} item
 */
export function indicators(results, item) {
  const valid = results.filter((r) => r.status === 'valid');
  const fluency = valid.length;
  const cats = new Set(valid.map((r) => r.category).filter(Boolean));
  const points = valid.reduce((s, r) => s + r.points, 0);
  const count = (status) => results.filter((r) => r.status === status).length;
  return {
    entered: results.length,
    fluency,
    flexibility: cats.size,
    originality: fluency >= MIN_FLUENCY_FOR_ORIGINALITY ? points / fluency : null,
    uncommon: valid.filter((r) => r.points === 2).length,
    unlisted: valid.filter((r) => r.entry === null).length,
    uncategorised: valid.filter((r) => r.category === null).length,
    nonWords: count('non-words'),
    tooShort: count('too-short'),
    duplicates: count('duplicate'),
    categoriesAvailable: item.categories.length,
  };
}

/**
 * The item a response belongs to, and its latest lines. An assessment form has one item; a
 * practice sitting shows one item of the practice pool, whichever was answered.
 * @param {{ itemId: string, response: any }[]} responses
 * @param {object[]} form
 */
export function latestFor(responses, form) {
  const ids = new Set(form.map((it) => it.id));
  let last = null;
  for (const r of responses) if (ids.has(r.itemId) && r.response && Array.isArray(r.response.lines)) last = r;
  const item = last ? form.find((it) => it.id === last.itemId) : form[0];
  return { item, lines: last ? linesOf(last.response) : [] };
}

/**
 * Pure: depends only on the attempt's responses, the form's items and the word list.
 * @param {{ itemResponses: { itemId: string, response: any }[] }} attempt
 * @param {object[]} form
 * @returns {{ rawScore: number, score: object }}
 */
export function score(attempt, form) {
  const { item, lines } = latestFor(attempt.itemResponses || [], form);
  const s = indicators(analyse(lines, item), item);
  return { rawScore: s.fluency, score: s };
}
