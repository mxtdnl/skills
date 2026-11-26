// The stub skill's one task: a multiple-choice item per screen. Unstyled (S4 adds the design
// system). DOM is built with createElement and textContent only (audit K-5).

/**
 * @param {HTMLElement} el
 * @param {object} ctx  task context from src/skills/runner.js
 * @returns {() => void} cleanup
 */
export function mount(el, ctx) {
  const doc = el.ownerDocument;
  const root = doc.createElement('section');
  root.className = 'task task-pick';
  root.dataset.task = ctx.taskId;
  el.replaceChildren(root);

  // Option order is shuffled per sitting from the sitting seed, so it can be replayed. The stored
  // response is the original option index, never the screen position.
  const items = ctx.items;
  let index = 0;

  function show() {
    const item = items[index];
    const shownAt = ctx.now();
    const order = ctx.rng.shuffle(item.options.map((_, i) => i));

    const progress = doc.createElement('p');
    progress.className = 'small';
    progress.textContent = `Question ${index + 1} of ${items.length}`;

    const fieldset = doc.createElement('fieldset');
    fieldset.dataset.item = item.id;
    const legend = doc.createElement('legend');
    legend.textContent = item.prompt;
    fieldset.append(legend);

    for (const optionIndex of order) {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'btn choice';
      b.textContent = item.options[optionIndex];
      b.addEventListener('click', () => {
        ctx.record({ itemId: item.id, response: { choice: optionIndex, position: order.indexOf(optionIndex) }, shownAt });
        index += 1;
        if (index < items.length) show();
        else ctx.complete();
      });
      fieldset.append(b);
    }
    root.replaceChildren(progress, fieldset);
    const first = fieldset.querySelector('button');
    if (first) first.focus();
  }

  if (items.length) show();
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
