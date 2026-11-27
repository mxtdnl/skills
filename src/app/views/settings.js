// Settings (#/settings, also #/profile): your code, extended time, reduced motion, programme
// evaluation consent, export and import (stubs until S12), and reset all data.

import { h, announce } from '../dom.js';
import { CONSENT_VERSION, EVALUATION_LABEL } from '../consent.js';
import { exportData, importData, TRANSFER_AVAILABLE, TRANSFER_NOTICE } from '../transfer.js';

const RESET_WORD = 'DELETE';

const TIME_OPTIONS = [
  { value: 1, label: 'Standard time' },
  { value: 1.5, label: 'Extra time: one and a half times as long' },
  { value: 2, label: 'Extra time: twice as long' },
];

export async function settingsView(app) {
  const p = app.data.participant;
  const settings = { timeMultiplier: 1, reducedMotion: false, ...(p.settings || {}) };
  // Every change saves the whole participant record, built from its current state.
  const update = async (patch, message) => {
    const next = { ...p, ...patch };
    await app.store.save('participant', next);
    Object.assign(p, next);
    status.textContent = message;
    announce(message);
  };
  const setSetting = (key, value, message) => update({ settings: { ...settings, ...(p.settings || {}), [key]: value } }, message);
  const status = h('p', { class: 'save-status small', attrs: { role: 'status' } });

  // Extended time
  const timeset = h('fieldset', { class: 'likert likert-compact' },
    h('legend', { class: 'likert-prompt', text: 'Time for timed tasks' }),
    h('div', { class: 'likert-scale' }, ...TIME_OPTIONS.map((o) => {
      const id = `time-${String(o.value).replace('.', '-')}`;
      const input = h('input', { type: 'radio', name: 'time', id, value: String(o.value), checked: settings.timeMultiplier === o.value });
      input.addEventListener('change', () => setSetting('timeMultiplier', o.value, `Saved: ${o.label.toLowerCase()}.`));
      return h('label', { class: 'likert-option', attrs: { for: id } }, input, h('span', { class: 'likert-label', text: o.label }));
    })),
  );

  // Reduced motion
  const motion = h('input', { type: 'checkbox', id: 'reduced-motion', checked: settings.reducedMotion });
  motion.addEventListener('change', async () => {
    await setSetting('reducedMotion', motion.checked, motion.checked ? 'Saved: motion reduced.' : 'Saved: motion as set by your device.');
    if (motion.checked) document.documentElement.dataset.motion = 'reduce';
    else delete document.documentElement.dataset.motion;
  });

  // Programme evaluation consent (b)
  const evaluation = h('input', { type: 'checkbox', id: 'settings-evaluation', checked: p.consent.programmeEvaluation });
  evaluation.addEventListener('change', () => {
    const consent = { ...p.consent, programmeEvaluation: evaluation.checked, givenAt: new Date().toISOString(), noticeVersion: CONSENT_VERSION };
    update({ consent }, evaluation.checked ? 'Saved: you agree to programme evaluation.' : 'Saved: you do not agree to programme evaluation.');
  });

  // Export and import (S12)
  const transferStatus = h('p', { class: 'small', attrs: { role: 'status' } });
  const fileInput = h('input', { type: 'file', id: 'import-file', accept: '.json,application/json', class: 'visually-hidden', disabled: !TRANSFER_AVAILABLE });
  fileInput.addEventListener('change', async () => {
    if (!fileInput.files.length) return;
    const r = await importData(app.store, fileInput.files[0]);
    transferStatus.textContent = r.message;
  });
  const transfer = h('div', { class: 'btn-row' },
    h('button', { type: 'button', class: 'btn btn-ghost', text: 'Export my data', onClick: async () => { transferStatus.textContent = (await exportData(app.store)).message; } }),
    h('button', { type: 'button', class: 'btn btn-ghost', text: 'Import a file', onClick: async () => {
      if (TRANSFER_AVAILABLE) fileInput.click();
      else transferStatus.textContent = (await importData(app.store, null)).message;
    } }),
    fileInput,
  );

  // Reset all data
  const confirmInput = h('input', { type: 'text', id: 'reset-confirm', class: 'input', autocomplete: 'off', spellcheck: false, attrs: { 'aria-describedby': 'reset-hint' } });
  const resetBtn = h('button', { type: 'submit', class: 'btn btn-danger', text: 'Delete all data', disabled: true });
  confirmInput.addEventListener('input', () => { resetBtn.disabled = confirmInput.value.trim() !== RESET_WORD; });
  const reset = h('form', { class: 'stack', onSubmit: async (e) => {
    e.preventDefault();
    if (confirmInput.value.trim() !== RESET_WORD) return;
    await app.store.clear();
    app.redirect('start');
  } },
  h('label', { class: 'field-label', attrs: { for: 'reset-confirm' }, text: `Type ${RESET_WORD} to confirm` }),
  h('p', { class: 'field-hint', id: 'reset-hint', text: 'This deletes every answer, result and setting stored in this browser, and your code. It cannot be undone. Files you have already shared with your coach are not affected.' }),
  h('div', { class: 'inline-form' }, confirmInput, resetBtn));

  const section = (accent, id, title, ...children) => h('section', { class: 'card card-rail settings-section', dataset: { accent: String(accent) }, attrs: { 'aria-labelledby': id } },
    h('h2', { class: 'card-title', id, text: title }), ...children);

  return {
    title: 'Settings',
    nodes: [h('section', { class: 'page wrap settings-page' },
      h('p', { class: 'eyebrow', text: 'Settings' }),
      h('h1', { text: 'Settings and your data' }),
      status,
      section(1, 'set-code', 'Your code',
        h('p', { class: 'code-display code-display-card', text: p.id }),
        h('p', { class: 'small quiet', text: 'Keep this code. You need it at the end of your programme and if you change device or browser.' }),
      ),
      section(4, 'set-time', 'Extended time',
        h('p', { text: 'Some tasks have a time limit. Choose extra time if you need it; it applies to tasks you start from now on. Your choice is recorded with each timed task.' }),
        timeset,
      ),
      section(6, 'set-motion', 'Motion',
        h('div', { class: 'check' }, motion, h('label', { attrs: { for: 'reduced-motion' }, text: 'Reduce motion: no movement or animation when pages and results change.' })),
        h('p', { class: 'small quiet', text: 'If your device is already set to reduce motion, this tool follows it whatever you choose here.' }),
      ),
      section(2, 'set-consent', 'Programme evaluation',
        h('div', { class: 'check' }, evaluation, h('label', { attrs: { for: 'settings-evaluation' }, text: EVALUATION_LABEL })),
        h('p', { class: 'small quiet', text: 'A change applies to files you export from now on. To withdraw a file you have already shared, ask your coach to delete it.' }),
      ),
      section(8, 'set-transfer', 'Export and import',
        h('p', { text: 'Export saves your answers and results to a file that you can keep or share with your coach. Import loads a file you exported before.' }),
        TRANSFER_AVAILABLE ? null : h('p', { class: 'small quiet', text: TRANSFER_NOTICE }),
        transfer,
        transferStatus,
      ),
      h('section', { class: 'card card-rail settings-section danger-zone', attrs: { 'aria-labelledby': 'set-reset' } },
        h('h2', { class: 'card-title', id: 'set-reset', text: 'Delete all data' }),
        reset,
      ),
    )],
  };
}
