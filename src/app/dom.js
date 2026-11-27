// Small DOM helpers for the application shell. Every node is built with createElement and
// textContent; nothing is ever parsed from a string as HTML (audit K-5).

/**
 * Create an element.
 *   props.class      className
 *   props.text       textContent
 *   props.dataset    copied to el.dataset
 *   props.attrs      set with setAttribute (aria-*, role, for, ...)
 *   props.on<Event>  event listener, for example onClick
 *   any other prop   assigned as a property (type, href, value, checked, disabled, ...)
 * Children may be nodes, strings, or null/undefined/false (skipped).
 * @returns {HTMLElement}
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'attrs') for (const [a, av] of Object.entries(v)) { if (av !== null && av !== undefined && av !== false) el.setAttribute(a, av === true ? '' : String(av)); }
    else if (/^on[A-Z]/.test(k)) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el[k] = v;
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c);
  }
  return el;
}

/** Accent attributes for a skill: data-skill for the five skills, data-accent for --accent-N. */
export function accentOf(skill) {
  const m = /^--skill-([a-z]+)$/.exec(skill.accentToken);
  if (m) return { skill: skill.id };
  const n = /^--accent-([1-8])$/.exec(skill.accentToken);
  return n ? { accent: n[1] } : {};
}

/** Decorative shapes: [{ shape: 'square' | 'circle' | 'ring' | 'bar' | 'tri', accent, style }]. */
export function geo(shapes) {
  return shapes.map(({ shape, accent, cls = '', style = {} }) => {
    const el = h('span', { class: `geo geo-${shape} ${cls}`.trim(), attrs: { 'aria-hidden': 'true' }, dataset: accent ? { accent: String(accent) } : undefined });
    for (const [k, v] of Object.entries(style)) el.style.setProperty(k, v);
    return el;
  });
}

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const DATE_TIME = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** 27 November 2026 */
export const formatDate = (iso) => (iso ? DATE.format(new Date(iso)) : '');
/** 27 November 2026 at 09:30 */
export const formatDateTime = (iso) => (iso ? DATE_TIME.format(new Date(iso)) : '');

export const STATE_LABEL = { 'not-started': 'Not started', 'in-progress': 'In progress', complete: 'Complete' };

/** A status tag for a progress state. */
export function stateTag(state, prefix = '') {
  const cls = state === 'complete' ? 'tag correct' : state === 'in-progress' ? 'tag accent' : 'tag';
  return h('span', { class: cls, dataset: { state } }, prefix ? `${prefix}: ${STATE_LABEL[state]}` : STATE_LABEL[state]);
}

/**
 * Modal confirmation built on <dialog> (keyboard and focus handling come from the browser).
 * Resolves true if confirmed, false if cancelled or closed with Escape.
 * @param {{ title: string, body: (string | Node)[], confirmLabel: string, cancelLabel?: string, danger?: boolean }} opts
 * @returns {Promise<boolean>}
 */
export function confirmDialog({ title, body, confirmLabel, cancelLabel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    const titleId = `dialog-title-${Math.random().toString(36).slice(2)}`;
    const cancel = h('button', { type: 'button', class: 'btn btn-ghost', text: cancelLabel, value: 'cancel' });
    const ok = h('button', { type: 'button', class: danger ? 'btn btn-danger' : 'btn', text: confirmLabel, value: 'ok' });
    const dlg = h('dialog', { class: 'dialog', attrs: { 'aria-labelledby': titleId } },
      h('h2', { class: 'dialog-title', id: titleId, text: title }),
      ...body.map((b) => (typeof b === 'string' ? h('p', { text: b }) : b)),
      h('div', { class: 'btn-row' }, ok, cancel),
    );
    let answered = false;
    const close = (value) => {
      if (answered) return;
      answered = true;
      dlg.close();
      dlg.remove();
      resolve(value);
    };
    ok.addEventListener('click', () => close(true));
    cancel.addEventListener('click', () => close(false));
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(false); });
    document.body.append(dlg);
    dlg.showModal();
    cancel.focus();
  });
}

/** Announce a message to screen readers through the shell's live region. */
export function announce(text) {
  const region = document.getElementById('announcer');
  if (!region) return;
  region.textContent = '';
  setTimeout(() => { region.textContent = text; }, 50);
}
