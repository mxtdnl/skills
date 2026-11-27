// The idea-list task used by CR-T1 Alternate uses and CR-T2 Problem finding. One item per sitting:
// the object or situation, a 3-minute timer and a text box, one idea per line, with a live count.
//
// Timer (src/core/timing.js, through ctx.createTimer): the participant's accommodation multiplier
// is applied by the runner; the student can pause (the text box is locked while paused), and in the
// last 30 seconds is offered "Add 1 minute" (WCAG 2.2.1, Extend). Extensions are recorded in the
// attempt's timing log. Leaving the page pauses the timer; a reload resumes it paused.
//
// Response (src/skills/creativity/ideas-score.js): { lines: string[], final: boolean,
// elapsedMs: number }. Drafts (final false) are recorded as the student writes, so a reload
// resumes with the text as it was; the latest response is scored. Assessment mode gives no
// feedback. Practice mode shows, after the time, how each line was read, the kinds of idea used and
// kinds not yet tried.

import { formatMs, startTicker } from '../../core/timing.js';
import { analyse, indicators, linesOf } from './ideas-score.js';

/** 3 minutes (audit/BUILD-PLAN.md S8), before the accommodation multiplier. */
export const LIMIT_MS = 3 * 60 * 1000;
/** "Add 1 minute" appears when this much time is left (WCAG 2.2.1 asks for at least 20 seconds). */
export const EXTEND_OFFER_MS = 30 * 1000;
export const EXTEND_MS = 60 * 1000;
/** A draft is saved this long after the last change. */
const DRAFT_DELAY_MS = 2000;
/** While the timer runs, its state is saved at least this often (for an exact resume). */
const CHECKPOINT_MS = 10000;

const TEXT = {
  uses: {
    task: 'Alternate uses',
    prompt: (item) => `How many different uses can you think of for ${item.object}?`,
    lede: 'Ordinary uses count, but try to find unusual ones too. Any use is fine as long as it could really work.',
    example: 'For example, for a sock you might write "polish shoes" or "a puppet for a child".',
    label: 'Your uses, one per line',
    noun: ['use', 'uses'],
  },
  problems: {
    task: 'Problem finding',
    prompt: (item) => `What problems might a student face when ${item.situation}?`,
    lede: 'List as many different problems as you can: big and small, obvious and less obvious, including problems that could follow from other problems.',
    example: 'For example, for a student moving to a new city you might write "not knowing anyone" or "finding a doctor".',
    label: 'Your problems, one per line',
    noun: ['problem', 'problems'],
  },
};

const REASON = {
  'non-words': 'Not counted: most of the words were not recognised as English words.',
  'too-short': 'Not counted: write the idea in at least two words.',
  duplicate: 'Not counted: the same idea as an earlier line.',
};

function maker(doc) {
  return (tag, className, text) => {
    const n = doc.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  };
}

/** Non-empty lines of a text box, as written. */
const linesFrom = (value) => value.split('\n').map((l) => l.trim()).filter(Boolean);

/**
 * @param {HTMLElement} el
 * @param {object} ctx  step context from src/skills/runner.js
 */
export function mount(el, ctx) {
  const doc = el.ownerDocument;
  const make = maker(doc);
  const root = make('section', 'task task-ideas');
  root.dataset.task = ctx.taskId;
  el.replaceChildren(root);

  // The item: the one already answered, else one practice item chosen by the sitting's seed, or
  // the form's only item.
  const answered = [...ctx.resume].reverse().find((r) => ctx.items.some((it) => it.id === r.itemId));
  const item = answered
    ? ctx.items.find((it) => it.id === answered.itemId)
    : ctx.items[ctx.mode === 'practice' ? ctx.rng.int(ctx.items.length) : 0];
  const words = TEXT[item.kind];
  const last = answered ? answered.response : null;
  let text = last && Array.isArray(last.lines) ? last.lines.join('\n') : '';
  let savedLines = linesFrom(text);
  let shownAt = ctx.now();
  let finished = Boolean(last && last.final);
  const stops = [];

  const timer = ctx.createTimer(LIMIT_MS, { onExpire: () => render() });
  const elapsed = () => Math.max(0, Math.round(timer.allowedMs() - timer.remainingMs()));

  // ------------------------------------------------------------ saving

  let draftTimer = null;
  function saveDraft(force = false) {
    clearTimeout(draftTimer);
    draftTimer = null;
    const lines = linesFrom(text);
    if (!force && lines.join('\n') === savedLines.join('\n')) return ctx.checkpoint();
    savedLines = lines;
    return ctx.record({ itemId: item.id, response: { lines, final: false, elapsedMs: elapsed() }, shownAt });
  }
  const scheduleDraft = () => { clearTimeout(draftTimer); draftTimer = setTimeout(() => saveDraft(), DRAFT_DELAY_MS); };

  // ------------------------------------------------------------ screens

  const live = make('p', 'visually-hidden');
  live.setAttribute('aria-live', 'polite');
  const say = (msg) => { live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 50); };

  function header() {
    const card = make('div', 'card card-rail task-scenario task-ideas-prompt');
    card.append(make('p', 'eyebrow', words.task), make('h2', 'task-ideas-question', words.prompt(item)));
    return card;
  }

  function intro() {
    const box = make('div', 'task-ideas-intro');
    const minutes = Math.round(timer.allowedMs() / 60000 * 10) / 10;
    box.append(
      make('p', 'lede', words.lede),
      make('p', null, 'Write each idea on its own line, in at least two words. Press Enter to start a new line.'),
      make('p', 'small quiet', words.example),
      make('p', null, `You will have ${minutes} minutes. You can pause the timer at any time.`),
    );
    const go = make('button', 'btn', 'Start the timer');
    go.type = 'button';
    go.addEventListener('click', () => {
      timer.start();
      shownAt = ctx.now();
      ctx.checkpoint();
      render();
      const area = root.querySelector('textarea');
      if (area) area.focus();
    });
    const row = make('div', 'btn-row');
    row.append(go);
    root.replaceChildren(header(), box, row, live);
    go.focus();
  }

  let ticker = null;
  function stopTicker() { if (ticker) { ticker(); ticker = null; } }

  function writing() {
    const state = timer.state;
    const wrap = make('div', 'task-ideas-body');

    // Timer, with the time always printed as text
    const t = make('div', 'timer task-timer');
    const ring = make('div', 'timer-ring');
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = doc.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    for (const cls of ['timer-track', 'timer-arc']) {
      const c = doc.createElementNS(svgNS, 'circle');
      c.setAttribute('class', cls);
      c.setAttribute('cx', '50'); c.setAttribute('cy', '50'); c.setAttribute('r', '44');
      if (cls === 'timer-arc') c.setAttribute('pathLength', '100');
      svg.append(c);
    }
    const value = make('span', 'timer-value');
    value.setAttribute('role', 'timer');
    value.setAttribute('aria-label', 'Time remaining');
    const stateLabel = make('span', 'timer-state');
    ring.append(svg, value, stateLabel);
    const controls = make('div', 'timer-controls');
    const pause = make('button', 'btn btn-ghost btn-small');
    pause.type = 'button';
    const extend = make('button', 'btn btn-ghost btn-small', 'Add 1 minute');
    extend.type = 'button';
    const note = make('p', 'timer-note');
    controls.append(pause, extend);
    t.append(ring, controls, note);

    // The text box and the live count
    const field = make('div', 'task-ideas-field');
    const label = make('label', 'field-label', words.label);
    label.htmlFor = `ideas-${item.id}`;
    const hint = make('p', 'field-hint', 'One idea per line, in at least two words.');
    hint.id = `ideas-hint-${item.id}`;
    const area = make('textarea', 'input task-ideas-input');
    area.id = `ideas-${item.id}`;
    area.rows = 10;
    area.spellcheck = true;
    area.value = text;
    area.setAttribute('aria-describedby', `${hint.id} ideas-count-${item.id}`);
    const count = make('p', 'task-ideas-count');
    count.id = `ideas-count-${item.id}`;
    field.append(label, hint, area, count);

    const row = make('div', 'btn-row');
    const finish = make('button', 'btn', 'Finish');
    finish.type = 'button';
    row.append(finish);
    const confirm = make('div', 'notice task-ideas-confirm');
    confirm.hidden = true;

    let warned60 = false;
    let warned30 = false;
    let lastCheckpoint = ctx.now();

    function update() {
      const left = timer.remainingMs();
      const s = timer.state;
      t.classList.toggle('running', s === 'running');
      t.classList.toggle('paused', s === 'paused');
      t.classList.toggle('expired', s === 'expired');
      t.classList.toggle('low', s === 'running' && left <= 60000);
      value.textContent = formatMs(left);
      ring.style.setProperty('--timer-progress', String(Math.max(0, Math.min(1, left / timer.allowedMs()))));
      stateLabel.textContent = s === 'paused' ? 'Paused' : s === 'expired' ? 'Time is up' : left <= 60000 ? 'Under 1 min' : 'Running';
      pause.textContent = s === 'paused' ? 'Resume' : 'Pause';
      pause.className = s === 'paused' ? 'btn btn-small' : 'btn btn-ghost btn-small';
      pause.hidden = s === 'expired';
      extend.hidden = !(s === 'running' || s === 'paused') || left > EXTEND_OFFER_MS;
      area.readOnly = s !== 'running';
      area.classList.toggle('locked', s !== 'running');
      const n = linesFrom(area.value).length;
      count.textContent = `${words.noun[1][0].toUpperCase()}${words.noun[1].slice(1)} so far: ${n}`;
      if (s === 'paused') note.textContent = 'The timer is paused. Resume to keep writing.';
      else if (s === 'expired') note.textContent = 'Time is up. Your ideas are saved. Select Finish to go on.';
      else if (!note.dataset.keep) note.textContent = '';
      if (s === 'running' && !warned60 && left <= 60000 && left > EXTEND_OFFER_MS) { warned60 = true; say('1 minute left.'); }
      if (s === 'running' && !warned30 && left <= EXTEND_OFFER_MS) { warned30 = true; say('30 seconds left. You can add 1 minute if you need more time.'); }
      if (s === 'running' && ctx.now() - lastCheckpoint >= CHECKPOINT_MS) { lastCheckpoint = ctx.now(); ctx.checkpoint(); }
    }

    area.addEventListener('input', () => {
      text = area.value;
      update();
      scheduleDraft();
    });
    pause.addEventListener('click', () => {
      if (timer.state === 'running') { timer.pause(); saveDraft(true); say('Timer paused.'); }
      else if (timer.state === 'paused') { timer.resume(); ctx.checkpoint(); say('Timer running.'); area.focus(); }
      note.dataset.keep = '';
      update();
    });
    extend.addEventListener('click', () => {
      timer.extend(EXTEND_MS);
      warned30 = false;
      warned60 = true;
      ctx.checkpoint();
      note.textContent = '1 minute added.';
      note.dataset.keep = '1';
      say('1 minute added.');
      update();
    });
    finish.addEventListener('click', () => {
      if (timer.state === 'running' || timer.state === 'paused') {
        confirm.hidden = false;
        confirm.replaceChildren(make('p', null, `You still have ${formatMs(timer.remainingMs())}. Finish now?`));
        const yes = make('button', 'btn btn-small', 'Finish now');
        yes.type = 'button';
        yes.addEventListener('click', () => end());
        const no = make('button', 'btn btn-ghost btn-small', 'Keep writing');
        no.type = 'button';
        no.addEventListener('click', () => { confirm.hidden = true; finish.focus(); });
        const r = make('div', 'btn-row');
        r.append(yes, no);
        confirm.append(r);
        yes.focus();
        return;
      }
      end();
    });

    wrap.append(t, field, confirm, row);
    root.replaceChildren(header(), wrap, live);
    update();
    stopTicker();
    if (state === 'running' || state === 'paused') ticker = startTicker(timer, () => update(), { intervalMs: 250 });
    if (state === 'expired') { saveDraft(); finish.focus(); }
  }

  function end() {
    stopTicker();
    if (timer.state === 'running') timer.pause();
    clearTimeout(draftTimer);
    const lines = linesFrom(text);
    finished = true;
    ctx.record({ itemId: item.id, response: { lines, final: true, elapsedMs: elapsed() }, shownAt });
    if (ctx.mode === 'practice') feedback(lines);
    else ctx.complete();
  }

  // ------------------------------------------------------------ practice feedback

  function feedback(lines) {
    const results = analyse(linesOf({ lines }), item);
    const s = indicators(results, item);
    const label = new Map(item.categories.map((c) => [c.id, c.label]));
    const used = item.categories.filter((c) => results.some((r) => r.category === c.id));
    const unused = ctx.rngFor(`${item.id}:hints`).shuffle(item.categories.filter((c) => !used.includes(c)));

    const box = make('div', 'card card-top task-summary task-ideas-feedback');
    box.append(make('h2', null, `Your ${words.noun[1]}`));
    box.append(make('p', null, results.length === 0
      ? `You did not write any ${words.noun[1]} this time.`
      : `You wrote ${results.length} ${results.length === 1 ? 'line' : 'lines'}. ${s.fluency} ${s.fluency === 1 ? 'counts as a different idea' : 'count as different ideas'}, in ${s.flexibility} of the ${item.categories.length} kinds of ${words.noun[0]} this practice looks for.`));

    if (results.length) {
      const list = make('ol', 'idea-list');
      for (const r of results) {
        const li = make('li', `idea-line ${r.status === 'valid' ? 'counted' : 'not-counted'}`);
        li.append(make('span', 'idea-text', r.text));
        if (r.status === 'valid') {
          const tag = make('span', r.category ? 'tag accent' : 'tag', r.category ? label.get(r.category) : 'Kind not recognised');
          li.append(tag);
          if (r.points === 2 && r.entry) li.append(make('span', 'tag', 'Few give this'));
        } else {
          li.append(make('span', 'idea-reason small', REASON[r.status]));
        }
        list.append(li);
      }
      box.append(list);
    }

    if (used.length) {
      box.append(make('h3', 'task-ideas-subhead', 'Kinds of idea you used'));
      const tags = make('p', 'tag-row');
      for (const c of used) tags.append(make('span', 'tag accent', c.label));
      box.append(tags);
    }
    if (unused.length) {
      box.append(make('h3', 'task-ideas-subhead', 'Kinds you have not tried yet'));
      const ul = make('ul', 'task-reasons');
      for (const c of unused.slice(0, 3)) {
        const li = make('li');
        li.append(make('strong', null, `${c.label}. `), doc.createTextNode(c.hint || ''));
        ul.append(li);
      }
      box.append(ul);
      if (unused.length > 3) box.append(make('p', 'small quiet', `There are ${unused.length - 3} more kinds you did not use. Next time, when ideas run out, try looking at the ${item.kind === 'uses' ? 'object' : 'situation'} from a different angle.`));
    }
    box.append(make('p', 'small quiet', 'This is practice: it is not stored as a result. Which ideas are rare is estimated by the authors for now, not yet measured from students\' answers.'));
    const done = make('button', 'btn', 'Finish');
    done.type = 'button';
    done.addEventListener('click', () => ctx.complete());
    root.replaceChildren(header(), box, done, live);
    done.focus();
  }

  // ------------------------------------------------------------ start

  function render() {
    if (finished) { if (ctx.mode === 'practice') feedback(linesFrom(text)); else ctx.complete(); return; }
    if (timer.state === 'idle') intro();
    else writing();
  }
  render();
  if (timer.state === 'paused') {
    const note = root.querySelector('.timer-note');
    if (note) { note.textContent = 'The timer was paused while you were away. Select Resume to carry on.'; }
  }

  stops.push(() => { stopTicker(); clearTimeout(draftTimer); });
  return () => {
    // Leaving mid-task (Save and exit): keep the latest text. The runner pauses the timer.
    if (!finished && (timer.state === 'running' || timer.state === 'paused' || timer.state === 'expired')) {
      const lines = linesFrom(text);
      if (lines.join('\n') !== savedLines.join('\n')) ctx.record({ itemId: item.id, response: { lines, final: false, elapsedMs: elapsed() }, shownAt });
    }
    for (const s of stops) s();
    root.remove();
  };
}
