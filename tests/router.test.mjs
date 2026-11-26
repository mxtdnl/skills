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
});

test('unknown or malformed hashes are not found', () => {
  for (const h of ['#/nope', '#/skill/', '#/skill/A B', '#/task/x', '#/skill/<img>', '#/skill/../x']) {
    assert.equal(parseHash(h).name, 'notFound', h);
  }
});

test('toHash round-trips and rejects bad ids', () => {
  const routes = [['hub', {}], ['skill', { skillId: 'creativity' }], ['task', { skillId: 'creativity', taskId: 'aut' }], ['results', { skillId: 'creativity' }], ['profile', {}]];
  for (const [name, params] of routes) assert.deepEqual(parseHash(toHash(name, params)), { name, params });
  assert.deepEqual(ROUTE_NAMES, routes.map(([n]) => n));
  assert.throws(() => toHash('skill', { skillId: 'Bad Id' }), RangeError);
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
