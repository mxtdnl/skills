import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, mulberry32, seedFromString, randomSeed } from '../src/core/rng.js';

test('same seed gives the same sequence and the same shuffle', () => {
  const a = createRng(12345);
  const b = createRng(12345);
  const items = Array.from({ length: 20 }, (_, i) => i);
  assert.deepEqual(a.shuffle(items), b.shuffle(items));
  assert.deepEqual(Array.from({ length: 50 }, a.nextUint32), Array.from({ length: 50 }, b.nextUint32));
});

test('different seeds give different shuffles', () => {
  const items = Array.from({ length: 20 }, (_, i) => i);
  assert.notDeepEqual(createRng(1).shuffle(items), createRng(2).shuffle(items));
});

test('mulberry32 reference values are stable across releases', () => {
  // Pinned so that a change to the generator, which would change every stored sitting's replay,
  // cannot happen unnoticed.
  const next = mulberry32(0);
  assert.deepEqual(Array.from({ length: 3 }, next), [1144304738, 1416247, 958946056]);
});

test('shuffle returns a permutation and does not mutate its input', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];
  const copy = items.slice();
  const out = createRng(7).shuffle(items);
  assert.deepEqual(items, copy);
  assert.deepEqual(out.slice().sort(), copy.sort());
  assert.deepEqual(createRng(7).shuffle([]), []);
  assert.deepEqual(createRng(7).shuffle(['x']), ['x']);
});

test('shuffle is uniform: chi-square over all 24 permutations of 4 items, 10,000 shuffles', () => {
  const rng = createRng(20261126);
  const N = 10000;
  const counts = new Map();
  for (let i = 0; i < N; i++) {
    const k = rng.shuffle([0, 1, 2, 3]).join('');
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  assert.equal(counts.size, 24, 'every permutation occurs');
  const expected = N / 24;
  let chi2 = 0;
  for (const c of counts.values()) chi2 += (c - expected) ** 2 / expected;
  // Critical value of chi-square with 23 degrees of freedom at p = 0.001 is 49.73.
  assert.ok(chi2 < 49.73, `chi-square ${chi2.toFixed(2)} exceeds 49.73`);
});

test('shuffle is uniform by position: each item lands in each position about equally', () => {
  const rng = createRng(99);
  const n = 5;
  const N = 10000;
  const grid = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < N; i++) rng.shuffle([0, 1, 2, 3, 4]).forEach((item, pos) => { grid[item][pos] += 1; });
  const expected = N / n;
  let chi2 = 0;
  for (const row of grid) for (const c of row) chi2 += (c - expected) ** 2 / expected;
  // (n - 1)^2 = 16 degrees of freedom; critical value at p = 0.001 is 39.25.
  assert.ok(chi2 < 39.25, `chi-square ${chi2.toFixed(2)} exceeds 39.25`);
});

test('the classic biased shuffle (swap with any index) fails the same test', () => {
  // Guards the test itself: it must be strong enough to catch a known biased algorithm.
  const rng = createRng(20261126);
  const N = 10000;
  const counts = new Map();
  for (let i = 0; i < N; i++) {
    const a = [0, 1, 2, 3];
    for (let j = 0; j < a.length; j++) {
      const k = rng.int(a.length);
      [a[j], a[k]] = [a[k], a[j]];
    }
    const key = a.join('');
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const expected = N / 24;
  let chi2 = 0;
  for (const c of counts.values()) chi2 += (c - expected) ** 2 / expected;
  chi2 += (24 - counts.size) * expected;
  assert.ok(chi2 > 49.73, `biased shuffle not detected (chi-square ${chi2.toFixed(2)})`);
});

test('int(n) stays in range and covers every value', () => {
  const rng = createRng(3);
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const v = rng.int(7);
    assert.ok(Number.isInteger(v) && v >= 0 && v < 7);
    seen.add(v);
  }
  assert.equal(seen.size, 7);
  assert.throws(() => rng.int(0), RangeError);
  assert.throws(() => rng.int(2.5), RangeError);
});

test('next() is in [0, 1)', () => {
  const rng = createRng(4);
  for (let i = 0; i < 1000; i++) {
    const v = rng.next();
    assert.ok(v >= 0 && v < 1);
  }
});

test('seedFromString is deterministic and spreads nearby strings', () => {
  assert.equal(seedFromString('123:_example:pick'), seedFromString('123:_example:pick'));
  assert.notEqual(seedFromString('123:a:pick'), seedFromString('123:b:pick'));
  assert.ok(Number.isInteger(seedFromString('')) && seedFromString('') >= 0);
});

test('randomSeed gives a uint32', () => {
  const s = randomSeed();
  assert.ok(Number.isInteger(s) && s >= 0 && s <= 0xffffffff);
});

test('createRng rejects a non-finite seed', () => {
  assert.throws(() => createRng(NaN), TypeError);
});
