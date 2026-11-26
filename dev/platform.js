// Developer harness for the S3 platform skeleton. Exercises router, registry, runner, store and
// schema end to end with the stub skill. Not student-facing; replaced by the hub in S5.
// Unstyled on purpose (S4 does design). DOM is built with createElement/textContent only.

import { LocalStorageAdapter, mountStorageNotice } from '../src/core/store.js';
import { createRouter, toHash } from '../src/core/router.js';
import { newParticipantId, newSittingId } from '../src/core/ids.js';
import { randomSeed } from '../src/core/rng.js';
import { SCHEMA_VERSION, APP_VERSION, SCORING_VERSION } from '../src/core/version.js';
import { loadSkills, EXAMPLE_MODULES } from '../src/skills/registry.js';
import { runTask, assignForm } from '../src/skills/runner.js';

const app = document.getElementById('app');
const store = new LocalStorageAdapter();
mountStorageNotice(store, document.body);

function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el[k] = v;
  }
  el.append(...children.filter((c) => c !== null && c !== undefined));
  return el;
}

async function getParticipant() {
  const [existing] = await store.list('participant');
  if (existing) return existing;
  const now = new Date().toISOString();
  // The consent flow is built in S5. The harness records a developer-only notice version.
  return store.save('participant', {
    type: 'participant',
    schemaVersion: SCHEMA_VERSION,
    id: newParticipantId(),
    createdAt: now,
    consent: { noticeVersion: 'dev-harness', givenAt: now, programmeEvaluation: false, languageBackground: false },
  });
}

const participant = await getParticipant();
const registry = await loadSkills(EXAMPLE_MODULES);
let pendingMode = 'practice';
let running = null;

async function newSitting(mode) {
  let formId = 'practice';
  const seed = randomSeed();
  if (mode === 'assessment') {
    const previous = (await store.list('sitting'))
      .filter((s) => s.participantId === participant.id && s.mode === 'assessment' && s.completedAt)
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
      .pop();
    formId = assignForm({ seed, previousFormId: previous ? previous.formId : null });
  }
  return store.save('sitting', {
    type: 'sitting',
    schemaVersion: SCHEMA_VERSION,
    id: newSittingId(),
    participantId: participant.id,
    mode,
    formId,
    seed,
    appVersion: APP_VERSION,
    scoringVersion: SCORING_VERSION,
    startedAt: new Date().toISOString(),
    completedAt: null,
  });
}

const views = {
  hub() {
    return [
      h('h1', { textContent: 'Platform harness' }),
      h('p', { textContent: `Participant ${participant.id}` }),
      h('ul', {}, ...registry.list().map((s) => h('li', {}, h('a', { href: toHash('skill', { skillId: s.id }), textContent: s.label })))),
      h('p', {}, h('a', { href: toHash('profile'), textContent: 'Profile and data' })),
    ];
  },

  skill({ skillId }) {
    const skill = registry.get(skillId);
    if (!skill) return views.notFound();
    return [
      h('h1', { textContent: skill.label }),
      h('ul', {}, ...skill.tasks.map((t) => h('li', {},
        h('span', { textContent: `${t.label} (about ${t.estMinutes} min) ` }),
        ...['practice', 'assessment'].map((mode) => h('button', {
          type: 'button',
          className: 'btn',
          dataset: { mode },
          textContent: `Start ${mode}`,
          onClick: () => { pendingMode = mode; location.hash = toHash('task', { skillId, taskId: t.id }); },
        })),
      ))),
      h('p', {}, h('a', { href: toHash('results', { skillId }), textContent: 'Results' }), ' ', h('a', { href: toHash('hub'), textContent: 'Back to hub' })),
    ];
  },

  task({ skillId, taskId }) {
    const skill = registry.get(skillId);
    const task = registry.getTask(skillId, taskId);
    if (!skill || !task) return views.notFound();
    const host = h('div', { id: 'task-host' });
    (async () => {
      const sitting = await newSitting(pendingMode);
      host.dataset.mode = sitting.mode;
      host.dataset.form = sitting.formId;
      running = runTask({ skill, task, sitting, store, el: host });
      const attempt = await running.done;
      running = null;
      if (!attempt) return;
      await store.save('sitting', { ...sitting, completedAt: new Date().toISOString() });
      location.hash = toHash('results', { skillId });
    })().catch(showError);
    return [h('h1', { textContent: task.label }), host];
  },

  results({ skillId }) {
    const skill = registry.get(skillId);
    if (!skill) return views.notFound();
    const list = h('ol', { id: 'attempts' });
    (async () => {
      const sittings = new Map((await store.list('sitting')).map((s) => [s.id, s]));
      const attempts = (await store.list('taskAttempt')).filter((a) => a.skillId === skillId);
      if (!attempts.length) list.append(h('li', { textContent: 'No attempts saved.' }));
      for (const a of attempts) {
        const s = sittings.get(a.sittingId);
        list.append(h('li', { dataset: { attempt: a.id }, textContent:
          `${a.taskId}: raw ${a.rawScore} of ${a.itemResponses.length}; mode ${s ? s.mode : '?'}, form ${s ? s.formId : '?'}, scoringVersion ${a.scoringVersion}` }));
      }
    })().catch(showError);
    return [
      h('h1', { textContent: `${skill.label}: saved attempts` }),
      h('p', { className: 'small', textContent: 'Developer view. Raw scores only; no interpretation is shown.' }),
      list,
      h('p', {}, h('a', { href: toHash('hub'), textContent: 'Back to hub' })),
    ];
  },

  profile() {
    const pre = h('pre', { id: 'export' });
    store.exportAll().then((b) => { pre.textContent = JSON.stringify(b, null, 2); }).catch(showError);
    return [
      h('h1', { textContent: 'Profile and data' }),
      h('p', { textContent: `Participant code: ${participant.id}` }),
      h('p', { textContent: store.persistent ? 'Saved in this browser.' : 'Not saved: storage is unavailable.' }),
      h('button', { type: 'button', className: 'btn', textContent: 'Delete all data in this browser', onClick: async () => {
        for (const t of ['taskAttempt', 'selfReport', 'sitting', 'participant']) for (const r of await store.list(t)) await store.remove(t, r.id);
        location.hash = toHash('hub');
        location.reload();
      } }),
      pre,
      h('p', {}, h('a', { href: toHash('hub'), textContent: 'Back to hub' })),
    ];
  },

  notFound() {
    return [h('h1', { textContent: 'Page not found' }), h('p', {}, h('a', { href: toHash('hub'), textContent: 'Back to hub' }))];
  },
};

function showError(e) {
  app.append(h('p', { className: 'notice', role: 'alert', textContent: `Error: ${e.message}` }));
  console.error(e);
}

createRouter((route) => {
  if (running) { running.cancel(); running = null; }
  app.replaceChildren(...(views[route.name] || views.notFound)(route.params));
  const heading = app.querySelector('h1');
  if (heading) { heading.tabIndex = -1; heading.focus(); }
});
