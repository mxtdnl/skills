// The stub skill's one task: one multiple-choice item per screen. DOM is built with
// createElement and textContent only (audit K-5).
//
// Practice mode gives immediate feedback after each answer; assessment mode gives none. The
// task resumes at the first unanswered item (ctx.resume), and option order comes from
// ctx.rngFor(itemId), so a resumed item shows the same order as before the reload.

const KEYS = 'ABCDEFGH';

/**
 * @param {HTMLElement} el
 * @param {object} ctx  step context from src/skills/runner.js
 * @returns {() => void} cleanup
 */
export function mount(el, ctx) {
  const doc = el.ownerDocument;
  const root = doc.createElement('section');
  root.className = 'task task-pick';
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

  function next() {
    index += 1;
    if (index < items.length) show();
    else ctx.complete();
  }

  function show() {
    const item = items[index];
    const shownAt = ctx.now();
    // The stored response is the original option index, never the screen position.
    const order = ctx.rngFor(item.id).shuffle(item.options.map((_, i) => i));

    const progress = make('p', 'progress-count', `Question ${index + 1} of ${items.length}`);
    const fieldset = make('fieldset', 'task-item');
    fieldset.dataset.item = item.id;
    const legend = make('legend', 'task-prompt', item.prompt);
    const list = make('div', 'choice-list');
    fieldset.append(legend, list);
    const status = make('div', 'task-feedback');
    status.setAttribute('aria-live', 'polite');

    let locked = false;
    order.forEach((optionIndex, position) => {
      const b = make('button', 'choice-card');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.append(make('span', 'choice-key', KEYS[position]), make('span', 'choice-text', item.options[optionIndex]), make('span', 'choice-flag', 'Selected'));
      b.addEventListener('click', () => {
        if (locked) return;
        locked = true;
        b.setAttribute('aria-pressed', 'true');
        ctx.record({ itemId: item.id, response: { choice: optionIndex, position }, shownAt });
        if (ctx.mode !== 'practice') { next(); return; }
        // Practice: show whether the answer was right before moving on.
        const right = optionIndex === item.key;
        for (const other of list.querySelectorAll('.choice-card')) {
          other.classList.add('locked');
          other.setAttribute('aria-disabled', 'true');
        }
        b.classList.add(right ? 'correct' : 'incorrect');
        b.querySelector('.choice-flag').textContent = right ? 'Correct' : 'Not quite';
        const box = make('div', `feedback ${right ? 'correct' : 'incorrect'}`);
        box.append(
          make('p', 'feedback-label', right ? 'Correct' : 'Not quite'),
          make('p', null, right ? 'Well done.' : `The answer is: ${item.options[item.key]}.`),
        );
        const go = make('button', 'btn', index + 1 < items.length ? 'Next question' : 'Finish');
        go.type = 'button';
        go.addEventListener('click', next);
        status.replaceChildren(box, go);
        go.focus();
      });
      list.append(b);
    });
    root.replaceChildren(progress, fieldset, status);
    const first = list.querySelector('button');
    if (first) first.focus();
  }

  if (index < items.length) show();
  else ctx.complete();
  return () => root.remove();
}

/**
 * Number correct, and the proportion correct as the score for facet EX1.
 * Pure: depends only on the attempt's raw responses and the form's items.
 * @param {{ itemResponses: { itemId: string, response: any }[] }} attempt
 * @param {{ id: string, key: number }[]} form
 * @returns {{ rawScore: number, score: { EX1: number | null } }}
 */
export function score(attempt, form) {
  const keys = new Map(form.map((it) => [it.id, it.key]));
  let correct = 0;
  for (const r of attempt.itemResponses) {
    if (keys.has(r.itemId) && r.response && r.response.choice === keys.get(r.itemId)) correct += 1;
  }
  return { rawScore: correct, score: { EX1: form.length ? correct / form.length : null } };
}
