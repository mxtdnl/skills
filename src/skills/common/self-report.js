// Self-report component shared by the five skills (S6). One facet per screen, each statement a
// five-point agreement scale built from the Likert radio group (styles/components.css), with
// every point labelled. Progress is shown within the skill ("Part 2 of 3"). At the end of the
// programme a final screen of retrospective items ("Looking back...") is added by the runner.
//
// Every answer, and every change of answer, is recorded at once (ctx.record), so a reload loses
// nothing: the step resumes at the first screen with an unanswered statement, with earlier
// answers filled in. The latest answer to each statement counts.
//
// Response-quality indicators are computed in scoring and kept for the coach view. Nothing
// here comments on how a student answers (audit A-9, F-4). DOM is built with createElement and
// textContent only (audit K-5).

import { AGREEMENT_SCALE, screensOf, latestResponses } from './self-report-score.js';

const INTRO = 'Read each statement and choose how much you agree. There are no right or wrong answers. Think about how you usually act now, not how you would like to act.';
const RETRO_INTRO = 'Think back to the start of the programme. For each statement, choose how much you agree.';

/**
 * @param {HTMLElement} el
 * @param {object} ctx  step context from src/skills/runner.js
 * @returns {() => void} cleanup
 */
export function mount(el, ctx) {
  const doc = el.ownerDocument;
  const root = doc.createElement('section');
  root.className = 'task task-self-report';
  root.dataset.task = ctx.taskId;
  el.replaceChildren(root);

  const make = (tag, className, text) => {
    const n = doc.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  const screens = screensOf(ctx.items);
  const answers = new Map();
  for (const [id, r] of latestResponses(ctx.resume)) if (Number.isInteger(r.response)) answers.set(id, r.response);
  const complete = (s) => s.items.every((it) => answers.has(it.id));
  let index = screens.findIndex((s) => !complete(s));
  if (index === -1) { ctx.complete(); return () => root.remove(); }

  function show() {
    const screen = screens[index];
    const shownAt = ctx.now();
    const last = index === screens.length - 1;

    const progress = make('p', 'progress-count', `Part ${index + 1} of ${screens.length}`);
    const intro = make('p', 'lede', screen.retrospective ? RETRO_INTRO : INTRO);
    const form = make('form', 'task-item');
    form.noValidate = true;

    for (const item of screen.items) {
      const fieldset = make('fieldset', 'likert');
      fieldset.dataset.item = item.id;
      fieldset.append(make('legend', 'likert-prompt', item.text));
      const scale = make('div', 'likert-scale');
      AGREEMENT_SCALE.forEach((label, i) => {
        const option = make('label', 'likert-option');
        const input = doc.createElement('input');
        input.type = 'radio';
        input.name = `sr-${item.id}`;
        input.value = String(i + 1);
        if (answers.get(item.id) === i + 1) input.checked = true;
        input.addEventListener('change', () => {
          if (!input.checked) return;
          answers.set(item.id, i + 1);
          ctx.record({ itemId: item.id, response: i + 1, shownAt });
          if (error.textContent && screen.items.every((it) => answers.has(it.id))) error.textContent = '';
        });
        option.append(input, make('span', 'likert-label', label));
        scale.append(option);
      });
      fieldset.append(scale);
      form.append(fieldset);
    }

    const error = make('p', 'field-error');
    error.setAttribute('role', 'alert');
    const row = make('div', 'btn-row');
    if (index > 0) {
      const back = make('button', 'btn btn-ghost', 'Back');
      back.type = 'button';
      back.addEventListener('click', () => { index -= 1; show(); });
      row.append(back);
    }
    const submit = make('button', 'btn', last ? 'Finish' : 'Next');
    submit.type = 'submit';
    row.append(submit);
    form.append(error, row);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const open = screen.items.filter((it) => !answers.has(it.id));
      if (open.length) {
        error.textContent = open.length === 1
          ? 'Please choose an answer for the statement that is not answered yet.'
          : `Please choose an answer for the ${open.length} statements that are not answered yet.`;
        const first = form.querySelector(`fieldset[data-item="${open[0].id}"] input`);
        if (first) first.focus();
        return;
      }
      if (last) { ctx.complete(); return; }
      index += 1;
      show();
    });

    root.replaceChildren(progress, intro, form);
    const firstOpen = screen.items.find((it) => !answers.has(it.id)) || screen.items[0];
    const focus = form.querySelector(`fieldset[data-item="${firstOpen.id}"] input:checked`) || form.querySelector(`fieldset[data-item="${firstOpen.id}"] input`);
    if (focus) focus.focus();
  }

  show();
  return () => root.remove();
}
