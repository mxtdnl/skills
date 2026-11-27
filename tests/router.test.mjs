import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, toHash, createRouter, ROUTE_NAMES } from '../src/core/router.js';

test('parses every route', () => {
  assert.deepEqual(parseHash('#/hub'), { name: 'hub', params: {} });
  assert.deepEqual(parseHash(''), { name: 'hub', params: {} });
  assert.deepEqual(parseHash('#/'), { name: 'hub', params: {} });
  assert.deepEqual(parseHash('#/skill/critical'), { name: 'skill', params: { skillId: 'critical' } });
  assert.deepEqual(parseHash('#/task/critical/ct-t1'), { name: 'task', params: { skillId: 'critical', taskId: 'ct-t1' } });
  assert.deepEqual(parseHash('#/results/_example'), { name: 'results', params: { skillId: '_example' } });
  assert.deepEqual(parseHash('#/profile/'), { name: 'profile', params: {} });
  assert.deepEqual(parseHash('#/start'), { name: 'start', params: {} });
  assert.deepEqual(parseHash('#/start/consent'), { name: 'start', params: { step: 'consent' } });
  assert.deepEqual(parseHash('#/run/S-0123456789ABCDEF/self-report'), { name: 'run', params: { sittingId: 'S-0123456789ABCDEF', stepId: 'self-report' } });
  assert.deepEqual(parseHash('#/settings'), { name: 'settings', params: {} });
});

test('unknown or malformed hashes are not found', () => {
  for (const h of ['#/nope', '#/skill/', '#/skill/A B', '#/task/x', '#/skill/<img>', '#/skill/../x', '#/run/S-123/pick', '#/run/s-0123456789abcdef/pick', '#/app']) {
    assert.equal(parseHash(h).name, 'notFound', h);
  }
});

test('toHash round-trips and rejects bad ids', () => {
  const routes = [['hub', {}], ['skill', { skillId: 'creativity' }], ['task', { skillId: 'creativity', taskId: 'aut' }], ['results', { skillId: 'creativity' }], ['profile', {}], ['start', { step: 'code' }], ['run', { sittingId: 'S-0123456789ABCDEF', stepId: 'pick' }], ['settings', {}]];
  for (const [name, params] of routes) assert.deepEqual(parseHash(toHash(name, params)), { name, params });
  assert.deepEqual(ROUTE_NAMES, routes.map(([n]) => n));
  assert.throws(() => toHash('skill', { skillId: 'Bad Id' }), RangeError);
  assert.throws(() => toHash('run', { sittingId: 'nope', stepId: 'pick' }), RangeError);
  assert.equal(toHash('start'), '#/start');
  assert.throws(() => toHash('nowhere'), RangeError);
});

test('createRouter calls onRoute on start and on hashchange', () => {
  const listeners = {};
  const win = {
    location: { hash: '#/profile' },
    addEventListener: (t, f) => { listeners[t] = f; },
    removeEventListener: (t) => { delete listeners[t]; },
  };
  const seen = [];
  const router = createRouter((r) => seen.push(r.name), { window: win });
  router.navigate('skill', { skillId: 'x' });
  assert.equal(win.location.hash, '#/skill/x');
  listeners.hashchange();
  router.navigate('skill', { skillId: 'x' }); // same hash: re-render directly
  assert.deepEqual(seen, ['profile', 'skill', 'skill']);
  router.stop();
  assert.equal(listeners.hashchange, undefined);
});
