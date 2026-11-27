// CT-T1 Conditional reasoning: selection-task items (content/critical/ct-t1.js). One rule and
// four cards per screen; the student chooses every card that must be turned over, then Next.
//
// Response (one per item): { selected: [original card indices, ascending], order: [original
// indices in screen order] }. Card order comes from ctx.rngFor(itemId), so a resumed item shows
// the same order. Assessment mode gives no feedback; practice mode shows, for every card, whether
// it had to be turned and why, then the item's explanation.
//
// Scoring (docs/SCORING.md, Critical thinking): all-or-nothing per item. An item is correct only
// if the cards chosen are exactly the key, so choosing every card, or none, is never correct
// (audit B-4). Abstract and deontic items are reported as separate sub-scores (audit A-4).

import { maker, firstOpen, choiceCard, setPressed, lockAll, mark, feedbackBox, nextButton, KEYS } from '../common/ui.js';

/**
 * The cards that must be turned, derived from the rule's negations and what each card shows.
 * A case breaks "if [not] P then [not] Q" when its "if" part holds and its "then" part fails, so
 * a card must be turned when its visible side is the "if" part holding or the "then" part failing.
 * @param {{ negation: { antecedent: boolean, consequent: boolean }, cards: { shows: string }[] }} item
 * @returns {number[]}
 */
export function deriveKey(item) {
  const ifHolds = item.negation.antecedent ? 'notP' : 'P';
  const thenFails = item.negation.consequent ? 'Q' : 'notQ';
  return item.cards.map((c, i) => (c.shows === ifHolds || c.shows === thenFails ? i : -1)).filter((i) => i >= 0);
}

/** Why a card must, or need not, be turned (practice feedback). */
export function cardReason(item, index) {
  const shows = item.cards[index].shows;
  const ifHolds = item.negation.antecedent ? 'notP' : 'P';
  const thenFails = item.negation.consequent ? 'Q' : 'notQ';
  if (shows === ifHolds) return 'Turn it. This card meets the "if" part of the rule. If the other side does not meet the "then" part, the rule is broken.';
  if (shows === thenFails) return 'Turn it. This card does not meet the "then" part of the rule. If the other side meets the "if" part, the rule is broken.';
  if (shows === 'P' || shows === 'notP') return 'Leave it. This card does not meet the "if" part, so the rule says nothing about it, whatever is on the other side.';
  return 'Leave it. This card already meets the "then" part, so the rule cannot be broken by it, whatever is on the other side.';
}

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

/**
 * @param {HTMLElement} el
 * @param {object} ctx  step context from src/skills/runner.js
 * @returns {() => void} cleanup
 */
export function mount(el, ctx) {
  const doc = el.ownerDocument;
  const make = maker(doc);
  const root = make('section', 'task task-selection');
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
    const order = ctx.rngFor(item.id).shuffle(item.cards.map((_, i) => i));
    const chosen = new Set();
    const last = index === items.length - 1;

    const progress = make('p', 'progress-count', `Problem ${index + 1} of ${items.length}`);
    const setting = make('p', 'task-setting', item.setting);
    const rule = make('div', 'card card-rail task-rule');
    rule.append(make('p', 'eyebrow', 'Rule'), make('p', 'task-rule-text', item.rule));
    const fieldset = make('fieldset', 'task-item');
    fieldset.dataset.item = item.id;
    const question = item.kind === 'deontic'
      ? 'Which cards must you turn over to find out whether anyone has broken the rule? Choose every card you need, and no others.'
      : 'Which cards must you turn over to find out whether the rule is broken for any of these cards? Choose every card you need, and no others.';
    fieldset.append(make('legend', 'task-prompt', question));
    const list = make('div', 'choice-list choice-grid');
    fieldset.append(list);
    const status = make('div', 'task-feedback');
    status.setAttribute('aria-live', 'polite');
    const error = make('p', 'field-error');
    error.setAttribute('role', 'alert');

    const cards = order.map((cardIndex, position) => {
      const b = choiceCard(make, KEYS[position], item.cards[cardIndex].face);
      b.classList.add('choice-card-face');
      b.dataset.card = String(cardIndex);
      b.addEventListener('click', () => {
        if (b.classList.contains('locked')) return;
        if (chosen.has(cardIndex)) chosen.delete(cardIndex);
        else chosen.add(cardIndex);
        setPressed(b, chosen.has(cardIndex));
        error.textContent = '';
        confirmNone = false;
      });
      list.append(b);
      return { b, cardIndex };
    });

    let confirmNone = false;
    let submitted = false;
    const row = make('div', 'btn-row');
    const submit = make('button', 'btn', ctx.mode === 'practice' ? 'Check' : last ? 'Finish' : 'Next');
    submit.type = 'button';
    row.append(submit);

    submit.addEventListener('click', () => {
      if (submitted) return;
      if (chosen.size === 0 && !confirmNone) {
        confirmNone = true;
        error.textContent = 'You have not chosen any card. If you think no card needs to be turned, choose the button again.';
        return;
      }
      submitted = true;
      const selected = [...chosen].sort((a, b) => a - b);
      ctx.record({ itemId: item.id, response: { selected, order }, shownAt });
      if (ctx.mode !== 'practice') { next(); return; }

      const key = item.key;
      const right = sameSet(selected, key);
      lockAll(list);
      submit.remove();
      error.textContent = '';
      const reasons = make('ul', 'task-reasons');
      for (const { b, cardIndex } of cards) {
        const mustTurn = key.includes(cardIndex);
        const ok = mustTurn === chosen.has(cardIndex);
        mark(b, ok ? 'correct' : 'incorrect', mustTurn ? 'Turn' : 'Leave');
        const li = make('li', null);
        li.append(make('strong', null, `${item.cards[cardIndex].face}: `), doc.createTextNode(cardReason(item, cardIndex)));
        reasons.append(li);
      }
      const box = feedbackBox(make, right, [
        right ? 'You chose exactly the cards that could break the rule.' : 'The cards to turn are the ones that could show the rule being broken.',
        item.explanation,
        reasons,
      ]);
      const go = nextButton(make, last, next, ['Next problem', 'Finish']);
      status.replaceChildren(box, go);
      go.focus();
    });

    root.replaceChildren(progress, setting, rule, fieldset, error, row, status);
    const first = list.querySelector('button');
    if (first) first.focus();
  }

  if (index < items.length) show();
  else ctx.complete();
  return () => root.remove();
}

/**
 * All-or-nothing scoring. Pure: depends only on the raw responses and the form's items.
 * Unanswered items count as incorrect; the denominators are the numbers of items on the form.
 * @param {{ itemResponses: { itemId: string, response: any }[] }} attempt
 * @param {object[]} form
 * @returns {{ rawScore: number, score: { CT1: number | null, abstract: number | null, deontic: number | null } }}
 */
export function score(attempt, form) {
  const latest = new Map();
  for (const r of attempt.itemResponses) latest.set(r.itemId, r.response);
  const tally = { all: [0, 0], abstract: [0, 0], deontic: [0, 0] };
  for (const item of form) {
    const r = latest.get(item.id);
    const selected = r && Array.isArray(r.selected) ? r.selected : null;
    const valid = selected && new Set(selected).size === selected.length && selected.every((i) => Number.isInteger(i) && i >= 0 && i < item.cards.length);
    const right = valid ? sameSet(selected, item.key) : false;
    for (const k of ['all', item.kind]) {
      if (!tally[k]) continue;
      tally[k][1] += 1;
      if (right) tally[k][0] += 1;
    }
  }
  const ratio = ([c, n]) => (n ? c / n : null);
  return { rawScore: tally.all[0], score: { CT1: ratio(tally.all), abstract: ratio(tally.abstract), deontic: ratio(tally.deontic) } };
}
