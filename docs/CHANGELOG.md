# Changelog

**Purpose.** Records changes to the repository by build session, and every change to `scoringVersion`, so that results from different versions are never compared without knowing what changed.

## Scoring versions

| scoringVersion | Applies to | Status |
|---|---|---|
| 0.1.0 | Legacy prototype, `legacy/skills-assessment-hult.html` | Legacy; known defects, see `audit/AUDIT-REPORT.md` |
| 0.2.0 | Rebuilt platform skeleton (S3). Only the developer stub task is scored | No skill measures; nothing to compare |
| 0.3.0 | Application shell (S5). Adds the developer stub's self-report score | No skill measures; nothing to compare |
| 1.0.0-draft | Self-reports of the five skills (S6): reverse keying, facet and skill means on 1 to 5, retrospective means, response-quality indicators | Draft: items unreviewed, no pilot data. Not comparable with 0.1.0 (different items, scale and formula) |
| 1.2.0-draft | Adds the two creativity tasks (S8): fluency, flexibility (revised per-item taxonomy, no "Other" credit), originality (mean points from a provisional, author-estimated frequency table, matched by whole stems), unscorable-line counts; no weighted blend. Self-report and critical thinking scoring unchanged | Draft: items and tables unreviewed, bands author-estimated, no pilot data. Earlier scores comparable; not comparable with the legacy AUT score (0.1.0) |
| 1.1.0-draft | Adds the four critical thinking tasks (S7): all-or-nothing selection task with abstract and deontic sub-scores, proportion correct for argument evaluation and statistical reasoning, calibration indices and revision indices. Self-report scoring unchanged | Draft: items unreviewed, no pilot data. Self-report scores comparable with 1.0.0-draft; the CT tasks have no earlier version. Not comparable with the legacy Wason score (0.1.0, partial credit) |

## Release checklist for scoringVersion 1.0.0

To be written in Session 15.

## Sessions

### S0. Repository foundations (2026-11-26)

- Moved `skills-assessment-hult.html` to `legacy/skills-assessment-hult.html`, content unchanged. Updated the path in `audit/evidence/harness.mjs` (now defaults to the new location), `audit/evidence/browser.cjs` and `audit/README.md`.
- Added `CLAUDE.md`, `README.md`, `LICENSE` (placeholder), `package.json` and a temporary `index.html` linking to the legacy prototype.
- Added `docs/SCORING.md` (legacy formulas, scoringVersion 0.1.0), and skeletons for `docs/ITEM-BANK.md`, `docs/DATA-SCHEMA.md`, `docs/VALIDATION-PLAN.md`, `docs/DESIGN.md` and this file.
- Added `tests/legacy-scoring.test.mjs` (characterisation tests reproducing `audit/evidence/results.txt`) and `tests/lint.mjs`.
- No change to scoring or to the behaviour of the legacy prototype.

### S2. Construct definitions draft (2026-11-26)

- Revised `docs/CONSTRUCTS.md`: marked the whole document "DRAFT for Hult review"; moved the sign-off table to the header; completed two strong and two developing behaviours for every facet (CR1, CR2, CR4 and CM3 previously had one each); added per-skill planned-measure tables, facet-by-measure coverage tables, named gaps and open questions; cited Stasser & Titus (1985), Wason (1968) and Guilford (1967) where facets draw on them.
- Added `docs/REVIEW-CHECKLIST.md`.
- Facet codes unchanged. No change to scoring or code.
- Revision 2 of `docs/CONSTRUCTS.md`, recording the owner's answers to the open questions: inclusion kept in CO1; CU3 kept; CT2 widened to include perspective-taking; new facet CT4 (statistical and base-rate reasoning) and task CT-T4; revision step in CT-T3; CR4 kept; constraints on automated originality scoring; optional spoken-communication items (CM-X1) reported separately; business and academic passages; per-facet reporting with a confidence flag. The SJT keying rule remains open. Decisions log in `audit/BUILD-PLAN.md` updated.

### S3. Platform skeleton (2026-11-26)

- Added the platform core as vanilla ES modules in `src/core/`: `version.js`, `rng.js` (mulberry32, rejection-sampled integers, Fisher-Yates shuffle), `ids.js` (participant codes with a check character, record IDs), `schema.js` (data model, `validate()`, JSON Schema export), `migrate.js`, `store.js` (adapter interface, `LocalStorageAdapter` with in-memory fallback and notice, `MemoryAdapter`), `timing.js` (end-timestamp timers with pause, extend, accommodation multiplier and untimed mode) and `router.js` (hash routes).
- Added `src/skills/registry.js` (the only list of skill modules; manifest and content validation), `src/skills/runner.js` (runs a task, scores it, saves the attempt) and the developer stub skill `src/skills/_example/` with example content in `content/_example/pick.js`.
- Added `dev/platform.html` and `dev/platform.js`, a developer harness that runs the stub end to end with `localStorage`.
- Wrote `docs/DATA-SCHEMA.md` and `docs/ARCHITECTURE.md`; generated `docs/data-schema.json`; set the content convention in `docs/ITEM-BANK.md`.
- Schema version 1 (storage prefix `skills5c:v1:`). `appVersion` 0.2.0 (`package.json` bumped).
- **scoringVersion 0.1.0 to 0.2.0.** New section in `docs/SCORING.md`. No skill measure was added; the bump separates records from the rebuilt platform from legacy results. Legacy scoring and its characterisation tests are unchanged.
- Added tests: `rng`, `ids`, `schema`, `store`, `migrate`, `timing`, `router`, `registry` (`tests/*.test.mjs`), shared fixtures in `tests/fixtures.mjs`, and `npm run schema` (`tests/write-data-schema.mjs`).
- Extended `tests/lint.mjs` to `.js` files: no remote imports or requests, no network APIs, no `innerHTML`/`outerHTML` assignment or `insertAdjacentHTML`, no curly quotes.

### S4. Design system port (2026-11-26)

- Added `styles/tokens.css` (reference palette, ink tones and feedback colours copied exactly from `slides/CLAUDE.md`; skill tokens `--skill-<id>` with `-ink`, `-on` and `-tint`), `styles/base.css` and `styles/components.css` (buttons, cards, Likert radio group, choice cards, timer ring, progress dots, feedback, notices, skill tiles, results bar with uncertainty band, banners, decorative geometry). No legacy styles were reused.
- Added `assets/hult-logo.png` (one copy of the prototype's base64 PNG, extracted unchanged; all nine embedded copies were identical) and `assets/favicon.svg` with `assets/favicon.png`. Favicon links added to `index.html` and `dev/platform.html`.
- Added `styleguide.html`, a living specimen of every token and component in every state.
- Extended `tests/lint.mjs` with a reference-palette check and a contrast check over a `CONTRAST_PAIRS` table (70 pairs).
- Communication text uses `--accent-7-ink`, because `--accent-3` fails AA as body text. Confirmed by the owner on 2026-11-27 and recorded in `docs/DESIGN.md`, the 5C mapping table in `CLAUDE.md` and the decisions log in `audit/BUILD-PLAN.md`.
- No change to scoring, data or `scoringVersion`.

### S5. Skill hub, flow, consent and modes (2026-11-27)

- Replaced the temporary `index.html` with the application shell (`src/app/`): first-run flow (welcome, consent, optional language question, your code; a returning student can enter an existing code), skill hub (`#/hub`), skill pages with Practice and Assessment modes (`#/skill/<id>`), the step runner (`#/run/<sittingId>/<stepId>`), results placeholder (`#/results/<id>`) and settings (`#/settings`, also `#/profile`).
- Consent wording written and versioned (`src/app/consent.js`, `consent-2026-11-27`), recorded in `docs/CONSENT.md` and stored on every participant record.
- Autosave after every item response: the runner (`runStep`, `src/skills/runner.js`) saves an in-progress record when a step starts and after every response, and resumes it at the next unanswered item. Timer state is saved with it and paused on exit.
- Form assignment: first form by the parity of an FNV-1a hash of the participant ID (even A, odd B). Programme sittings take the form from the window digit of the sitting code; self-directed sittings alternate from the previous assessment sitting of the skill.
- Programme sittings: a coach's sitting code (for example `SEP26-1`) starts a full battery, one assessment sitting per available skill in the fixed canonical order, recorded in `sitting.programme`.
- Settings: extended time (x1.5, x2), reduced motion (`html[data-motion="reduce"]`, `styles/base.css`), programme-evaluation consent, export and import stubs (`src/app/transfer.js`, wired for S12), and reset all data with a typed confirmation (`store.clear()`).
- Skill module contract: `selfReport` now needs `mount(el, ctx)` (and may give a `label`); the task ID `self-report` is reserved; the step context gains `resume`, `rngFor(itemId)`, `checkpoint()` and `kind`. `stepsFor(skill, mode)` and `SKILL_CATALOGUE` added to `src/skills/registry.js`. The stub skill gains a self-report (`src/skills/_example/rate.js`, `content/_example/self-report.js`), practice feedback and a second practice item.
- Router: routes `start`, `run` and `settings` added. `#/task/...` now redirects to the skill page.
- **Schema version 1 to 2** (storage prefix `skills5c:v2:`), with a migration: `consent.toolUse`; `participant.settings`; `sitting.skillId`, `windowId` and `programme`; `status`, `startedAt`, `updatedAt`, `completedAt` and `timerSnapshot` on task attempts and self-reports. `docs/DATA-SCHEMA.md` and `docs/data-schema.json` updated.
- **scoringVersion 0.2.0 to 0.3.0**: the stub self-report score (`docs/SCORING.md`). No skill measure. `appVersion` 0.3.0.
- Removed the S3 developer harness (`dev/`), replaced by the hub (`index.html?example` shows the stub skill).
- Added `styles/components.css` shell components (navigation, form fields, checkboxes, dialog, step list, battery, run header) and five contrast pairs to `tests/lint.mjs`.
- Tests: `tests/progress.test.mjs`; runner autosave, resume and timer tests; migration test with a real version 1 bundle; Playwright end-to-end tests `tests/e2e/hub.e2e.mjs` (`npm run e2e`), including a keyboard-only run with reloads mid-step.

### S6. Self-report rebuild (2026-11-27)

- Recorded the owner's sign-off of `docs/CONSTRUCTS.md` (all five skills, approved as drafted), passing the S2 gate; added the decision to `audit/BUILD-PLAN.md`.
- Added self-report content for the five skills, `content/<skill>/self-report.js`: 86 form items (8 or 9 per form, every facet on every form, balanced keying recorded per item) and 17 end-of-programme retrospective items, one per facet. All draft. 3 items are IPIP items (X30, V330, V226), cited with code, scale and original wording; 100 are new. No forced-choice or faking items.
- Added `src/skills/common/`: `self-report.js` (component: one facet per screen, labelled five-point Likert radio groups, Back and Next, autosave of every answer and change, resume), `self-report-score.js` (scoring, scoringVersion 1.0.0-draft) and `manifest.js` (builds a manifest from `SKILL_CATALOGUE`).
- Registered the five skill modules, `src/skills/<skill>/index.js`, in `SKILL_MODULES`, with self-reports and no tasks yet. `validateManifest` now accepts `tasks: []` when a self-report exists; the skill page shows Practice as in preparation for a skill with no tasks.
- Runner: `isProgrammeEnd(sitting)` (programme sitting at an even window); retrospective items appended to self-report items in those sittings; `ctx.programmeEnd`; self-report `quality` and `retrospective` stored on completion. `validateContent` checks the optional `retrospective` pool.
- **scoringVersion 0.3.0 to 1.0.0-draft.** New section in `docs/SCORING.md`. Self-report scores are facet means and a skill mean on 1 to 5; negatively keyed items reversed; facets need at least half their items answered; no consistency statistic. Quality indicators (straight-lining, median time per item under 1 second, longest identical run, provisional threshold 6) are recorded for the coach view only and never shown to students.
- **schemaVersion 2 to 3.** SelfReport gains optional `retrospective` and `quality` (only on completion). Migration 2 to 3 changes no existing record. Storage prefix moves to `skills5c:v3:`. `docs/DATA-SCHEMA.md`, `docs/data-schema.json` updated.
- appVersion 0.3.0 to 0.4.0.
- `docs/ITEM-BANK.md`: pools, item fields, review, sources and licences, and the item table with sources. `docs/VALIDATION-PLAN.md`: provisional rules to be set from pilot data. `docs/ARCHITECTURE.md` updated.
- Tests: `tests/self-report.test.mjs` (content rules, reverse keying, straight-lining with no penalty and the flag set, missing and invalid responses, timing, retrospective only at the end of the programme, schema). `tests/registry.test.mjs` and `tests/migrate.test.mjs` updated. `tests/e2e/hub.e2e.mjs`: the programme battery now covers all six registered skills and checks retrospective items at window 2; new test of a real self-report (labels, unanswered prompt, reload, Back, nothing about response quality shown).

### Open decisions register (2026-11-27)

- Added `docs/OPEN-DECISIONS.md`: every open decision for the owner or Hult (D-1 to D-11) and every outstanding piece of human review work (R-1 to R-6), gathered from the audit, the build plan, `docs/CONSTRUCTS.md`, `docs/CONSENT.md`, `docs/DATA-SCHEMA.md`, `docs/DESIGN.md`, `docs/ITEM-BANK.md` and `docs/VALIDATION-PLAN.md`, with resolved decisions to date.
- `CLAUDE.md`: Workflow step 6 requires every session to maintain it; the report step cites its IDs; added to Files.
- No change to code, scoring or data.

### S7. Critical thinking (2026-11-27)

- Scope: four tasks, as decided by the owner on 2026-11-26 and confirmed for this session (the S7 prompt lists three). Recorded in the decisions log of `audit/BUILD-PLAN.md` and as resolved in `docs/OPEN-DECISIONS.md`.
- Added the tasks to `src/skills/critical/index.js`: `ct-t1` Conditional reasoning (`selection.js`: rule and four cards, multi-select, all-or-nothing; card-by-card worked explanation in practice), `ct-t2` Arguments and evidence and `ct-t4` Numbers and chance (`choice.js`: scenario, four options, select then Next; rationale in practice), `ct-t3` How sure are you? (`calibration.js`: two options and a 50 to 100% confidence rating; new evidence and a chance to revise on three items per form; summary at the end of practice). Shared helpers in `ui.js`. No task is timed. No feedback in assessment mode.
- Added content, all draft and new: `content/critical/ct-t1.js` (20 items: 4 abstract and 4 deontic per form, each negation pattern once per kind), `ct-t2.js` (19: flaw, assumption, evidence, weaken, fairest summary, strongest objection; scenarios of at most 80 words; a rationale per item), `ct-t3.js` (24: each with source URLs, checked 2026-11-27 through web search; see R-8), `ct-t4.js` (15: base rate, sample size, proportion, chance; numbers stated in the item and recomputed by the tests).
- **scoringVersion 1.0.0-draft to 1.1.0-draft.** New section in `docs/SCORING.md`. Self-report scoring unchanged.
- appVersion 0.4.0 to 0.5.0. No schema change (task scores are flat objects of numbers, already allowed); `docs/data-schema.json` unchanged.
- `styles/components.css`: task material (rule and scenario cards, the two-by-two card grid, reasons list, evidence notice, confidence scale using the Likert group with six points); specimen added to `styleguide.html`.
- `docs/ITEM-BANK.md`: task item fields, sources and the generated item table. `docs/VALIDATION-PLAN.md`: provisional rules for the tasks. `docs/OPEN-DECISIONS.md`: D-12 to D-17, R-7 and R-8; D-3, D-10, R-3 and R-6 updated. `docs/ARCHITECTURE.md`, `README.md` and `CLAUDE.md` updated.
- Tests: `tests/critical.test.mjs` (pool rules, keys derived from each item's own data, all-or-nothing scoring, select-all and select-none score 0, no fixed card choice above 2 of 8, always-first at chance, always-100% confidence worse than always 50%, revision indices, missing data). `tests/self-report.test.mjs` and `tests/e2e/hub.e2e.mjs` now read the current scoring version; the e2e self-report test uses Creativity (Critical thinking now has practice tasks); the programme battery answers the new tasks; new e2e test of the critical thinking practice and assessment flow.

### S8. Creativity (2026-11-27)

- Added the tasks to `src/skills/creativity/index.js`: `cr-t1` Alternate uses and `cr-t2` Problem finding, both type `idea-list` (`ideas.js`): one fixed item per form, a 3-minute timer from the core timer with the accommodation multiplier, pause (text box locked) and "Add 1 minute" in the last 30 seconds, a text box with one idea per line and a live count, drafts autosaved and resumed. No feedback in assessment mode. Practice feedback lists every line with its kind or the reason it did not count, the kinds used, and up to three kinds not yet tried with hints.
- Scoring (`ideas-score.js`, `text.js`): normalisation, British and American spellings, a dictionary-checked stemmer, one-edit typing errors; unscorable lines (non-words, under two meaningful words, near-duplicates) counted and never credited; fluency, flexibility (distinct categories; no "Other"), originality (mean points per valid idea from the frequency table; matched by whole stems, never by reverse substring), and counts of uncommon, unlisted and uncategorised ideas. Reported separately; no blend. `summary.js`: per-facet skill summary that never combines originality with fluency. `llm-scorer.js`: optional language-model scorer interface, disabled, no network call.
- Content, all draft and new: `content/creativity/cr-t1.js` (cardboard box, glass jar; practice pencil and towel), `cr-t2.js` (sharing a flat, part-time job; practice weekend trip), with 12-category taxonomies on every form; frequency tables `aut-norms.js` and `problem-norms.js`, marked "provisional, author-estimated, replace with pilot norms"; `wordlist.js` (SCOWL, generated by `tests/write-wordlist.mjs`) with `SCOWL-COPYRIGHT.txt`.
- Runner: a timer saved while running now resumes paused at the moment of its last save, so time away from the page is not counted (`createTimer` in `src/skills/runner.js`).
- **scoringVersion 1.1.0-draft to 1.2.0-draft.** New section in `docs/SCORING.md`. Earlier scoring unchanged.
- appVersion 0.5.0 to 0.6.0. No schema change: task scores are flat numbers and responses any JSON; `docs/data-schema.json` unchanged.
- `styles/components.css`: idea-list task (prompt card, timer, text box, live count, feedback list, tag row); specimen in `styleguide.html`.
- `docs/ITEM-BANK.md`: creativity item fields, sources (including the word list) and item table. `docs/VALIDATION-PLAN.md`: provisional creativity rules. `docs/OPEN-DECISIONS.md`: D-18 to D-24, R-9 to R-11; D-3, D-8, D-10, R-3 and R-6 updated. `docs/ARCHITECTURE.md`, `docs/DATA-SCHEMA.md`, `README.md` and `CLAUDE.md` updated.
- Tests: `tests/creativity.test.mjs` (content rules, every table example matched to its own entry, parallel forms, text handling, unscorable lines, no reverse substring, points, adversarial patterns on every form, padding invariance, ten varied ideas above six common ones, score shape, summary, disabled scorer sends nothing). `tests/registry.test.mjs`: running-timer resume. `tests/e2e/hub.e2e.mjs`: creativity practice (live count, pause, reload, feedback) and assessment (extended time, Add 1 minute, expiry, no feedback); the programme battery answers the idea-list tasks; the self-report test no longer expects Creativity practice to be unavailable.
