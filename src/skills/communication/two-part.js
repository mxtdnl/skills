// A screen with task material and two single-choice questions, one item per screen, used by
// CM-T1 "Which is clearer?" (src/skills/communication/clearer.js) and CM-T2 "Spot the problem"
// (src/skills/communication/spot.js). The student answers both questions (and may change either),
// then Next. Both answers are recorded together as one response.
//
// Assessment mode gives no feedback. Practice mode marks the right option in each question and
// shows the item's explanation of the key. DOM is built with createElement and textContent only
// (audit K-5), through src/skills/common/ui.js.

import { maker, firstOpen, choiceCard, setPressed, lockAll, mark, feedbackBox, nextButton } from '../common/ui.js';

/**
 * @typedef {object} Part
 * @property {string} name                 response field, e.g. 'version'
 * @property {string} legend               the question
 * @property {{ value: *, key: string, text: string }[]} options  in screen order
 * @property {*} answer                    the correct value
 * @property {string} missing              error message when unanswered
 */

/**
 * @param {object} spec
 * @param {string} spec.className    class of the task section, e.g. 'task-clearer'
 * @param {string} spec.noun         'Pair' or 'Passage', for the progress text
 * @param {(item: object, make: Function, ctx: object) => { material: Node[], parts: [Part, Part] }} spec.screen
 * @param {(item: object, chosen: Object<string, { value: *, position: number }>, parts: Part[]) => object} spec.response
 * @param {(item: object, chosen: Object<string, { value: * }>, make: Function) => (string | Node | null)[]} spec.explain
 *   practice feedback paragraphs (corrections, then the rationale)
 * @param {string | null} [spec.instruction]  shown above the first screen
 * @returns {(el: HTMLElement, ctx: object) => () => void} mount
 */
export function twoPartTask({ className, noun, screen, response, explain, instruction = null }) {
  return function mount(el, ctx) {
    const doc = el.ownerDocument;
    const make = maker(doc);
    const root = make('section', `task ${className}`);
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
      const last = index === items.length - 1;
      const { material, parts } = screen(item, make, ctx);
      /** @type {Object<string, { value: *, position: number }>} */
      const chosen = {};

      const progress = make('p', 'progress-count', `${noun} ${index + 1} of ${items.length}`);
      const intro = instruction ? make('p', 'lede task-instruction', instruction) : null;
      const error = make('p', 'field-error');
      error.setAttribute('role', 'alert');
      const status = make('div', 'task-feedback');
      status.setAttribute('aria-live', 'polite');

      const groups = parts.map((part) => {
        const fieldset = make('fieldset', 'task-item task-part');
        fieldset.dataset.item = item.id;
        fieldset.dataset.part = part.name;
        fieldset.append(make('legend', 'task-prompt', part.legend));
        const list = make('div', 'choice-list');
        fieldset.append(list);
        const cards = part.options.map((opt, position) => {
          const b = choiceCard(make, opt.key, opt.text);
          b.addEventListener('click', () => {
            if (b.classList.contains('locked')) return;
            chosen[part.name] = { value: opt.value, position };
            for (const c of cards) setPressed(c.b, c.value === opt.value);
            error.textContent = '';
          });
          list.append(b);
          return { b, value: opt.value };
        });
        return { part, fieldset, list, cards };
      });

      let submitted = false;
      const row = make('div', 'btn-row');
      const submit = make('button', 'btn', ctx.mode === 'practice' ? 'Check' : last ? 'Finish' : 'Next');
      submit.type = 'button';
      row.append(submit);
      submit.addEventListener('click', () => {
        if (submitted) return;
        const open = groups.find((g) => !chosen[g.part.name]);
        if (open) {
          error.textContent = open.part.missing;
          const first = open.list.querySelector('button');
          if (first) first.focus();
          return;
        }
        submitted = true;
        ctx.record({ itemId: item.id, response: response(item, chosen, parts), shownAt });
        if (ctx.mode !== 'practice') { next(); return; }
        let right = true;
        for (const g of groups) {
          lockAll(g.list);
          const mine = chosen[g.part.name].value;
          if (mine !== g.part.answer) right = false;
          for (const c of g.cards) {
            if (c.value === g.part.answer) mark(c.b, 'correct', c.value === mine ? 'Correct' : 'Answer');
            else if (c.value === mine) mark(c.b, 'incorrect', 'Not quite');
          }
        }
        submit.remove();
        const box = feedbackBox(make, right, explain(item, chosen, make));
        const go = nextButton(make, last, next, [`Next ${noun.toLowerCase()}`, 'Finish']);
        status.replaceChildren(box, go);
        go.focus();
      });

      root.replaceChildren(...[progress, intro, ...material, ...groups.map((g) => g.fieldset), error, row, status].filter(Boolean));
      const first = groups[0].list.querySelector('button');
      if (first) first.focus();
    }

    if (index < items.length) show();
    else ctx.complete();
    return () => root.remove();
  };
}

/** The context line above the material: who is writing to whom. */
export function contextCard(make, eyebrow, text) {
  const card = make('div', 'card card-rail task-scenario task-context');
  card.append(make('p', 'eyebrow', eyebrow), make('p', null, text));
  return card;
}
