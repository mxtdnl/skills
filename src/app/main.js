// Application shell (S5): first-run flow, skill hub, skill pages, step runner, results and
// settings. Loaded by index.html as an ES module. See docs/ARCHITECTURE.md, Application shell.
//
// Every render reloads the records from storage, so the page always shows what is saved: a
// reload restores exactly the same screen, and a step resumes at its next unanswered item.

import { LocalStorageAdapter, mountStorageNotice } from '../core/store.js';
import { createRouter, parseHash, toHash } from '../core/router.js';
import { loadSkills, SKILL_MODULES, EXAMPLE_MODULES, SKILL_CATALOGUE } from '../skills/registry.js';
import { APP_VERSION } from '../core/version.js';
import { loadData } from './progress.js';
import { h, confirmDialog } from './dom.js';
import { startView } from './views/start.js';
import { hubView } from './views/hub.js';
import { skillView } from './views/skill.js';
import { runView } from './views/run.js';
import { resultsView } from './views/results.js';
import { settingsView } from './views/settings.js';

const VIEWS = { start: startView, hub: hubView, skill: skillView, run: runView, results: resultsView, settings: settingsView, profile: settingsView };

const store = new LocalStorageAdapter();
// The example (developer stub) skill appears only when the page is opened with ?example. It
// exercises the whole flow until the five skills are built (S6 to S10).
const showExample = new URLSearchParams(window.location.search).has('example');
const registry = await loadSkills([...SKILL_MODULES, ...(showExample ? EXAMPLE_MODULES : [])]);

const main = document.getElementById('app');
const nav = document.getElementById('site-nav');
mountStorageNotice(store, document.getElementById('notices'));
document.getElementById('app-version').textContent = `Version ${APP_VERSION}`;

/** Shared state and helpers passed to every view. */
const app = {
  store,
  registry,
  showExample,
  data: null,
  /** The running step ({ cancel, flush }), or null. */
  running: null,
  /** Skills that can be taken, in the canonical order, then the example skill if shown. */
  available() {
    const list = SKILL_CATALOGUE.map((c) => registry.get(c.id)).filter(Boolean);
    if (showExample && registry.get('_example')) list.push(registry.get('_example'));
    return list;
  },
  getSkill: (id) => registry.get(id),
  go(name, params) { window.location.hash = toHash(name, params); },
  redirect(name, params) {
    const url = new URL(window.location.href);
    url.hash = toHash(name, params);
    window.location.replace(url.href);
  },
  refresh: () => render(parseHash(window.location.hash)),
};

function applySettings() {
  const s = app.data.participant && app.data.participant.settings;
  if (s && s.reducedMotion) document.documentElement.dataset.motion = 'reduce';
  else delete document.documentElement.dataset.motion;
}

let renderToken = 0;

async function render(route) {
  const token = ++renderToken;
  if (app.running) {
    const r = app.running;
    app.running = null;
    await r.cancel();
  }
  app.data = await loadData(store);
  if (token !== renderToken) return;
  applySettings();

  const hasParticipant = Boolean(app.data.participant);
  if (!hasParticipant && route.name !== 'start') return app.redirect('start');
  if (hasParticipant && route.name === 'start' && route.params.step !== 'code') return app.redirect('hub');
  if (route.name === 'task') return app.redirect('skill', { skillId: route.params.skillId });

  nav.hidden = !hasParticipant || route.name === 'start';
  for (const a of nav.querySelectorAll('a')) {
    const current = a.dataset.route === route.name || (a.dataset.route === 'hub' && ['skill', 'run', 'results'].includes(route.name)) || (a.dataset.route === 'settings' && route.name === 'profile');
    if (current) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }

  const view = VIEWS[route.name] || notFoundView;
  let result;
  try {
    result = await view(app, route.params);
  } catch (e) {
    result = errorView(e);
  }
  if (token !== renderToken) return;
  document.title = result.title ? `${result.title} | 5C Skills Assessment` : '5C Skills Assessment';
  main.replaceChildren(...result.nodes);
  window.scrollTo(0, 0);
  if (result.after) await result.after();
  else {
    const heading = main.querySelector('h1');
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }
}

function notFoundView() {
  return {
    title: 'Page not found',
    nodes: [h('section', { class: 'page wrap' },
      h('h1', { text: 'Page not found' }),
      h('p', {}, h('a', { href: '#/hub', text: 'Go to your skills' })),
    )],
  };
}

function errorView(e) {
  console.error(e);
  return {
    title: 'Something went wrong',
    nodes: [h('section', { class: 'page wrap' },
      h('h1', { text: 'Something went wrong' }),
      h('div', { class: 'notice notice-error', attrs: { role: 'alert' } },
        h('p', { text: 'The page could not be shown. Your saved answers are not affected.' }),
        h('p', { class: 'small', text: String(e && e.message ? e.message : e) }),
      ),
      h('p', {}, h('a', { href: '#/hub', text: 'Go to your skills' })),
    )],
  };
}

// Leaving a step through an in-page link asks first. The step is saved either way: every
// response is autosaved, and render() saves the timer state when it stops the step.
document.addEventListener('click', async (e) => {
  const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
  if (!a) return;
  if (a.classList.contains('skip-link')) {
    // The skip link moves focus without touching the hash, which the router owns.
    e.preventDefault();
    main.focus();
    return;
  }
  if (!app.running || a.dataset.noConfirm !== undefined) return;
  e.preventDefault();
  const ok = await confirmDialog({
    title: 'Leave this task?',
    body: ['Your answers so far are saved. You can continue from the same question later.'],
    confirmLabel: 'Save and leave',
    cancelLabel: 'Stay',
  });
  if (ok) window.location.hash = a.getAttribute('href');
});

createRouter(render);
