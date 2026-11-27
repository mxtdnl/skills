// Text handling for the creativity tasks (docs/SCORING.md, Creativity tasks): normalising and
// stemming words, recognising English words, and preparing one written line for scoring.
//
// Everything here is deterministic and runs in the browser; nothing leaves it. Words are matched
// as whole normalised tokens, never as substrings (audit B-2). British and American spellings and
// small typing errors are accepted so that a student is not penalised for either (audit E-1).
//
// The English word list (content/creativity/wordlist.js, about 40,000 words from SCOWL) is large,
// so it is loaded on demand: call loadDictionary() before scoring. The creativity manifest does
// this in loadContent, and the tests do it before calling score().

/** Function words: never meaningful on their own. */
const STOP_WORDS = `a about above after again against all am an and any are as at be because been before being
below between both but by did does doing down during each few for from further had has having he her here
hers herself him himself his how i if in into is it its itself me more most my myself nor of off on once only
or other our ours ourselves out over own same she so some such than that the their theirs them themselves
then there these they this those through to too under until up us was we were what when where which while
who whom why will with you your yours yourself yourselves im ive id youre theyre thats its dont cant wont
inside outside onto within around top bottom side
etc eg ie e g`;

/** Padding words: they add length but no idea, so they are not meaningful either (audit B-2). */
const FILLER_WORDS = `really very basically honestly literally just actually maybe perhaps probably quite
pretty totally simply generally kind sort stuff thing things something anything everything lot lots
whatever like um uh er hmm lol ok okay yeah yep yes guess think suppose idea ideas also well good nice
great cool fine way ways could would should can might may must shall`;

/**
 * General verbs, negations and quantities, and general problem words: meaningful for the two-word
 * minimum ("no privacy" has two), but ignored when comparing ideas, so "not enough sleep" and
 * "not enough money" are different ideas, and "make a hat" repeats "wear it as a hat".
 */
const GENERIC_WORDS = `use used using uses make made making makes put get got have do done turn turned become
not no never enough much many less little always hard difficult difficulty problem problems issue issues
lack trouble`;

const split = (s) => s.split(/\s+/).filter(Boolean);
const STOP = new Set(split(STOP_WORDS));
const FILLER = new Set(split(FILLER_WORDS));

/**
 * Lower case, accents removed, anything other than letters and digits treated as a space.
 * Apostrophes are dropped ("don't" becomes "dont").
 * @param {string} text
 * @returns {string[]}
 */
export function tokenise(text) {
  return String(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean);
}

// -------------------------------------------------------------- dictionary

let DICT = null;

/** Load the English word list once. Resolves to the Set of words. */
export async function loadDictionary() {
  if (!DICT) {
    const { WORDS } = await import('../../../content/creativity/wordlist.js');
    DICT = new Set(WORDS.split(' '));
  }
  return DICT;
}

/** True once loadDictionary() has resolved. */
export const dictionaryLoaded = () => DICT !== null;

function dict() {
  if (!DICT) throw new Error('creativity scoring: call loadDictionary() before scoring');
  return DICT;
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/** Every string one edit (deletion, transposition, substitution, insertion) away from w. */
function* edits1(w) {
  for (let i = 0; i < w.length; i++) yield w.slice(0, i) + w.slice(i + 1);
  for (let i = 0; i < w.length - 1; i++) yield w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2);
  for (let i = 0; i < w.length; i++) for (const c of LETTERS) if (c !== w[i]) yield w.slice(0, i) + c + w.slice(i + 1);
  for (let i = 0; i <= w.length; i++) for (const c of LETTERS) yield w.slice(0, i) + c + w.slice(i);
}

/** Words of at least this length may contain one typing error and still count as words. */
export const TYPO_MIN_LENGTH = 5;

// -------------------------------------------------------------- spelling and stems

/**
 * British and American spellings: -ise/-ize, -yse/-yze, -our/-or, -tre/-ter. A rule applies
 * only if the other spelling is itself a known word, so "four" never becomes "for".
 * @param {string} w
 * @param {(w: string) => boolean} known
 */
function spellingVariant(w, known) {
  const rules = [
    [/is(e|es|ed|ing|ation|ations|er|ers)$/, 'iz$1'],
    [/ys(e|es|ed|ing)$/, 'yz$1'],
    [/our(s|ed|ing|ite|ites|able|ful|fully|less)?$/, 'or$1'],
    [/tre(s|d)?$/, 'ter$1'],
  ];
  for (const [re, to] of rules) {
    if (w.length < 6 || !re.test(w)) continue;
    const v = w.replace(re, to);
    if (v !== w && known(v)) return v;
  }
  return w;
}

/**
 * A light stemmer: plural and verb endings are removed, so "storing", "stores" and "store"
 * become the same stem. An ending is removed only if what is left is a known word, so "notes"
 * becomes "note" (not "not") and "bleed" stays "bleed". It is applied in the same way to student
 * responses and to the frequency tables, so it only has to be consistent, not linguistically
 * exact.
 * @param {string} w  a token (already a spelling variant)
 * @param {(w: string) => boolean} known
 */
export function stem(w, known) {
  if (w.length <= 3 || /^\d+$/.test(w)) return w;
  let s = w;
  if (s.endsWith('ies') && known(`${s.slice(0, -3)}y`)) s = `${s.slice(0, -3)}y`;
  else if (/(ss|sh|ch|x|z)es$/.test(s) && known(s.slice(0, -2))) s = s.slice(0, -2);
  else if (s.endsWith('s') && !s.endsWith('ss') && known(s.slice(0, -1))) s = s.slice(0, -1);
  if (s.endsWith('ied') && known(`${s.slice(0, -3)}y`)) return `${s.slice(0, -3)}y`;
  const cut = s.endsWith('ing') && s.length > 5 ? 3 : s.endsWith('ed') && s.length > 4 ? 2 : 0;
  if (cut) {
    const base = s.slice(0, -cut);
    if (known(`${base}e`)) return `${base}e`;
    if (known(base)) return base;
    if (/([b-df-hj-np-tv-z])\1$/.test(base) && known(base.slice(0, -1))) return base.slice(0, -1);
  }
  return s;
}

/** A predicate for known words: the English list plus any extra (task) words. */
export function knownWords(extra = new Set()) {
  const words = dict();
  return (w) => words.has(w) || extra.has(w);
}

/** Stem of a token after spelling variants. Needs the dictionary (loadDictionary()). */
export function canonical(token, known = knownWords()) {
  return stem(spellingVariant(token, known), known);
}

/** Canonical stems of a phrase from a frequency table or category list. */
export const canonicalPhrase = (phrase, known = knownWords()) => tokenise(phrase).map((t) => canonical(t, known));

// -------------------------------------------------------------- one line

/**
 * @typedef {object} Prepared
 * @property {string} text         the line as written, trimmed
 * @property {string[]} tokens     every token, as typed (normalised)
 * @property {string[]} stems      canonical stem of every token, in order (for phrase matching)
 * @property {number} content      tokens that are not function or padding words
 * @property {number} recognised   of those, tokens recognised as English words
 * @property {number} meaningful   recognised content tokens (the two-word minimum counts these)
 * @property {string[]} core       stems of meaningful tokens that are not general verbs or the
 *                                 object's own name, used to compare ideas (unique, in order)
 */

/**
 * Prepare one line. `lexicon` holds the stems of the task's own vocabulary (frequency table,
 * categories and object words), which count as words even if the general list lacks them;
 * a token one typing error away from a task word (5 letters or more) is read as that word.
 * @param {string} line
 * @param {{ lexicon: Set<string>, lexiconWords: Set<string>, objectStems: Set<string> }} task
 * @returns {Prepared}
 */
export function prepareLine(line, task) {
  const words = dict();
  const known = task.known || knownWords(task.lexiconWords);
  const text = String(line).trim();
  const tokens = tokenise(text);
  const stems = [];
  let content = 0;
  let recognised = 0;
  let meaningful = 0;
  const core = [];
  for (const raw of tokens) {
    let t = raw;
    const isStop = STOP.has(t) || FILLER.has(t);
    if (!isStop && !/^\d+$/.test(t)) {
      content += 1;
      let isWord = known(t) || task.lexicon.has(canonical(t, known));
      if (!isWord && t.length >= TYPO_MIN_LENGTH) {
        // A typing error: prefer a task word, then any English word.
        let fix = null;
        for (const e of edits1(t)) { if (task.lexiconWords.has(e)) { fix = e; break; } }
        if (!fix) for (const e of edits1(t)) { if (words.has(e)) { fix = e; break; } }
        if (fix) { t = fix; isWord = true; }
      }
      if (isWord) {
        recognised += 1;
        meaningful += 1;
        const s = canonical(t, known);
        if (!GENERIC_RAW.has(t) && !GENERIC_RAW.has(s) && !task.objectStems.has(s) && !core.includes(s)) core.push(s);
      }
    }
    stems.push(canonical(t, known));
  }
  return { text, tokens, stems, content, recognised, meaningful, core };
}

// Generic words are compared by their stems, so every form of them is listed.
const GENERIC_RAW = new Set(split(GENERIC_WORDS));

/** Exposed for tests and documentation. */
export const WORD_LISTS = Object.freeze({ stop: STOP, filler: FILLER, generic: GENERIC_RAW });
