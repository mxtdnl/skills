// Results (#/results/<skillId>): shown only once an assessment sitting of the skill is complete
// (no feedback until the skill is complete). The full results views, with facet scores,
// uncertainty and explanations, are built in S11. Until then this page lists what was recorded.
// It makes no claim about change between sittings (global rule; audit D-3).

import { h, accentOf, formatDate } from '../dom.js';
import { stepsFor } from '../../skills/registry.js';
import { sittingsOf, sittingState, recordFor } from '../progress.js';

export async function resultsView(app, { skillId }) {
  const skill = app.getSkill(skillId);
  const back = h('p', {}, h('a', { href: skill ? `#/skill/${skill.id}` : '#/hub', text: skill ? `Back to ${skill.label}` : 'Back to your skills' }));
  if (!skill) return { title: 'Results', nodes: [h('section', { class: 'page wrap' }, h('h1', { text: 'Results' }), h('p', { text: 'This skill is not available.' }), back)] };
  const steps = stepsFor(skill, 'assessment');
  const done = sittingsOf(app.data, skill.id, 'assessment').filter((s) => sittingState(app.data, s, steps) === 'complete');
  const body = done.length
    ? done.map((s) => h('section', { class: 'card card-rail results-sitting', dataset: accentOf(skill) },
        h('h2', { class: 'card-title', text: s.programme ? `Programme sitting ${s.programme.code}` : 'Your assessment sitting' }),
        h('p', { class: 'small quiet', text: `Finished on ${formatDate(s.completedAt)}` }),
        h('ul', { class: 'plain-list' }, ...steps.map((step) => {
          const r = recordFor(app.data, s, step);
          const raw = r && typeof r.rawScore === 'number' ? ` Raw score: ${r.rawScore}.` : '';
          return h('li', { text: `${step.label}: recorded.${raw}` });
        })),
      ))
    : [h('div', { class: 'notice' }, h('p', { text: 'Results appear here once you have finished an assessment sitting of this skill.' }))];
  return {
    title: `${skill.label} results`,
    nodes: [h('section', { class: 'page wrap results-page', dataset: accentOf(skill) },
      h('p', { class: 'eyebrow', text: 'Results' }),
      h('h1', { text: skill.label }),
      h('div', { class: 'notice notice-warning' },
        h('p', { class: 'notice-title', text: 'Early version' }),
        h('p', { text: 'Detailed results, with what each score means and ideas for what to work on, will be added in a later release. Results do not yet show whether you have improved: that needs evidence from a pilot study first.' }),
      ),
      ...body,
      back,
    )],
  };
}
