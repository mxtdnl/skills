// CM-T3 Rewrite (content/communication/cm-t3.js). One passage per sitting, untimed.
//
//   1. Write: who the reader is, what the rewrite must achieve, the original passage, and a text
//      box. "Copy the original into the box" lets the student edit the original instead of writing
//      from nothing, which keeps the English production load low (audit E-1). Spelling and grammar
//      are not marked, and the screen says so.
//   2. Check: the student's rewrite, and the five-point checklist (RUBRIC), each point answered Yes,
//      Partly or Not yet. Back returns to the text.
//   3. Practice only: an example rewrite with a note on each checklist point.
//
// Response (one item): { text, final, stage: 'write' | 'check', selfCheck: { <rubric id>: 'yes' |
// 'partly' | 'no' } , copiedOriginal }. Drafts (final false) are recorded as the student writes and
// answers, so a reload resumes with the text and answers as they were; the latest response counts.
// Nothing is scored automatically: src/skills/communication/score.js scoreRewrite returns a null
// score and the coach-scorable flag.

import { maker } from '../common/ui.js';
import { scoreRewrite } from './score.js';
import { RUBRIC, SELF_CHECK } from '../../../content/communication/cm-t3.js';
import { contextCard } from './two-part.js';

/** A draft is saved this long after the last change to the text. */
const DRAFT_DELAY_MS = 1500;

const answerLabel = (value) => (SELF_CHECK.find((o) => o.value === value) || { label: 'No answer' }).label;

/**
 * @param {HTMLElement} el
 * @param {object} ctx  step context from src/skills/runner.js
 */
export function mount(el, ctx) {
  const doc = el.ownerDocument;
  const make = maker(doc);
  const root = make('section', 'task task-rewrite');
  root.dataset.task = ctx.taskId;
  el.replaceChildren(root);

  // The item: the one already answered, else one practice item chosen by the sitting's seed, or
  // the form's only item (as the creativity idea lists do).
  const answered = [...ctx.resume].reverse().find((r) => ctx.items.some((it) => it.id === r.itemId));
  const item = answered
    ? ctx.items.find((it) => it.id === answered.itemId)
    : ctx.items[ctx.mode === 'practice' ? ctx.rng.int(ctx.items.length) : 0];
  const last = answered && answered.response && typeof answered.response === 'object' ? answered.response : {};
  let text = typeof last.text === 'string' ? last.text : '';
  let stage = last.stage === 'check' ? 'check' : 'write';
  const selfCheck = { ...(last.selfCheck && typeof last.selfCheck === 'object' ? last.selfCheck : {}) };
  let copiedOriginal = last.copiedOriginal === true;
  let finished = last.final === true;
  let savedText = text;
  const shownAt = ctx.now();

  let draftTimer = null;
  function save(final = false) {
    clearTimeout(draftTimer);
    draftTimer = null;
    savedText = text;
    return ctx.record({ itemId: item.id, response: { text, final, stage, selfCheck: { ...selfCheck }, copiedOriginal }, shownAt });
  }
  const scheduleDraft = () => { clearTimeout(draftTimer); draftTimer = setTimeout(() => save(), DRAFT_DELAY_MS); };

  function header() {
    const ctxCard = contextCard(make, 'The reader', item.reader);
    ctxCard.append(make('p', 'task-goal', item.goal));
    return ctxCard;
  }

  function original() {
    const card = make('div', 'card task-passage');
    card.append(make('p', 'eyebrow', 'The original'), make('p', null, item.passage));
    return card;
  }

  // ------------------------------------------------------------ 1. write

  function writeScreen() {
    const intro = make('p', 'lede', 'Rewrite this message so that the reader understands it quickly and easily. Keep the same facts; you may change the order, the words and the tone.');
    const note = make('p', 'small quiet', 'Spelling and grammar are not marked. You can start from the original text and change it, or write your own.');

    const field = make('div', 'task-rewrite-field');
    const label = make('label', 'field-label', 'Your rewrite');
    label.htmlFor = `rewrite-${item.id}`;
    const area = make('textarea', 'input task-rewrite-input');
    area.id = `rewrite-${item.id}`;
    area.rows = 9;
    area.spellcheck = true;
    area.value = text;
    const copy = make('button', 'btn btn-ghost btn-small', 'Copy the original into the box');
    copy.type = 'button';
    copy.hidden = text.trim().length > 0;
    field.append(label, area, copy);

    const error = make('p', 'field-error');
    error.setAttribute('role', 'alert');
    area.setAttribute('aria-describedby', `rewrite-error-${item.id}`);
    error.id = `rewrite-error-${item.id}`;

    area.addEventListener('input', () => {
      text = area.value;
      copy.hidden = text.trim().length > 0;
      error.textContent = '';
      scheduleDraft();
    });
    copy.addEventListener('click', () => {
      area.value = item.passage;
      text = item.passage;
      copiedOriginal = true;
      copy.hidden = true;
      save();
      area.focus();
    });

    const row = make('div', 'btn-row');
    const next = make('button', 'btn', 'Next: check your rewrite');
    next.type = 'button';
    next.addEventListener('click', () => {
      if (!text.trim()) {
        error.textContent = 'Please write your rewrite in the box.';
        area.setAttribute('aria-invalid', 'true');
        area.focus();
        return;
      }
      area.removeAttribute('aria-invalid');
      stage = 'check';
      save();
      render();
    });
    row.append(next);

    root.replaceChildren(header(), intro, original(), field, note, error, row);
    area.focus();
  }

  // ------------------------------------------------------------ 2. check

  function checkScreen() {
    const mine = make('div', 'card card-top task-passage task-rewrite-text');
    mine.append(make('p', 'eyebrow', 'Your rewrite'), make('p', null, text));
    const intro = make('p', 'lede', 'Read your rewrite again. For each point, choose the answer that fits best. This is for you: your answers here are not marked.');

    const form = make('form', 'task-form task-self-check');
    form.noValidate = true;
    for (const point of RUBRIC) {
      const fieldset = make('fieldset', 'likert likert-compact');
      fieldset.dataset.item = point.id;
      fieldset.style.setProperty('--likert-points', String(SELF_CHECK.length));
      fieldset.append(make('legend', 'likert-prompt', point.text));
      const scale = make('div', 'likert-scale');
      for (const opt of SELF_CHECK) {
        const option = make('label', 'likert-option');
        const input = doc.createElement('input');
        input.type = 'radio';
        input.name = `check-${item.id}-${point.id}`;
        input.value = opt.value;
        if (selfCheck[point.id] === opt.value) input.checked = true;
        input.addEventListener('change', () => {
          if (!input.checked) return;
          selfCheck[point.id] = opt.value;
          error.textContent = '';
          save();
        });
        option.append(input, make('span', 'likert-label', opt.label));
        scale.append(option);
      }
      fieldset.append(scale);
      form.append(fieldset);
    }
    const error = make('p', 'field-error');
    error.setAttribute('role', 'alert');
    const row = make('div', 'btn-row');
    const back = make('button', 'btn btn-ghost', 'Back to your rewrite');
    back.type = 'button';
    back.addEventListener('click', () => { stage = 'write'; save(); render(); });
    const submit = make('button', 'btn', 'Finish');
    submit.type = 'submit';
    row.append(back, submit);
    form.append(error, row);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const open = RUBRIC.find((p) => !selfCheck[p.id]);
      if (open) {
        error.textContent = 'Please answer every point.';
        const input = form.querySelector(`fieldset[data-item="${open.id}"] input`);
        if (input) input.focus();
        return;
      }
      finished = true;
      save(true);
      if (ctx.mode === 'practice') feedback();
      else ctx.complete();
    });

    root.replaceChildren(header(), mine, intro, form);
    const first = form.querySelector('input');
    if (first) first.focus();
  }

  // ------------------------------------------------------------ 3. practice feedback

  function feedback() {
    const box = make('div', 'card card-top task-summary task-rewrite-feedback');
    box.append(make('h2', null, 'An example rewrite'));
    box.append(make('p', 'small quiet', 'There are many good ways to rewrite this message. This is one of them, not the only right answer.'));
    const model = make('div', 'card task-passage');
    model.append(make('p', null, item.model));
    box.append(model);
    box.append(make('h3', 'task-ideas-subhead', 'The five points'));
    const list = make('ol', 'task-reasons task-rubric-notes');
    for (const point of RUBRIC) {
      const li = make('li');
      li.append(make('strong', null, point.text), make('span', 'tag', `You said: ${answerLabel(selfCheck[point.id])}`));
      li.append(make('p', null, item.notes[point.id]));
      list.append(li);
    }
    box.append(list);
    const tip = make('div', 'notice');
    tip.append(make('p', 'notice-title', 'Next time'), make('p', null, 'Compare your rewrite with the example, point by point. Where you answered "Partly" or "Not yet", look at how the example deals with that point.'));
    box.append(tip);
    box.append(make('p', 'small quiet', 'This is practice: it is not stored as a result. Your rewrite is not scored automatically.'));
    const done = make('button', 'btn', 'Finish');
    done.type = 'button';
    done.addEventListener('click', () => ctx.complete());
    const yours = make('div', 'card task-passage task-rewrite-text');
    yours.append(make('p', 'eyebrow', 'Your rewrite'), make('p', null, text));
    root.replaceChildren(header(), original(), yours, box, done);
    done.focus();
  }

  function render() {
    if (finished) { if (ctx.mode === 'practice') feedback(); else ctx.complete(); return; }
    if (stage === 'check' && text.trim()) checkScreen();
    else { stage = 'write'; writeScreen(); }
  }
  render();

  return () => {
    // Leaving mid-task (Save and exit): keep the latest text.
    clearTimeout(draftTimer);
    if (!finished && text !== savedText) save();
    root.remove();
  };
}

export const score = scoreRewrite;
