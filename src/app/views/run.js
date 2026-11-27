// Step runner (#/run/<sittingId>/<stepId>): runs one self-report or task of a sitting, resuming
// an in-progress record at its next unanswered item. Every response is autosaved by the runner
// (src/skills/runner.js). Exit asks for confirmation; the answers so far are already saved.

import { h, accentOf, confirmDialog, announce } from '../dom.js';
import { stepsFor } from '../../skills/registry.js';
import { runStep } from '../../skills/runner.js';
import { toHash } from '../../core/router.js';
import { loadData, recordFor, stepAllowed, nextStep, sittingState, nextProgrammeStep, activeProgramme } from '../progress.js';

export async function runView(app, { sittingId, stepId }) {
  const sitting = await app.store.load('sitting', sittingId);
  if (!sitting || sitting.participantId !== app.data.participant.id) return gone('This sitting was not found.');
  const skill = app.getSkill(sitting.skillId);
  if (!skill) return gone('This skill is not available in this version of the tool.');
  const steps = stepsFor(skill, sitting.mode);
  const index = steps.findIndex((s) => s.id === stepId);
  if (index === -1) return gone('This step was not found.');
  const step = steps[index];
  const { data } = app;
  const existing = recordFor(data, sitting, step);
  const exitTo = sitting.programme ? '#/hub' : toHash('skill', { skillId: skill.id });

  let dots = progressDots(data, sitting, steps, index);
  const header = h('div', { class: 'run-header', dataset: accentOf(skill) },
    h('div', { class: 'run-heading' },
      h('p', { class: 'eyebrow', text: `${skill.label} · ${sitting.mode === 'practice' ? 'Practice' : 'Assessment'}${sitting.programme ? ` · Sitting ${sitting.programme.code}` : ''}` }),
      h('h1', { class: 'run-title', text: step.label }),
      h('p', { class: 'small quiet', text: `Step ${index + 1} of ${steps.length}` }),
    ),
    dots,
  );

  if (existing && existing.status === 'complete') {
    return { title: step.label, nodes: [page(skill, header, completePanel(app, sitting, skill, steps, step))] };
  }
  if (!stepAllowed(data, sitting, step, steps, app.getSkill)) {
    return { title: step.label, nodes: [page(skill, header, h('div', { class: 'notice' },
      h('p', { text: 'Steps in an assessment are taken in order. Please finish the earlier steps first.' }),
      h('p', {}, h('a', { class: 'btn', href: exitTo, text: 'Back' })),
    ))] };
  }

  const stage = h('div', { class: 'run-stage', dataset: accentOf(skill) });
  const saveStatus = h('p', { class: 'save-status micro quiet', attrs: { role: 'status' }, text: existing && existing.status === 'in-progress' ? 'Continuing where you left off. Answers are saved as you go.' : 'Answers are saved as you go.' });
  const exit = h('button', { type: 'button', class: 'btn btn-ghost btn-small', text: 'Save and exit', onClick: async () => {
    const ok = await confirmDialog({
      title: 'Leave this step?',
      body: ['Your answers so far are saved. You can continue from the same question later.'],
      confirmLabel: 'Save and leave',
      cancelLabel: 'Stay',
    });
    if (!ok) return;
    if (app.running) { const r = app.running; app.running = null; await r.cancel(); }
    window.location.hash = exitTo;
  } });
  const multiplier = (app.data.participant.settings && app.data.participant.settings.timeMultiplier) || 1;

  return {
    title: step.label,
    nodes: [page(skill, header, h('div', { class: 'run-bar' }, saveStatus, exit), stage)],
    async after() {
      const handle = runStep({
        skill, step, sitting, store: app.store, el: stage, existing, multiplier,
        onSaveError: () => { saveStatus.textContent = 'Your last answer could not be saved.'; },
      });
      app.running = handle;
      let saved;
      try {
        saved = await handle.done;
      } catch (e) {
        app.running = null;
        stage.replaceChildren(h('div', { class: 'notice notice-error', attrs: { role: 'alert' } }, h('p', { text: `This step could not run: ${e.message}` })));
        return;
      }
      if (app.running === handle) app.running = null;
      if (!saved) return; // stopped: the in-progress record stays saved
      const fresh = await loadData(app.store);
      if (sittingState(fresh, sitting, steps) === 'complete' && !sitting.completedAt) {
        await app.store.save('sitting', { ...sitting, completedAt: new Date().toISOString() });
      }
      app.data = await loadData(app.store);
      stage.replaceChildren(completePanel(app, sitting, skill, steps, step));
      const updated = progressDots(app.data, sitting, steps, index);
      dots.replaceWith(updated);
      dots = updated;
      announce(`${step.label} complete.`);
      const target = stage.querySelector('h2');
      if (target) { target.tabIndex = -1; target.focus(); }
    },
  };
}

function page(skill, ...children) {
  return h('section', { class: 'page wrap run-page', dataset: accentOf(skill) }, ...children);
}

function gone(message) {
  return {
    title: 'Not found',
    nodes: [h('section', { class: 'page wrap' }, h('h1', { text: 'Not found' }), h('p', { text: message }), h('p', {}, h('a', { href: '#/hub', text: 'Back to your skills' })))],
  };
}

function progressDots(data, sitting, steps, index) {
  return h('ol', { class: 'progress-dots', attrs: { 'aria-label': 'Steps' } }, ...steps.map((s, i) => {
    const r = recordFor(data, sitting, s);
    const done = r && r.status === 'complete';
    const li = h('li', { class: done ? 'done' : i === index ? 'active' : '' },
      h('span', { class: 'visually-hidden', text: `Step ${i + 1}, ${s.label}, ${done ? 'complete' : i === index ? 'current' : 'not complete'}` }));
    if (i === index) li.setAttribute('aria-current', 'step');
    return li;
  }));
}

function completePanel(app, sitting, skill, steps, step) {
  const { data } = app;
  const next = nextStep(data, sitting, steps);
  const actions = [];
  let title;
  let text;
  if (next) {
    title = `${step.label}: done`;
    text = sitting.mode === 'practice' ? 'Take the next step now, or come back to it later.' : 'Your answers are recorded. Take the next step now, or stop here and come back later.';
    actions.push(h('a', { class: 'btn', href: toHash('run', { sittingId: sitting.id, stepId: next.id }), text: `Next: ${next.label}` }));
    actions.push(h('a', { class: 'btn btn-ghost', href: sitting.programme ? '#/hub' : toHash('skill', { skillId: skill.id }), text: 'Stop here for now' }));
  } else if (sitting.programme) {
    const programme = activeProgramme(data, app.getSkill);
    const following = programme && nextProgrammeStep(data, programme, app.getSkill);
    title = `${skill.label}: complete`;
    text = following ? `Next in this sitting: ${app.getSkill(following.sitting.skillId).label}.` : 'You have finished every skill in this programme sitting. Thank you.';
    if (following) actions.push(h('a', { class: 'btn', href: toHash('run', { sittingId: following.sitting.id, stepId: following.step.id }), text: `Next: ${app.getSkill(following.sitting.skillId).label}` }));
    actions.push(h('a', { class: following ? 'btn btn-ghost' : 'btn', href: '#/hub', text: following ? 'Stop here for now' : 'Back to your skills' }));
  } else if (sitting.mode === 'practice') {
    title = 'Practice complete';
    text = 'Well done. Practice is not recorded as evidence. You can practise again whenever you like.';
    actions.push(h('a', { class: 'btn', href: toHash('skill', { skillId: skill.id }), text: `Back to ${skill.label}` }));
  } else {
    title = `${skill.label}: assessment complete`;
    text = 'Your assessment sitting is recorded.';
    actions.push(h('a', { class: 'btn', href: toHash('results', { skillId: skill.id }), text: 'See your results' }));
    actions.push(h('a', { class: 'btn btn-ghost', href: '#/hub', text: 'Back to your skills' }));
  }
  return h('div', { class: 'card card-rail step-complete', dataset: accentOf(skill) },
    h('h2', { class: 'card-title', text: title }),
    h('p', { text }),
    h('div', { class: 'btn-row' }, ...actions),
  );
}
