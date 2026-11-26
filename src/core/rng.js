// Seeded pseudo-random numbers and an unbiased Fisher-Yates shuffle.
//
// Every random choice that affects what a student sees (form order, option order, item draws)
// goes through a seeded generator, so that a sitting can be replayed exactly from its stored
// seed (audit D-6). Math.random is never used for these choices.
//
// mulberry32 is a small 32-bit generator with a full 2^32 period. It is adequate for shuffling
// short item lists; it is not cryptographic and must not be used for identifiers (see ids.js).

const UINT32 = 0x100000000;

/**
 * mulberry32 step function. Returns a function that yields unsigned 32-bit integers.
 * @param {number} seed  any number; coerced to uint32
 * @returns {() => number}
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextUint32() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
}

/**
 * Hash a string to a uint32 seed (FNV-1a). Used to derive per-task seeds from a sitting seed,
 * for example seedFromString(`${sitting.seed}:${skillId}:${taskId}`).
 * @param {string} str
 * @returns {number}
 */
export function seedFromString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * A fresh uint32 seed from the platform's cryptographic source.
 * @returns {number}
 */
export function randomSeed() {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0];
}

/**
 * @typedef {object} Rng
 * @property {number} seed              the uint32 seed this generator started from
 * @property {() => number} nextUint32  next unsigned 32-bit integer
 * @property {() => number} next        next float in [0, 1)
 * @property {(n: number) => number} int  unbiased integer in [0, n)
 * @property {<T>(items: readonly T[]) => T[]} shuffle  new array, uniformly permuted
 */

/**
 * Create a seeded generator.
 * @param {number} seed
 * @returns {Rng}
 */
export function createRng(seed) {
  if (!Number.isFinite(seed)) throw new TypeError('createRng: seed must be a finite number');
  const nextUint32 = mulberry32(seed);

  // Unbiased integer in [0, n) by rejection sampling: draws at or above the largest multiple
  // of n below 2^32 are discarded, so every residue is equally likely. Math.floor(next() * n)
  // would carry a small bias whenever n does not divide 2^32.
  function int(n) {
    if (!Number.isInteger(n) || n < 1 || n > UINT32) throw new RangeError('int: n must be an integer in [1, 2^32]');
    const limit = UINT32 - (UINT32 % n);
    let x;
    do x = nextUint32(); while (x >= limit);
    return x % n;
  }

  // Durstenfeld's Fisher-Yates: for i from the end, swap with a uniform j in [0, i].
  // Returns a copy; the input is not mutated.
  function shuffle(items) {
    const a = Array.from(items);
    for (let i = a.length - 1; i > 0; i--) {
      const j = int(i + 1);
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  return {
    seed: seed >>> 0,
    nextUint32,
    next: () => nextUint32() / UINT32,
    int,
    shuffle,
  };
}
