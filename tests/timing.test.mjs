import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTimer, startTicker, formatMs } from '../src/core/timing.js';

function clock(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms) => { t += ms; } };
}

test('counts down from an end timestamp and expires once', () => {
  const c = clock();
  let fired = 0;
  const timer = createTimer({ limitMs: 60_000, now: c.now, onExpire: () => { fired += 1; } }).start();
  assert.equal(timer.state, 'running');
  c.advance(20_000);
  assert.equal(timer.tick(), 40_000);
  c.advance(45_000); // a throttled background tab: one late tick still sees the true time
  assert.equal(timer.tick(), 0);
  assert.equal(timer.state, 'expired');
  timer.tick();
  assert.equal(fired, 1);
});

test('accommodation multiplier scales the limit', () => {
  const c = clock();
  const timer = createTimer({ limitMs: 120_000, multiplier: 1.5, now: c.now }).start();
  assert.equal(timer.remainingMs(), 180_000);
  assert.equal(timer.allowedMs(), 180_000);
  assert.throws(() => createTimer({ limitMs: 1000, multiplier: 0.5 }), RangeError);
  assert.throws(() => createTimer({ limitMs: 0 }), RangeError);
});

test('pause stops the clock; resume continues; paused time is logged', () => {
  const c = clock();
  const timer = createTimer({ limitMs: 60_000, now: c.now }).start();
  c.advance(10_000);
  timer.pause();
  c.advance(300_000);
  assert.equal(timer.state, 'paused');
  assert.equal(timer.tick(), 50_000);
  timer.resume();
  c.advance(10_000);
  assert.equal(timer.tick(), 40_000);
  assert.deepEqual(timer.stop(), { limitMs: 60_000, multiplier: 1, extendedMs: 0, pausedMs: 300_000, expired: false });
});

test('extend adds time while running, paused or idle, and re-opens an expired timer', () => {
  const c = clock();
  const timer = createTimer({ limitMs: 10_000, now: c.now });
  timer.extend(5_000);
  timer.start();
  assert.equal(timer.remainingMs(), 15_000);
  c.advance(5_000);
  timer.extend(1_000);
  assert.equal(timer.remainingMs(), 11_000);
  timer.pause();
  timer.extend(1_000);
  timer.resume();
  assert.equal(timer.remainingMs(), 12_000);
  c.advance(12_000);
  timer.tick();
  assert.equal(timer.state, 'expired');
  timer.extend(30_000);
  assert.equal(timer.state, 'running');
  assert.equal(timer.remainingMs(), 30_000);
  assert.equal(timer.log().extendedMs, 37_000);
  assert.throws(() => timer.extend(-1), RangeError);
});

test('stop reports expiry', () => {
  const c = clock();
  const timer = createTimer({ limitMs: 1_000, now: c.now }).start();
  c.advance(2_000);
  assert.equal(timer.stop().expired, true);
  assert.equal(timer.state, 'stopped');
});

test('untimed mode never expires', () => {
  const c = clock();
  const timer = createTimer({ limitMs: null, now: c.now }).start();
  c.advance(10 ** 9);
  assert.equal(timer.tick(), Infinity);
  assert.equal(timer.state, 'running');
  assert.equal(timer.stop().limitMs, null);
});

test('snapshot and restore survive a reload, using wall-clock time', () => {
  const c = clock();
  const a = createTimer({ limitMs: 60_000, multiplier: 1.25, now: c.now }).start();
  c.advance(15_000);
  const snap = JSON.parse(JSON.stringify(a.snapshot()));
  c.advance(5_000); // time passes while the page reloads
  const b = createTimer({ limitMs: 60_000, now: c.now, restore: snap });
  assert.equal(b.state, 'running');
  assert.equal(b.remainingMs(), 75_000 - 20_000);
  b.pause();
  const paused = createTimer({ limitMs: 60_000, now: c.now, restore: b.snapshot() });
  c.advance(100_000);
  assert.equal(paused.remainingMs(), 55_000);
});

test('startTicker ticks until expiry, then stops itself', () => {
  const c = clock();
  const timer = createTimer({ limitMs: 1_000, now: c.now }).start();
  let fn = null;
  let cleared = false;
  const seen = [];
  startTicker(timer, (left) => seen.push(left), { setInterval: (f) => { fn = f; return 1; }, clearInterval: () => { cleared = true; } });
  c.advance(400); fn();
  c.advance(700); fn();
  assert.deepEqual(seen, [600, 0]);
  assert.equal(cleared, true);
});

test('formatMs', () => {
  assert.equal(formatMs(125_000), '2:05');
  assert.equal(formatMs(999), '0:01');
  assert.equal(formatMs(0), '0:00');
  assert.equal(formatMs(Infinity), '');
});
