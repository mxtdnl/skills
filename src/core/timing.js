// Task timers based on an end timestamp (audit E-3, I-5; WCAG 2.2.1 Timing Adjustable).
//
// The timer stores when it will end, not a count of remaining ticks, so it stays correct when the
// tab is throttled in the background, and it can be saved and restored across a reload. It
// supports:
//   - an accommodation multiplier fixed at creation (1 = standard time, 1.5 = 50% extra time);
//   - pause and resume (paused time does not count);
//   - extend(ms), for a student who asks for more time when warned;
//   - untimed mode (limitMs null), for tasks where a time limit is not essential.
//
// The timer holds no interval of its own. Call tick() from a display loop (startTicker below,
// or requestAnimationFrame); onExpire fires once, from tick(), when the end is reached.

/**
 * @typedef {'idle' | 'running' | 'paused' | 'expired' | 'stopped'} TimerState
 */

/**
 * @typedef {object} TimerSnapshot
 * @property {number | null} limitMs
 * @property {number} multiplier
 * @property {TimerState} state
 * @property {number | null} endAt       epoch ms; set while running
 * @property {number | null} remainingMs set while idle or paused
 * @property {number} extendedMs
 * @property {number} pausedMs
 * @property {number | null} pausedAt
 * @property {number | null} startedAt
 */

/**
 * @param {object} options
 * @param {number | null} options.limitMs   base time limit; null for untimed
 * @param {number} [options.multiplier=1]   accommodation multiplier, at least 1
 * @param {() => number} [options.now]       clock, epoch ms; injectable for tests
 * @param {(timer: object) => void} [options.onExpire]
 * @param {TimerSnapshot} [options.restore] resume from a snapshot()
 */
export function createTimer({ limitMs, multiplier = 1, now = () => Date.now(), onExpire, restore } = {}) {
  if (limitMs !== null && !(Number.isFinite(limitMs) && limitMs > 0)) throw new RangeError('createTimer: limitMs must be a positive number or null');
  if (!(Number.isFinite(multiplier) && multiplier >= 1)) throw new RangeError('createTimer: multiplier must be a number of at least 1');

  /** @type {TimerSnapshot} */
  let s = restore
    ? { ...restore }
    : {
        limitMs,
        multiplier,
        state: 'idle',
        endAt: null,
        remainingMs: limitMs === null ? null : limitMs * multiplier,
        extendedMs: 0,
        pausedMs: 0,
        pausedAt: null,
        startedAt: null,
      };
  const untimed = s.limitMs === null;
  let fired = s.state === 'expired';

  function remainingMs() {
    if (untimed) return Infinity;
    if (s.state === 'running') return Math.max(0, s.endAt - now());
    if (s.state === 'expired') return 0;
    return s.remainingMs;
  }

  const api = {
    get state() { return s.state; },
    get untimed() { return untimed; },
    remainingMs,

    /** Total time allowed so far: limit x multiplier + extensions. Infinity if untimed. */
    allowedMs() { return untimed ? Infinity : s.limitMs * s.multiplier + s.extendedMs; },

    start() {
      if (s.state !== 'idle') return api;
      s.startedAt = now();
      s.state = 'running';
      if (!untimed) { s.endAt = s.startedAt + s.remainingMs; s.remainingMs = null; }
      return api;
    },

    pause() {
      if (s.state !== 'running') return api;
      api.tick();
      if (s.state !== 'running') return api;
      s.pausedAt = now();
      if (!untimed) { s.remainingMs = s.endAt - s.pausedAt; s.endAt = null; }
      s.state = 'paused';
      return api;
    },

    resume() {
      if (s.state !== 'paused') return api;
      const t = now();
      s.pausedMs += t - s.pausedAt;
      s.pausedAt = null;
      if (!untimed) { s.endAt = t + s.remainingMs; s.remainingMs = null; }
      s.state = 'running';
      return api;
    },

    /** Add time. Allowed while idle, running or paused; also re-opens an expired timer. */
    extend(ms) {
      if (!(Number.isFinite(ms) && ms > 0)) throw new RangeError('extend: ms must be a positive number');
      if (untimed || s.state === 'stopped') return api;
      s.extendedMs += ms;
      if (s.state === 'running') s.endAt += ms;
      else if (s.state === 'expired') { s.state = 'running'; s.endAt = now() + ms; fired = false; }
      else s.remainingMs += ms;
      return api;
    },

    /** Stop for good (task completed). Returns the timing log for the attempt record. */
    stop() {
      if (s.state === 'paused') api.resume();
      api.tick();
      if (s.state === 'running' && !untimed) { s.remainingMs = Math.max(0, s.endAt - now()); s.endAt = null; }
      const expired = s.state === 'expired';
      s.state = 'stopped';
      return api.log(expired);
    },

    /** Check for expiry; fires onExpire once. Returns remaining ms. */
    tick() {
      if (s.state === 'running' && !untimed && now() >= s.endAt) {
        s.state = 'expired';
        s.remainingMs = 0;
        s.endAt = null;
        if (!fired) { fired = true; if (onExpire) onExpire(api); }
      }
      return remainingMs();
    },

    /** Timing fields stored on a TaskAttempt (schema.js TimingLog). */
    log(expired = s.state === 'expired') {
      return { limitMs: s.limitMs, multiplier: s.multiplier, extendedMs: s.extendedMs, pausedMs: s.pausedMs, expired };
    },

    /** Serialisable state, for saving across a reload. */
    snapshot() { return { ...s }; },
  };
  return api;
}

/**
 * Call timer.tick() and onTick(remainingMs) every intervalMs until the timer stops or expires.
 * Returns a cancel function. setInterval is injectable for tests.
 */
export function startTicker(timer, onTick, { intervalMs = 250, setInterval: si = globalThis.setInterval, clearInterval: ci = globalThis.clearInterval } = {}) {
  const id = si(() => {
    const left = timer.tick();
    onTick(left, timer);
    if (timer.state === 'expired' || timer.state === 'stopped') ci(id);
  }, intervalMs);
  return () => ci(id);
}

/** Format milliseconds as m:ss for display. Infinity shows as an empty string. */
export function formatMs(ms) {
  if (!Number.isFinite(ms)) return '';
  const total = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
