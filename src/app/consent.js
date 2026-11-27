// Consent and purpose wording shown in the first-run flow.
//
// The wording is final (owner approval of Claude-drafted wording, audit/BUILD-PLAN.md decisions
// log, 2026-11-26). Use of exported data for programme evaluation may still need approval from
// Hult's data protection process, outside this repository (audit F-2).
//
// CONSENT_VERSION is stored on the participant record (consent.noticeVersion). Any change to
// the wording below, however small, needs a new version string and an entry in docs/CONSENT.md
// and docs/CHANGELOG.md, so that every record shows exactly which wording the student agreed to.

export const CONSENT_VERSION = 'consent-2026-11-27';

/** Sections of the notice, in order: { heading, paragraphs }. Plain text, rendered with textContent. */
export const NOTICE = Object.freeze([
  {
    heading: 'What this tool does',
    paragraphs: [
      'This tool helps you reflect on five skills: collaboration, curiosity, critical thinking, creativity and communication. You answer short questionnaires and tasks.',
      'You can practise as often as you like. Practice is never recorded as evidence. Assessment sittings are recorded, so that you can see how your skills develop and discuss them with your coach.',
    ],
  },
  {
    heading: 'What is stored, and where',
    paragraphs: [
      'Your answers, how long each answer took, your results and your settings are stored in this web browser, on this device only.',
      'They are linked to a random code, not to your name. The tool never asks for your name or your email address.',
    ],
  },
  {
    heading: 'Nothing is sent anywhere',
    paragraphs: [
      'This tool does not send your answers to Hult or to anyone else. Nothing leaves this browser unless you export a file and choose to share it, for example with your coach.',
      'If you clear your browser data or change device, your answers will not be there. Keep your code safe so that your results can still be matched.',
    ],
  },
  {
    heading: 'What programme evaluation means',
    paragraphs: [
      'Hult wants to find out whether its programme helps students develop these skills. This is called programme evaluation.',
      'If you agree, a file you share with your coach can be included. Your results are combined with those of other students and reported for groups, for example the average of a year group at the start and at the end of the programme. Your code is used only to match your two sittings. Your name is not used, and no report describes you as an individual.',
      'Saying no does not change how you can use this tool.',
    ],
  },
  {
    heading: 'Changing your mind',
    paragraphs: [
      'You can withdraw your agreement to programme evaluation at any time. Ask your coach to delete your file, and it will not be used. You can also change this choice in Settings; the change applies to files you export from then on.',
    ],
  },
]);

/** Checkbox (a): required to use the tool. */
export const TOOL_USE_LABEL = 'I have read how this tool stores my answers, and I want to use it.';

/** Checkbox (b): optional. */
export const EVALUATION_LABEL = 'I agree that files I share with my coach can be used, without my name, for programme evaluation. (Optional)';

/** Optional language-background question (audit E-1). */
export const LANGUAGE_QUESTION = 'Is English your first language?';
export const LANGUAGE_EXPLANATION = [
  'This question is optional. You can skip it.',
  'Your answer is used only for fairness checks: to see whether any question is harder for students whose first language is not English, so that it can be improved. It is never used to work out your results.',
];
export const LANGUAGE_OPTIONS = Object.freeze([
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'prefer-not-to-say', label: 'I prefer not to say' },
]);
