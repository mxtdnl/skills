// The stub skill's self-report: one five-point agreement item per screen. It exists to
// exercise the self-report step of the platform (ordering, autosave, resume). It measures
// nothing. DOM is built with createElement and textContent only (audit K-5).

const SCALE = ['Strongly disagree', 'Disagree', 'Neither agree nor disagree', 'Agree', 'Strongly agree'];

/**
 * @param {HTMLElement} el
 * @param {object} ctx  step context from src/skills/runner.js
 * @returns {() => void} cleanup
 */
export function mount(el, ctx) {
  const doc = el.ownerDocument;
  const root = doc.createElement('section');
  root.className = 'task task-rate';
  root.dataset.task = ctx.taskId;
  el.replaceChildren(root);

  const items = ctx.items;
  const answered = new Set(ctx.resume.map((r) => r.itemId));
  let index = items.findIndex((it) => !answered.has(it.id));
  if (index === -1) index = items.length;

  const make = (tag, className, text) => {
    const n = doc.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  };

  function show() {
    const item = items[index];
    const shownAt = ctx.now();
    const progress = make('p', 'progress-count', `Statement ${index + 1} of ${items.length}`);
    const form = make('form', 'task-item');
    const fieldset = make('fieldset', 'likert');
    fieldset.dataset.item = item.id;
    fieldset.append(make('legend', 'likert-prompt', item.text));
    const scale = make('div', 'likert-scale');
    SCALE.forEach((label, i) => {
      const option = make('label', 'likert-option');
      const input = doc.createElement('input');
      input.type = 'radio';
      input.name = `rate-${item.id}`;
      input.value = String(i + 1);
      input.required = true;
      option.append(input, make('span', 'likert-label', label));
      scale.append(option);
    });
    fieldset.append(scale);
    const submit = make('button', 'btn', index + 1 < items.length ? 'Next' : 'Finish');
    submit.type = 'submit';
    const row = make('div', 'btn-row');
    row.append(submit);
    form.append(fieldset, row);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const chosen = form.querySelector('input:checked');
      if (!chosen) return;
      ctx.record({ itemId: item.id, response: Number(chosen.value), shownAt });
      index += 1;
      if (index < items.length) show();
      else ctx.complete();
    });
    root.replaceChildren(progress, form);
    const first = form.querySelector('input');
    if (first) first.focus();
  }

  if (index < items.length) show();
  else ctx.complete();
  return () => root.remove();
}

/**
 * Mean rating (1 to 5) as the score for facet EX1. Pure.
 * @param {{ responses: { itemId: string, response: any }[] }} selfReport
 * @param {{ id: string }[]} form
 * @returns {{ score: { EX1: number | null } }}
 */
export function score(selfReport, form) {
  const ids = new Set(form.map((it) => it.id));
  const values = selfReport.responses.filter((r) => ids.has(r.itemId) && Number.isInteger(r.response) && r.response >= 1 && r.response <= 5).map((r) => r.response);
  return { score: { EX1: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null } };
}
