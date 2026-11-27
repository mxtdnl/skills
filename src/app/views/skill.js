// Skill page (#/skill/<id>): choose Practice or Assessment, and see the ordered steps of each
// (self-report first, then the tasks) with their status. Steps resume at item level.

import { h, geo, accentOf, formatDate, stateTag, confirmDialog } from '../dom.js';
import { stepsFor } from '../../skills/registry.js';
import { toHash } from '../../core/router.js';
import {
  latestPractice, selfAssessment, sittingState, stepState, stepAllowed, nextStep, newSitting,
  formForSelfAssessment, canStartSelfAssessment, activeProgramme, SELF_WINDOW, sittingsOf,
} from '../progress.js';

export async function skillView(app, { skillId }) {
  const skill = app.getSkill(skillId);
  if (!skill) {
    return {
      title: 'Skill not available',
      nodes: [h('section', { class: 'page wrap' },
        h('h1', { text: 'This skill is not available yet' }),
        h('p', { text: 'Its questions and tasks are still being written.' }),
        h('p', {}, h('a', { href: '#/hub', text: 'Back to your skills' })),
      )],
    };
  }
  const { data } = app;
  const programme = activeProgramme(data, app.getSkill);
  const total = (mode) => stepsFor(skill, mode).reduce((n, s) => n + s.estMinutes, 0);

  const head = h('div', { class: 'banner skill-banner', dataset: accentOf(skill) },
    ...geo([{ shape: 'ring', cls: 'geo-strong', style: { '--geo-size': '12rem', right: '-3rem', top: '-3rem' } }]),
    h('p', { class: 'banner-eyebrow', text: 'Skill' }),
    h('h1', { class: 'banner-title', text: skill.label }),
    h('ul', { class: 'banner-facets' }, ...skill.facets.map((f) => h('li', { text: f.label }))),
  );

  const body = programme
    ? [h('div', { class: 'notice' },
        h('p', { class: 'notice-title', text: 'Programme sitting in progress' }),
        h('p', { text: `You are in programme sitting ${programme.code}. Skills are taken in a fixed order from the hub until it is finished.` }),
        h('p', {}, h('a', { class: 'btn', href: '#/hub', text: 'Go to the sitting' })),
      )]
    : [h('div', { class: 'mode-grid' }, practiceCard(app, skill, total('practice')), assessmentCard(app, skill, total('assessment')))];

  return {
    title: skill.label,
    nodes: [h('section', { class: 'page wrap skill-page', dataset: accentOf(skill) },
      h('nav', { class: 'breadcrumb', attrs: { 'aria-label': 'Breadcrumb' } }, h('a', { href: '#/hub', text: 'Your skills' }), h('span', { attrs: { 'aria-hidden': 'true' }, text: ' / ' }), h('span', { text: skill.label })),
      head,
      ...body,
    )],
  };
}

function stepList(app, sitting, steps, label) {
  const { data } = app;
  return h('ol', { class: 'step-list', attrs: { 'aria-label': label } }, ...steps.map((step) => {
    const state = sitting ? stepState(data, sitting, step) : 'not-started';
    const allowed = sitting && state !== 'complete' && stepAllowed(data, sitting, step, steps, app.getSkill);
    const action = allowed
      ? h('a', { class: 'btn btn-small', href: toHash('run', { sittingId: sitting.id, stepId: step.id }), text: state === 'in-progress' ? 'Continue' : 'Start', attrs: { 'aria-label': `${state === 'in-progress' ? 'Continue' : 'Start'}: ${step.label}` } })
      : null;
    return h('li', { class: `step${state === 'complete' ? ' completed' : ''}${state === 'in-progress' ? ' active' : ''}`, dataset: { step: step.id, state } },
      h('span', { class: 'pip', attrs: { 'aria-hidden': 'true' } }),
      h('span', { class: 'step-name' }, step.label, h('span', { class: 'step-kind small quiet', text: ` ${step.kind === 'selfReport' ? 'Questionnaire' : 'Task'} · about ${step.estMinutes} min` })),
      stateTag(state),
      action,
    );
  }));
}

function practiceCard(app, skill, mins) {
  const { data } = app;
  const steps = stepsFor(skill, 'practice');
  const sitting = latestPractice(data, skill.id);
  const state = sittingState(data, sitting, steps);
  const startNew = async () => {
    const s = newSitting({ participant: data.participant, skillId: skill.id, mode: 'practice' });
    await app.store.save('sitting', s);
    app.go('run', { sittingId: s.id, stepId: steps[0].id });
  };
  let action;
  if (state === 'in-progress') {
    const next = nextStep(data, sitting, steps);
    action = h('a', { class: 'btn btn-accent', href: toHash('run', { sittingId: sitting.id, stepId: next.id }), text: 'Continue practice' });
  } else {
    action = h('button', { type: 'button', class: 'btn btn-accent', text: state === 'complete' ? 'Practise again' : 'Start practice', onClick: startNew });
  }
  const done = sittingsOf(data, skill.id, 'practice').filter((s) => sittingState(data, s, steps) === 'complete').length;
  return h('section', { class: 'card card-top mode-card', dataset: { mode: 'practice' }, attrs: { 'aria-labelledby': 'mode-practice' } },
    h('p', { class: 'eyebrow', text: 'Mode 1' }),
    h('h2', { class: 'card-title', id: 'mode-practice', text: 'Practice' }),
    h('ul', { class: 'plain-list' },
      h('li', { text: 'Practice questions, different from the assessment ones.' }),
      h('li', { text: 'You see straight away whether each answer was right.' }),
      h('li', { text: 'Practise as often as you like. Practice is never recorded as evidence.' }),
    ),
    h('p', { class: 'mode-status' }, stateTag(state), h('span', { class: 'small quiet', text: ` About ${mins} min.${done ? ` Practice rounds finished: ${done}.` : ''}` })),
    sitting && state === 'in-progress' ? stepList(app, sitting, steps, 'Practice steps') : null,
    h('div', { class: 'btn-row' }, action),
  );
}

function assessmentCard(app, skill, mins) {
  const { data } = app;
  const steps = stepsFor(skill, 'assessment');
  const sitting = selfAssessment(data, skill.id);
  const state = sittingState(data, sitting, steps);
  const check = canStartSelfAssessment(data, skill.id);
  let action = null;
  if (!sitting && check.ok) {
    action = h('button', { type: 'button', class: 'btn', text: 'Start assessment', onClick: async () => {
      const ok = await confirmDialog({
        title: `Start the ${skill.label.toLowerCase()} assessment?`,
        body: [
          'This sitting is recorded. You can take it once; after that, assessments are taken in programme sittings with your coach.',
          'You will not see whether answers are right until you have finished every step. You can stop between or during steps and come back later.',
        ],
        confirmLabel: 'Start assessment',
      });
      if (!ok) return;
      const s = newSitting({ participant: data.participant, skillId: skill.id, mode: 'assessment', windowId: SELF_WINDOW, formId: formForSelfAssessment(data, skill.id) });
      await app.store.save('sitting', s);
      app.go('run', { sittingId: s.id, stepId: steps[0].id });
    } });
  } else if (state === 'in-progress') {
    const next = nextStep(data, sitting, steps);
    action = h('a', { class: 'btn', href: toHash('run', { sittingId: sitting.id, stepId: next.id }), text: 'Continue assessment' });
  } else if (state === 'complete') {
    action = h('a', { class: 'btn', href: toHash('results', { skillId: skill.id }), text: 'See your results' });
  }
  return h('section', { class: 'card card-top mode-card', dataset: { mode: 'assessment' }, attrs: { 'aria-labelledby': 'mode-assessment' } },
    h('p', { class: 'eyebrow', text: 'Mode 2' }),
    h('h2', { class: 'card-title', id: 'mode-assessment', text: 'Assessment sitting' }),
    h('ul', { class: 'plain-list' },
      h('li', { text: 'A recorded sitting, for reflection and for discussion with your coach.' }),
      h('li', { text: 'No feedback on answers until you finish every step.' }),
      h('li', { text: 'One recorded sitting per window. Your coach runs the programme sittings.' }),
    ),
    h('p', { class: 'mode-status' }, stateTag(state), h('span', { class: 'small quiet', text: state === 'complete' ? ` Recorded on ${formatDate(sitting.completedAt)}.` : ` About ${mins} min.` })),
    stepList(app, sitting, steps, 'Assessment steps'),
    action ? h('div', { class: 'btn-row' }, action) : null,
  );
}
