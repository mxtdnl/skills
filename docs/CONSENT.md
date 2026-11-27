# Consent wording

**Purpose.** Records, word for word, every version of the consent and purpose notice shown in the first-run flow, so that the `consent.noticeVersion` stored on each participant record can be traced to the exact text the student agreed to (audit F-2).

The source of truth is `src/app/consent.js`. Any change to the wording, however small, needs a new `CONSENT_VERSION`, a new section below and an entry in `docs/CHANGELOG.md`.

**Status.** The owner approved Claude-drafted wording on 2026-11-26 (`audit/BUILD-PLAN.md`, decisions log). Using exported data for programme evaluation may still need approval from Hult's data protection process; that approval is outside this repository and is not recorded here.

## consent-2026-11-27 (S5)

### What this tool does

This tool helps you reflect on five skills: collaboration, curiosity, critical thinking, creativity and communication. You answer short questionnaires and tasks.

You can practise as often as you like. Practice is never recorded as evidence. Assessment sittings are recorded, so that you can see how your skills develop and discuss them with your coach.

### What is stored, and where

Your answers, how long each answer took, your results and your settings are stored in this web browser, on this device only.

They are linked to a random code, not to your name. The tool never asks for your name or your email address.

### Nothing is sent anywhere

This tool does not send your answers to Hult or to anyone else. Nothing leaves this browser unless you export a file and choose to share it, for example with your coach.

If you clear your browser data or change device, your answers will not be there. Keep your code safe so that your results can still be matched.

### What programme evaluation means

Hult wants to find out whether its programme helps students develop these skills. This is called programme evaluation.

If you agree, a file you share with your coach can be included. Your results are combined with those of other students and reported for groups, for example the average of a year group at the start and at the end of the programme. Your code is used only to match your two sittings. Your name is not used, and no report describes you as an individual.

Saying no does not change how you can use this tool.

### Changing your mind

You can withdraw your agreement to programme evaluation at any time. Ask your coach to delete your file, and it will not be used. You can also change this choice in Settings; the change applies to files you export from then on.

### Checkboxes

- **(a) Required.** I have read how this tool stores my answers, and I want to use it. → `consent.toolUse` (must be true to continue)
- **(b)** I agree that files I share with my coach can be used, without my name, for programme evaluation. (Optional) → `consent.programmeEvaluation`

### Optional language question

Is English your first language? Yes / No / I prefer not to say. A "Skip this question" button records nothing.

> This question is optional. You can skip it.
>
> Your answer is used only for fairness checks: to see whether any question is harder for students whose first language is not English, so that it can be improved. It is never used to work out your results.

Answering sets `consent.languageBackground` to true and stores `languageBackground.englishFirstLanguage`; skipping sets it to false and stores nothing.

### Commitments this wording makes

The wording commits the project to the following. Later sessions must keep to them or change the wording (with a new version):

1. No network calls; data leaves the browser only in a file the student exports (CLAUDE.md, Technical conventions 4).
2. Programme evaluation reports are at group level; no report describes an individual (S13, S15).
3. A coach deletes a student's file on request, and it is then excluded from evaluation (S13: the cohort view needs a way to remove a participant's records).
4. Changing consent (b) in Settings affects files exported from then on; the export (S12) must carry the current `consent.programmeEvaluation`, and the cohort view (S13) must exclude files where it is false.
