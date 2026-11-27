// Single-answer multiple-choice task with a scenario, used by CT-T2 (argument and evidence
// evaluation, content/critical/ct-t2.js) and CT-T4 (statistical and base-rate reasoning,
// content/critical/ct-t4.js). One item per screen: the scenario, the question and four options.
// The student selects one option (and may change it), then Next.
//
// Response (one per item): { choice: original option index, position: screen position,
// order: original indices in screen order }. Option order comes from ctx.rngFor(itemId), so
// answering the same screen position every time scores at chance. Assessment mode gives no
// feedback; practice mode marks the key and shows the item's rationale.

import { maker, firstOpen, choiceCard, setPressed, lockAll, mark, feedbackBox, nextButton, KEYS } from '../common/ui.js';

/**
 * Build a task module scoring one facet as the proportion correct.
 * @param {{ facet: string }} options
 * @returns {{ mount: Function, score: Function }}
 */
export function choiceTask({ facet }) {
  /**
   * @param {HTMLElement} el
   * @param {object} ctx  step context from src/skills/runner.js
   */
  function mount(el, ctx) {
    const doc = el.ownerDocument;
    const make = maker(doc);
    const root = make('section', 'task task-choice');
    root.dataset.task = ctx.taskId;
    el.replaceChildren(root);

    const items = ctx.items;
    let index = firstOpen(items, new Set(ctx.resume.map((r) => r.itemId)));

    function next() {
      index += 1;
      if (index < items.length) show();
      else ctx.complete();
    }

    function show() {
      const item = items[index];
      const shownAt = ctx.now();
      const order = ctx.rngFor(item.id).shuffle(item.options.map((_, i) => i));
      const last = index === items.length - 1;
      let chosen = null;

      const progress = make('p', 'progress-count', `Question ${index + 1} of ${items.length}`);
      const scenario = make('div', 'card card-rail task-scenario');
      scenario.append(make('p', null, item.scenario));
      const fieldset = make('fieldset', 'task-item');
      fieldset.dataset.item = item.id;
      fieldset.append(make('legend', 'task-prompt', item.question));
      const list = make('div', 'choice-list');
      fieldset.append(list);
      const error = make('p', 'field-error');
      error.setAttribute('role', 'alert');
      const status = make('div', 'task-feedback');
      status.setAttribute('aria-live', 'polite');

      const cards = order.map((optionIndex, position) => {
        const b = choiceCard(make, KEYS[position], item.options[optionIndex]);
        b.addEventListener('click', () => {
          if (b.classList.contains('locked')) return;
          chosen = { optionIndex, position };
          for (const c of cards) setPressed(c.b, c.optionIndex === optionIndex);
          error.textContent = '';
        });
        list.append(b);
        return { b, optionIndex };
      });

      let submitted = false;
      const row = make('div', 'btn-row');
      const submit = make('button', 'btn', ctx.mode === 'practice' ? 'Check' : last ? 'Finish' : 'Next');
      submit.type = 'button';
      row.append(submit);
      submit.addEventListener('click', () => {
        if (submitted) return;
        if (!chosen) {
          error.textContent = 'Please choose an answer.';
          const first = list.querySelector('button');
          if (first) first.focus();
          return;
        }
        submitted = true;
        ctx.record({ itemId: item.id, response: { choice: chosen.optionIndex, position: chosen.position, order }, shownAt });
        if (ctx.mode !== 'practice') { next(); return; }
        const right = chosen.optionIndex === item.key;
        lockAll(list);
        submit.remove();
        for (const c of cards) {
          if (c.optionIndex === item.key) mark(c.b, 'correct', c.optionIndex === chosen.optionIndex ? 'Correct' : 'Answer');
          else if (c.optionIndex === chosen.optionIndex) mark(c.b, 'incorrect', 'Not quite');
        }
        const box = feedbackBox(make, right, [right ? null : `The best answer is: ${item.options[item.key]}`, item.rationale]);
        const go = nextButton(make, last, next);
        status.replaceChildren(box, go);
        go.focus();
      });

      root.replaceChildren(progress, scenario, fieldset, error, row, status);
      const first = list.querySelector('button');
      if (first) first.focus();
    }

    if (index < items.length) show();
    else ctx.complete();
    return () => root.remove();
  }

  /**
   * Proportion correct. Pure. Unanswered items count as incorrect (the denominator is the number
   * of items on the form); the latest response to an item counts.
   * @param {{ itemResponses: { itemId: string, response: any }[] }} attempt
   * @param {{ id: string, key: number }[]} form
   */
  function score(attempt, form) {
    const latest = new Map();
    for (const r of attempt.itemResponses) latest.set(r.itemId, r.response);
    let correct = 0;
    for (const item of form) {
      const r = latest.get(item.id);
      if (r && Number.isInteger(r.choice) && r.choice === item.key) correct += 1;
    }
    return { rawScore: correct, score: { [facet]: form.length ? correct / form.length : null } };
  }

  return { mount, score };
}
