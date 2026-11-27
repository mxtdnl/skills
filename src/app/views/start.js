// First-run flow: welcome, (returning code), consent, language background, your code.
//
// Steps are routes (#/start, #/start/consent, ...), so Back and Forward work. Nothing is saved
// until the language step is finished: the participant record is created then, with the
// consent decisions and the wording version. A reload before that returns to the consent step.

import { h, geo } from '../dom.js';
import { newParticipantId, normaliseParticipantId } from '../../core/ids.js';
import { SCHEMA_VERSION } from '../../core/version.js';
import { CONSENT_VERSION, NOTICE, TOOL_USE_LABEL, EVALUATION_LABEL, LANGUAGE_QUESTION, LANGUAGE_EXPLANATION, LANGUAGE_OPTIONS } from '../consent.js';

/** Choices made so far in this first run (memory only, by design). */
const draft = { participantId: null, toolUse: false, programmeEvaluation: false };

const STEP_NAMES = { welcome: 1, consent: 2, language: 3, code: 4 };

function stepEyebrow(step) {
  return h('p', { class: 'eyebrow', text: `Getting started: step ${STEP_NAMES[step]} of 4` });
}

function page(...children) {
  return h('section', { class: 'page wrap geo-field start-page' },
    ...geo([
      { shape: 'square', accent: 1, style: { '--geo-size': '22rem', top: '-7rem', right: '-8rem' } },
      { shape: 'ring', accent: 4, cls: 'geo-strong', style: { '--geo-size': '14rem', bottom: '-5rem', left: '-5rem' } },
      { shape: 'bar', accent: 2, cls: 'geo-faint', style: { bottom: '35%', left: '-20%' } },
    ]),
    h('div', { class: 'measure' }, ...children),
  );
}

export async function startView(app, params) {
  const step = params.step || 'welcome';
  if (step === 'welcome') return welcome();
  if (step === 'returning') return returning(app);
  if (step === 'consent') return consent(app);
  if (step === 'language') {
    if (!draft.toolUse) { app.redirect('start', { step: 'consent' }); return { nodes: [] }; }
    return language(app);
  }
  if (step === 'code') {
    if (!app.data.participant) { app.redirect('start'); return { nodes: [] }; }
    return code(app);
  }
  app.redirect('start');
  return { nodes: [] };
}

function welcome() {
  return {
    title: 'Welcome',
    nodes: [page(
      stepEyebrow('welcome'),
      h('div', { class: 'skill-rail welcome-rail', attrs: { 'aria-hidden': 'true' } }, h('span'), h('span'), h('span'), h('span'), h('span')),
      h('h1', { text: 'Explore your five core skills' }),
      h('p', { class: 'lede', text: 'Collaboration, curiosity, critical thinking, creativity and communication: the five skills at the heart of your Hult programme. This tool helps you reflect on them, practise them, and discuss them with your coach.' }),
      h('div', { class: 'notice notice-warning' },
        h('p', { class: 'notice-title', text: 'Prototype' }),
        h('p', { text: 'This tool is still being built. The questions and tasks for each skill are being written and checked by Hult staff, so results shown now are not yet meaningful.' }),
      ),
      h('div', { class: 'card card-rail', dataset: { accent: '1' } },
        h('h2', { class: 'card-title', text: 'What is stored, and where' }),
        h('p', { text: 'Your answers are stored in this web browser, on this device only, under a random code instead of your name. Nothing is sent anywhere unless you export a file and choose to share it.' }),
        h('p', { class: 'small quiet', text: 'The next step explains this in full and asks for your agreement.' }),
      ),
      h('div', { class: 'btn-row' },
        h('a', { class: 'btn', href: '#/start/consent', text: 'Start' }),
        h('a', { class: 'btn btn-ghost', href: '#/start/returning', text: 'I already have a code' }),
      ),
    )],
  };
}

function returning(app) {
  const error = h('p', { class: 'field-error', id: 'code-error', attrs: { role: 'alert' } });
  const input = h('input', { type: 'text', id: 'returning-code', class: 'input input-code', autocomplete: 'off', spellcheck: false, attrs: { 'aria-describedby': 'code-hint code-error', autocapitalize: 'characters' } });
  if (draft.participantId) input.value = draft.participantId;
  const form = h('form', { class: 'stack', onSubmit: (e) => {
    e.preventDefault();
    const id = normaliseParticipantId(input.value);
    if (!id) {
      error.textContent = 'That code is not valid. Check each character and try again. Codes look like P-7K3M-Q9TX4.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    draft.participantId = id;
    app.go('start', { step: 'consent' });
  } },
  h('label', { class: 'field-label', attrs: { for: 'returning-code' }, text: 'Your code' }),
  h('p', { class: 'field-hint', id: 'code-hint', text: 'It starts with P, for example P-7K3M-Q9TX4. Capital or small letters both work.' }),
  input,
  error,
  h('div', { class: 'btn-row' },
    h('button', { type: 'submit', class: 'btn', text: 'Continue' }),
    h('a', { class: 'btn btn-ghost', href: '#/start', text: 'Back' }),
  ));
  return {
    title: 'Enter your code',
    nodes: [page(
      h('p', { class: 'eyebrow', text: 'Getting started' }),
      h('h1', { text: 'Enter your code' }),
      h('p', { class: 'lede', text: 'If you used this tool before, on this or another device, enter the code you were given. Your new answers will be stored under the same code, so they can be matched with your earlier results.' }),
      h('p', { text: 'Answers saved in another browser are not copied here. Your coach can match them by your code.' }),
      form,
    )],
  };
}

function consent(app) {
  const error = h('p', { class: 'field-error', id: 'consent-error', attrs: { role: 'alert' } });
  const toolUse = h('input', { type: 'checkbox', id: 'consent-tool', checked: draft.toolUse, attrs: { 'aria-describedby': 'consent-error' } });
  const evaluation = h('input', { type: 'checkbox', id: 'consent-evaluation', checked: draft.programmeEvaluation });
  const form = h('form', { class: 'stack', onSubmit: (e) => {
    e.preventDefault();
    if (!toolUse.checked) {
      error.textContent = 'To use the tool, tick the first box. The second box is optional.';
      toolUse.focus();
      return;
    }
    draft.toolUse = true;
    draft.programmeEvaluation = evaluation.checked;
    app.go('start', { step: 'language' });
  } },
  h('fieldset', { class: 'consent-choices' },
    h('legend', { class: 'field-label', text: 'Your choices' }),
    h('div', { class: 'check' }, toolUse, h('label', { attrs: { for: 'consent-tool' } }, h('strong', { text: '(a) Required. ' }), TOOL_USE_LABEL)),
    h('div', { class: 'check' }, evaluation, h('label', { attrs: { for: 'consent-evaluation' } }, h('strong', { text: '(b) ' }), EVALUATION_LABEL)),
    error,
  ),
  h('div', { class: 'btn-row' },
    h('button', { type: 'submit', class: 'btn', text: 'Continue' }),
    h('a', { class: 'btn btn-ghost', href: draft.participantId ? '#/start/returning' : '#/start', text: 'Back' }),
  ));
  return {
    title: 'How your answers are used',
    nodes: [page(
      stepEyebrow('consent'),
      h('h1', { text: 'How your answers are used' }),
      h('p', { class: 'lede', text: 'Please read this before you start. It takes about two minutes.' }),
      h('div', { class: 'consent-notice card card-rail', dataset: { accent: '1' } },
        ...NOTICE.map((s) => h('section', { class: 'consent-section' },
          h('h2', { class: 'consent-heading', text: s.heading }),
          ...s.paragraphs.map((p) => h('p', { text: p })),
        )),
        h('p', { class: 'micro quiet', text: `Wording version: ${CONSENT_VERSION}` }),
      ),
      form,
    )],
  };
}

function language(app) {
  const radios = LANGUAGE_OPTIONS.map((o) => {
    const id = `lang-${o.value}`;
    return h('label', { class: 'likert-option', attrs: { for: id } },
      h('input', { type: 'radio', name: 'language', id, value: o.value }),
      h('span', { class: 'likert-label', text: o.label }),
    );
  });
  const finish = async (value) => {
    const now = new Date().toISOString();
    const participant = {
      type: 'participant',
      schemaVersion: SCHEMA_VERSION,
      id: draft.participantId || newParticipantId(),
      createdAt: now,
      consent: {
        noticeVersion: CONSENT_VERSION,
        givenAt: now,
        toolUse: true,
        programmeEvaluation: draft.programmeEvaluation,
        languageBackground: value !== null,
      },
      settings: { timeMultiplier: 1, reducedMotion: false },
    };
    if (value !== null) participant.languageBackground = { englishFirstLanguage: value };
    await app.store.save('participant', participant);
    draft.participantId = null;
    draft.toolUse = false;
    draft.programmeEvaluation = false;
    app.go('start', { step: 'code' });
  };
  const form = h('form', { class: 'stack', onSubmit: (e) => {
    e.preventDefault();
    const chosen = form.querySelector('input[name="language"]:checked');
    finish(chosen ? chosen.value : null);
  } },
  h('fieldset', { class: 'likert likert-compact' },
    h('legend', { class: 'likert-prompt', text: LANGUAGE_QUESTION }),
    h('div', { class: 'likert-scale' }, ...radios),
  ),
  h('div', { class: 'btn-row' },
    h('button', { type: 'submit', class: 'btn', text: 'Save and continue' }),
    h('button', { type: 'button', class: 'btn btn-ghost', text: 'Skip this question', onClick: () => finish(null) }),
  ));
  return {
    title: 'Optional question',
    nodes: [page(
      stepEyebrow('language'),
      h('h1', { text: 'One optional question' }),
      h('div', { class: 'notice' }, ...LANGUAGE_EXPLANATION.map((t) => h('p', { text: t }))),
      form,
      h('p', { class: 'small quiet', text: 'If you choose an answer and then press Skip, nothing is recorded.' }),
    )],
  };
}

function code(app) {
  const id = app.data.participant.id;
  const saved = h('input', { type: 'checkbox', id: 'code-saved' });
  const go = h('a', { class: 'btn disabled', href: '#/hub', text: 'Go to your skills', attrs: { 'aria-disabled': 'true' } });
  const copyStatus = h('span', { class: 'small', attrs: { role: 'status' } });
  saved.addEventListener('change', () => {
    go.classList.toggle('disabled', !saved.checked);
    if (saved.checked) go.removeAttribute('aria-disabled');
    else go.setAttribute('aria-disabled', 'true');
  });
  go.addEventListener('click', (e) => { if (!saved.checked) { e.preventDefault(); saved.focus(); } });
  const copy = h('button', { type: 'button', class: 'btn btn-ghost btn-small', text: 'Copy code', onClick: async () => {
    try {
      await navigator.clipboard.writeText(id);
      copyStatus.textContent = 'Copied.';
    } catch {
      copyStatus.textContent = 'Copying is not available here. Please write the code down.';
    }
  } });
  return {
    title: 'Your code',
    nodes: [page(
      stepEyebrow('code'),
      h('h1', { text: 'Save this code' }),
      h('p', { class: 'lede', text: 'This is your personal code. It is how the tool knows your answers belong together, without using your name.' }),
      h('div', { class: 'banner code-banner', dataset: { accent: '1' } },
        h('p', { class: 'banner-eyebrow', text: 'Your code' }),
        h('p', { class: 'code-display', id: 'participant-code', text: id }),
      ),
      h('div', { class: 'btn-row' }, copy, copyStatus),
      h('div', { class: 'card card-rail', dataset: { accent: '4' } },
        h('h2', { class: 'card-title', text: 'Keep it somewhere safe' }),
        h('p', { text: 'Write it down, or save it in your notes or password manager. You will need it at the end of your programme, about a year from now, and if you change device or browser. If you lose it, it cannot be recovered from this tool.' }),
        h('p', { class: 'small quiet', text: 'You can see it again at any time in Settings.' }),
      ),
      h('div', { class: 'check' }, saved, h('label', { attrs: { for: 'code-saved' }, text: 'I have saved my code.' })),
      h('div', { class: 'btn-row' }, go),
    )],
  };
}
