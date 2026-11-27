// Skill hub (#/hub): five skill tiles, last activity and the programme sitting entry. While a
// programme sitting is in progress the hub shows the full battery instead, in its fixed order.

import { h, geo, accentOf, formatDate, stateTag, confirmDialog, announce } from '../dom.js';
import { SKILL_CATALOGUE, stepsFor } from '../../skills/registry.js';
import { toHash } from '../../core/router.js';
import {
  lastActivity, modeStatus, activeProgramme, checkProgrammeCode, newProgrammeSittings,
  nextProgrammeStep, sittingState, programmeSittings,
} from '../progress.js';

const minutes = (skill, mode) => stepsFor(skill, mode).reduce((n, s) => n + s.estMinutes, 0);

export async function hubView(app) {
  const { data } = app;
  const programme = activeProgramme(data, app.getSkill);
  const last = lastActivity(data);

  const intro = h('header', { class: 'page-intro' },
    h('p', { class: 'eyebrow', text: programme ? 'Programme sitting' : 'Your skills' }),
    h('h1', { text: programme ? 'Full battery' : 'Choose a skill' }),
    h('p', { class: 'lede', text: programme
      ? 'Work through every skill in the order shown. Your progress is saved after every answer, so you can stop and come back.'
      : 'Pick any skill, in any order. Practise as often as you like; assessment sittings are recorded.' }),
    h('dl', { class: 'meta-list' },
      h('div', {}, h('dt', { text: 'Your code' }), h('dd', { class: 'code-inline', text: data.participant.id })),
      h('div', {}, h('dt', { text: 'Last activity' }), h('dd', { text: last ? formatDate(last) : 'None yet' })),
    ),
  );

  const body = programme ? batteryPanel(app, programme) : [tiles(app), programmeEntry(app)];

  return {
    title: programme ? 'Programme sitting' : 'Your skills',
    nodes: [h('section', { class: 'page wrap geo-field hub' },
      ...geo([
        { shape: 'square', accent: 2, style: { '--geo-size': '24rem', top: '-8rem', right: '-9rem', '--geo-rotate': '22deg' } },
        { shape: 'circle', accent: 4, cls: 'geo-strong', style: { '--geo-size': '16rem', bottom: '-6rem', left: '-6rem' } },
        { shape: 'tri', accent: 6, cls: 'geo-faint', style: { '--geo-size': '12rem', top: '40%', left: '45%' } },
      ]),
      intro,
      ...body,
    )],
  };
}

function tiles(app) {
  const { data } = app;
  const grid = h('div', { class: 'skill-grid' });
  const entries = SKILL_CATALOGUE.map((c) => ({ catalogue: c, skill: app.getSkill(c.id) }));
  if (app.showExample && app.getSkill('_example')) entries.push({ catalogue: null, skill: app.getSkill('_example') });
  const total = entries.length;
  entries.forEach(({ catalogue, skill }, i) => {
    const shapes = geo([{ shape: i % 2 ? 'circle' : 'square' }]);
    const eyebrow = h('span', { class: 'eyebrow', text: catalogue ? `Skill ${i + 1} of ${SKILL_CATALOGUE.length}` : 'Developer example' });
    if (!skill) {
      grid.append(h('div', { class: 'skill-tile locked', dataset: accentOf(catalogue), attrs: { 'aria-disabled': 'true' } },
        ...shapes, eyebrow,
        h('span', { class: 'skill-tile-name', text: catalogue.label }),
        facetList(catalogue.facets),
        h('span', { class: 'skill-tile-desc', text: 'Questions and tasks are being written. Time: to be confirmed.' }),
        h('span', { class: 'skill-tile-status tag', text: 'In preparation' }),
      ));
      return;
    }
    const practice = modeStatus(data, skill, 'practice');
    const assessment = modeStatus(data, skill, 'assessment');
    const cls = ['skill-tile'];
    if (assessment === 'complete') cls.push('completed');
    else if (assessment === 'in-progress' || practice === 'in-progress') cls.push('active');
    grid.append(h('a', { class: cls.join(' '), href: toHash('skill', { skillId: skill.id }), dataset: { ...accentOf(skill), skillId: skill.id } },
      ...shapes, eyebrow,
      h('span', { class: 'skill-tile-name', text: skill.label }),
      facetList(skill.facets),
      h('span', { class: 'skill-tile-desc', text: `About ${minutes(skill, 'assessment')} min for an assessment sitting` }),
      h('span', { class: 'skill-tile-statuses' }, stateTag(practice, 'Practice'), stateTag(assessment, 'Assessment')),
    ));
  });
  return h('section', { class: 'hub-skills', attrs: { 'aria-label': `Skills (${total})` } }, grid);
}

function facetList(facets) {
  return h('ul', { class: 'facet-list' }, ...facets.map((f) => h('li', {}, h('span', { class: 'pip', attrs: { 'aria-hidden': 'true' } }), f.label)));
}

function programmeEntry(app) {
  const error = h('p', { class: 'field-error', id: 'programme-error', attrs: { role: 'alert' } });
  const input = h('input', { type: 'text', id: 'programme-code', class: 'input input-code', autocomplete: 'off', spellcheck: false, attrs: { 'aria-describedby': 'programme-hint programme-error', autocapitalize: 'characters' } });
  const messages = {
    format: 'That is not a sitting code. Codes are letters or numbers, a hyphen and one digit, for example SEP26-1. Check the code your coach gave you.',
    used: 'You have already used this sitting code. Each code is used once.',
    active: 'Finish your current programme sitting first.',
    empty: 'No skills are available yet, so a programme sitting cannot start.',
  };
  const form = h('form', { class: 'stack', onSubmit: async (e) => {
    e.preventDefault();
    const order = app.available().map((s) => s.id);
    const check = checkProgrammeCode(app.data, input.value, order);
    if (!check.ok) {
      error.textContent = messages[check.reason];
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    const labels = order.map((id) => app.getSkill(id).label);
    const ok = await confirmDialog({
      title: `Start programme sitting ${check.code}?`,
      body: [
        `You will take every skill as a recorded assessment, in this order: ${labels.join(', ')}.`,
        'You can stop and come back at any time; your answers are saved as you go. Until you finish, the hub shows only this sitting.',
      ],
      confirmLabel: 'Start the sitting',
    });
    if (!ok) return;
    for (const s of newProgrammeSittings({ participant: app.data.participant, code: check.code, window: check.window, skillOrder: order })) {
      await app.store.save('sitting', s);
    }
    announce(`Programme sitting ${check.code} started.`);
    app.refresh();
  } },
  h('label', { class: 'field-label', attrs: { for: 'programme-code' }, text: 'Sitting code' }),
  h('p', { class: 'field-hint', id: 'programme-hint', text: 'Your coach gives you a code at the start and at the end of your programme, for example SEP26-1.' }),
  h('div', { class: 'inline-form' }, input, h('button', { type: 'submit', class: 'btn', text: 'Start' })),
  error);

  const done = completedProgrammes(app);
  return h('section', { class: 'card card-top programme-entry', dataset: { accent: '1' }, attrs: { 'aria-labelledby': 'programme-title' } },
    h('p', { class: 'eyebrow', text: 'Start or end of programme' }),
    h('h2', { class: 'card-title', id: 'programme-title', text: 'Programme sitting' }),
    h('p', { text: 'At the start and at the end of your programme, your coach will ask you to take every skill in one sitting. Enter the sitting code they give you.' }),
    form,
    done.length ? h('p', { class: 'small quiet', text: `Completed: ${done.join(', ')}.` }) : null,
  );
}

function completedProgrammes(app) {
  const codes = [...new Set(app.data.sittings.filter((s) => s.programme).map((s) => s.programme.code))];
  return codes.filter((c) => programmeSittings(app.data, c).every((s) => s.completedAt));
}

function batteryPanel(app, programme) {
  const { data } = app;
  const next = nextProgrammeStep(data, programme, app.getSkill);
  const list = h('ol', { class: 'battery-list' });
  programme.sittings.forEach((s, i) => {
    const skill = app.getSkill(s.skillId);
    if (!skill) {
      list.append(h('li', { class: 'battery-item' }, h('span', { class: 'battery-name', text: `${i + 1}. ${s.skillId}` }), h('span', { class: 'tag', text: 'Not available in this version' })));
      return;
    }
    const state = sittingState(data, s, stepsFor(skill, 'assessment'));
    const isNext = next && next.sitting.id === s.id;
    list.append(h('li', { class: `battery-item${isNext ? ' active' : ''}${state === 'complete' ? ' completed' : ''}`, dataset: accentOf(skill) },
      h('span', { class: 'battery-num', text: String(i + 1), attrs: { 'aria-hidden': 'true' } }),
      h('span', { class: 'battery-name' }, h('span', { class: 'visually-hidden', text: `${i + 1}. ` }), skill.label),
      h('span', { class: 'battery-time small quiet', text: `About ${minutes(skill, 'assessment')} min` }),
      stateTag(state),
    ));
  });
  return [
    h('div', { class: 'banner battery-banner', dataset: { accent: '1' } },
      h('p', { class: 'banner-eyebrow', text: `Sitting code ${programme.code}` }),
      h('h2', { class: 'banner-title', text: next ? `Next: ${app.getSkill(next.sitting.skillId).label}` : 'All skills complete' }),
      next ? h('a', { class: 'btn btn-on-fill', href: toHash('run', { sittingId: next.sitting.id, stepId: next.step.id }), text: 'Continue' }) : null,
    ),
    h('section', { class: 'card battery', attrs: { 'aria-label': 'Skills in this sitting, in order' } },
      h('p', { class: 'eyebrow', text: 'Fixed order' }),
      list,
      h('p', { class: 'small quiet', text: 'Practice is not available during a programme sitting, so that every student takes the skills in the same way.' }),
    ),
  ];
}
