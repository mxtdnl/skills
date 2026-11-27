// CT-T3 Calibration and revision (content/critical/ct-t3.js). One two-choice question per
// screen, answered with a confidence rating from 50% ("a guess") to 100% ("certain"). On a
// revision item the student then sees new evidence and may keep or change both.
//
// Responses: { phase: "initial" | "revised", choice: original option index, position: screen
// position, confidence: 50 | 60 | 70 | 80 | 90 | 100 }. A revision item has an initial and a
// revised response; a reload between them resumes at the evidence screen. Option order comes from
// ctx.rngFor(itemId). Assessment mode gives no feedback; practice mode shows the answer and the
// facts after each item, and a summary of accuracy and confidence at the end.
//
// Scoring (docs/SCORING.md, Critical thinking, CT-T3): accuracy, mean confidence,
// overconfidence (mean confidence minus accuracy) and the Brier score, from the initial answers;
// and, from the revision items, the final accuracy and the mean change in the probability given
// to the correct answer.

import { maker, firstOpen, choiceCard, setPressed, lockAll, mark, feedbackBox, nextButton, KEYS } from '../common/ui.js';

export const CONFIDENCE = Object.freeze([50, 60, 70, 80, 90, 100]);
const LABEL = (c) => (c === 50 ? '50% (a guess)' : c === 100 ? '100% (certain)' : `${c}%`);
const validResponse = (r) => r && (r.choice === 0 || r.choice === 1) && CONFIDENCE.includes(r.confidence);

/** Latest valid response per item and phase: Map<itemId, { initial?, revised? }>. */
export function phases(responses) {
  const out = new Map();
  for (const r of responses) {
    const v = r.response;
    if (!v || (v.phase !== 'initial' && v.phase !== 'revised')) continue;
    const entry = out.get(r.itemId) || {};
    entry[v.phase] = v;
    out.set(r.itemId, entry);
  }
  return out;
}

/**
 * @param {HTMLElement} el
 * @param {object} ctx  step context from src/skills/runner.js
 */
export function mount(el, ctx) {
  const doc = el.ownerDocument;
  const make = maker(doc);
  const root = make('section', 'task task-calibration');
  root.dataset.task = ctx.taskId;
  el.replaceChildren(root);

  const items = ctx.items;
  const state = phases(ctx.resume);
  const finished = (item) => {
    const s = state.get(item.id);
    return Boolean(s && s.initial && (!item.revision || s.revised));
  };
  let index = firstOpen(items, new Set(items.filter(finished).map((it) => it.id)));

  function next() {
    index += 1;
    if (index < items.length) show();
    else if (ctx.mode === 'practice') summary();
    else ctx.complete();
  }

  function show() {
    const item = items[index];
    const s = state.get(item.id) || {};
    const phase = s.initial ? 'revised' : 'initial';
    const before = s.initial || null;
    const shownAt = ctx.now();
    const order = ctx.rngFor(item.id).shuffle([0, 1]);
    const last = index === items.length - 1;
    let choice = phase === 'revised' ? before.choice : null;
    let confidence = phase === 'revised' ? before.confidence : null;

    const nodes = [make('p', 'progress-count', `Question ${index + 1} of ${items.length}`)];
    if (phase === 'revised') {
      const ev = make('div', 'notice task-evidence');
      ev.append(make('p', 'notice-title', 'New information'), make('p', null, item.revision.evidence));
      nodes.push(ev, make('p', 'lede', `Your first answer was "${item.options[before.choice]}", with ${before.confidence}% confidence. You may keep or change your answer and your confidence.`));
    }

    const form = make('form', 'task-form');
    form.noValidate = true;
    form.dataset.item = item.id;
    const answerSet = make('fieldset', 'task-item');
    answerSet.append(make('legend', 'task-prompt', item.prompt));
    const list = make('div', 'choice-list');
    answerSet.append(list);
    const cards = order.map((optionIndex, position) => {
      const b = choiceCard(make, KEYS[position], item.options[optionIndex]);
      setPressed(b, choice === optionIndex);
      b.addEventListener('click', () => {
        if (b.classList.contains('locked')) return;
        choice = optionIndex;
        for (const c of cards) setPressed(c.b, c.optionIndex === optionIndex);
        error.textContent = '';
      });
      list.append(b);
      return { b, optionIndex, position };
    });

    const conf = make('fieldset', 'likert task-confidence');
    conf.style.setProperty('--likert-points', String(CONFIDENCE.length));
    conf.append(make('legend', 'likert-prompt', 'How sure are you that your answer is right?'));
    const scale = make('div', 'likert-scale');
    for (const c of CONFIDENCE) {
      const option = make('label', 'likert-option');
      const input = doc.createElement('input');
      input.type = 'radio';
      input.name = `conf-${item.id}-${phase}`;
      input.value = String(c);
      if (confidence === c) input.checked = true;
      input.addEventListener('change', () => { if (input.checked) { confidence = c; error.textContent = ''; } });
      option.append(input, make('span', 'likert-label', LABEL(c)));
      scale.append(option);
    }
    conf.append(scale);

    const error = make('p', 'field-error');
    error.setAttribute('role', 'alert');
    const status = make('div', 'task-feedback');
    status.setAttribute('aria-live', 'polite');
    const row = make('div', 'btn-row');
    const willReview = item.revision && phase === 'initial';
    const submit = make('button', 'btn', ctx.mode === 'practice' && !willReview ? 'Check' : last && !willReview ? 'Finish' : 'Next');
    submit.type = 'submit';
    row.append(submit);
    form.append(answerSet, conf, error, row);

    let submitted = false;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (submitted) return;
      if (choice === null || confidence === null) {
        error.textContent = choice === null && confidence === null
          ? 'Please choose an answer and how sure you are.'
          : choice === null ? 'Please choose an answer.' : 'Please choose how sure you are.';
        const target = choice === null ? list.querySelector('button') : scale.querySelector('input');
        if (target) target.focus();
        return;
      }
      submitted = true;
      const position = cards.find((c) => c.optionIndex === choice).position;
      const response = { phase, choice, position, confidence };
      state.set(item.id, { ...s, [phase]: response });
      ctx.record({ itemId: item.id, response, shownAt });
      if (willReview) { show(); return; }
      if (ctx.mode !== 'practice') { next(); return; }

      const right = choice === item.key;
      lockAll(list);
      for (const input of scale.querySelectorAll('input')) input.disabled = true;
      submit.remove();
      for (const c of cards) {
        if (c.optionIndex === item.key) mark(c.b, 'correct', c.optionIndex === choice ? 'Correct' : 'Answer');
        else if (c.optionIndex === choice) mark(c.b, 'incorrect', 'Not quite');
      }
      const box = feedbackBox(make, right, [
        `The answer is: ${item.options[item.key]}. ${item.facts}`,
        right
          ? (confidence < 70 ? 'You were right but not very sure. With practice, you can learn when to trust your knowledge.' : null)
          : (confidence >= 80 ? `You were ${confidence}% sure of an answer that was wrong. When you are not certain, a lower rating is more accurate.` : null),
      ]);
      const go = nextButton(make, last, next, ['Next question', 'See summary']);
      status.replaceChildren(box, go);
      go.focus();
    });

    nodes.push(form, status);
    root.replaceChildren(...nodes);
    const focus = list.querySelector('[aria-pressed="true"]') || list.querySelector('button');
    if (focus) focus.focus();
  }

  // Practice only: how accuracy and confidence compare over the items just answered.
  function summary() {
    const result = score({ itemResponses: [...state.entries()].flatMap(([itemId, s]) => ['initial', 'revised'].filter((p) => s[p]).map((p) => ({ itemId, response: s[p] }))) }, items).score;
    const box = make('div', 'card card-top task-summary');
    box.append(make('h2', null, 'How sure you were, and how often you were right'));
    if (result.accuracy !== null) {
      box.append(
        make('p', null, `You answered ${Math.round(result.accuracy * 100)}% of the questions correctly at first, and your average confidence was ${Math.round(result.meanConfidence * 100)}%.`),
        make('p', null, result.overconfidence > 0.05
          ? 'Your confidence was higher than your accuracy: you were more sure than your answers justified.'
          : result.overconfidence < -0.05
            ? 'Your confidence was lower than your accuracy: you knew more than you thought.'
            : 'Your confidence was close to your accuracy.'),
        make('p', 'small quiet', 'This is practice: it is not stored as a result. A handful of questions says little; the point is to notice how your confidence and your accuracy compare.'),
      );
    }
    const done = nextButton(make, true, () => ctx.complete());
    root.replaceChildren(box, done);
    done.focus();
  }

  if (index < items.length) show();
  else ctx.complete();
  return () => root.remove();
}

/**
 * Calibration indices. Pure: depends only on the raw responses and the form's items.
 * Uses the latest valid response of each phase per item. Indices from the initial answers are
 * null when fewer than half of the form's items have a valid initial answer.
 * @param {{ itemResponses: { itemId: string, response: any }[] }} attempt
 * @param {{ id: string, key: number, revision: object | null }[]} form
 */
export function score(attempt, form) {
  const state = phases(attempt.itemResponses);
  // The probability a response gives to the correct answer.
  const pCorrect = (r, item) => (r.choice === item.key ? r.confidence / 100 : 1 - r.confidence / 100);
  let n = 0; let correct = 0; let conf = 0; let brier = 0;
  let rn = 0; let rCorrect = 0; let gain = 0;
  for (const item of form) {
    const s = state.get(item.id) || {};
    const first = validResponse(s.initial) ? s.initial : null;
    if (first) {
      const o = first.choice === item.key ? 1 : 0;
      const c = first.confidence / 100;
      n += 1; correct += o; conf += c; brier += (c - o) ** 2;
    }
    if (item.revision && first && validResponse(s.revised)) {
      rn += 1;
      if (s.revised.choice === item.key) rCorrect += 1;
      gain += pCorrect(s.revised, item) - pCorrect(first, item);
    }
  }
  const enough = n > 0 && n >= Math.ceil(form.length / 2);
  const accuracy = enough ? correct / n : null;
  const meanConfidence = enough ? conf / n : null;
  const b = enough ? brier / n : null;
  return {
    rawScore: correct,
    score: {
      CT3: b === null ? null : 1 - b,
      accuracy,
      meanConfidence,
      overconfidence: enough ? meanConfidence - accuracy : null,
      brier: b,
      answered: n,
      revisionAccuracy: rn ? rCorrect / rn : null,
      revisionGain: rn ? gain / rn : null,
    },
  };
}
