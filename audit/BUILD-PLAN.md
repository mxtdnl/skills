# 5C Skills Assessment: Build Plan

This plan turns the findings in `audit/AUDIT-REPORT.md` into Claude Code sessions. Each session:

- fits in one Claude Code session;
- leaves the repository working and tested;
- ends with a commit on its own branch.

Finding IDs (e.g. `K-1`, `B-2`) refer to the audit report.

## How to use this plan

1. Run the sessions in order. A session marked **Gate** needs a human decision or sign-off before the next one starts.
2. Paste the **Prompt** block into a fresh Claude Code session at the repository root.
3. Check the **Done when** list before merging.
4. Every prompt assumes Claude reads `CLAUDE.md` first. Session 0 creates that file.

## Decisions log

| Date | Decision | Effect on this plan |
|---|---|---|
| 2026-11-26 | Prototype is not in use with students | S1 (legacy hotfixes) is **skipped** |
| 2026-11-26 | Opening directly from a file is not required; the tool is served over HTTP (GitHub Pages, or a local server for previews) | S3 uses ES modules; the slides repo's `file://` rule does not apply to this repository |
| 2026-11-26 | Consent wording drafted by Claude is acceptable | S5 writes final consent text; no placeholder. Programme-evaluation use may still need Hult data protection approval outside this repository. |
| 2026-11-26 | Skill definitions drafted | `docs/CONSTRUCTS.md` exists; the S2 gate is pending owner sign-off |
| 2026-11-26 | Owner answered the first round of construct questions (`docs/CONSTRUCTS.md`, revision 2) | S7: four tasks, not three: add CT-T4 (statistical and base-rate reasoning), a revision step in calibration, and perspective-taking items in argument evaluation. S8: passages are business and academic; automated originality scoring where the no-network rule allows. S9: information-seeking topics mainly business, psychology, economics and politics. S10: SJT scenarios mix Hult and generic settings; SJT keying rule still open. Results (S11): per-skill and per-facet, with a confidence flag per facet. The S2 gate still needs Hult sign-off |

## Global rules (repeated in CLAUDE.md, so they apply to every session)

- **No invented facts, item keys or statistics.** Draft content is prefixed `PLACEHOLDER:` or marked `status: "draft"` in the item bank, and is listed at the end of the session.
- **Item content is draft until reviewed by Hult staff.** Claude writes candidate items; humans approve them.
- **Never copy proprietary test items.** Avoid widely circulated items such as the CRT.
- **Every change to scoring bumps `scoringVersion` and updates `docs/SCORING.md`.**
- **No individual change claims in the UI** until `docs/VALIDATION-PLAN.md` records pilot-based thresholds.
- **UK English. System fonts only. No network calls. Zero border-radius** (except 50% circles). Design tokens come from `styles/tokens.css`.
- Practice items and assessment items are separate pools and never mix.

## Phase overview

| Phase | Sessions | Outcome |
|---|---|---|
| 0. Foundations | S0, S1, S2 (Gate) | Docs, tests, legacy hotfixes, signed-off construct definitions |
| 1. Platform | S3, S4, S5 | Module architecture, design system, skill hub with persistence and modes |
| 2. Measures | S6–S10 | Rebuilt self-report plus two or three tasks per skill, forms A/B, practice pools |
| 3. Results and data | S11, S12, S13 | Results views, PDF/JSON/CSV export and import, coach/cohort view |
| 4. Quality and validation readiness | S14, S15 | Accessibility/fairness pass, e2e tests, pilot protocol, version freeze |

Estimated total: 16 sessions. Sessions S6–S10 are independent of each other once S5 is merged and can run in any order.

---

## Phase 0: Foundations

### S0. Repository foundations: CLAUDE.md, README, docs skeleton, test harness

**Why:** M-1, and the evidence harness becomes the regression base.

**Prompt:**

```text
You are working in the mxtdnl/skills repository. Read audit/AUDIT-REPORT.md and audit/BUILD-PLAN.md in full first. Then read the CLAUDE.md files of the sibling reference repositories for conventions (clone read-only if needed: https://github.com/mxtdnl/slides and https://github.com/mxtdnl/third-places).

Goal: repository foundations only. Do not change the behaviour of skills-assessment-hult.html in this session.

1. Create CLAUDE.md at the repository root, modelled on the structure of slides/CLAUDE.md. Include:
   - project purpose (formative self-reflection, coaching input and programme evaluation of Hult's 5C skills);
   - a Files section;
   - technical conventions: no-build vanilla JS, system fonts only, no network calls, UK English, straight quotes in JS, localStorage namespacing `skills5c:v<N>:*` wrapped in try/catch;
   - the Global rules section from audit/BUILD-PLAN.md, verbatim;
   - a Visual style section that defers to the reference system: copy the tokens tables (light theme, eight accents, ink tones, feedback colours), geometry, typography, components and motion rules from slides/CLAUDE.md, plus the 5C accent mapping in audit/AUDIT-REPORT.md section J-4;
   - Workflow and Testing sections.
2. Create README.md: what the tool is, its current status (legacy prototype, rebuild in progress, link to audit/), how to run it locally (python3 -m http.server), how to run tests.
3. Create docs/ with these files, each with headings and a short statement of purpose but no invented content. docs/CONSTRUCTS.md already exists: do not modify it.
   SCORING.md, ITEM-BANK.md, DATA-SCHEMA.md, VALIDATION-PLAN.md, DESIGN.md (pointer to CLAUDE.md visual style), CHANGELOG.md.
   In SCORING.md, document the CURRENT legacy scoring formulas exactly as implemented (weights, thresholds, line references), labelled "legacy, scoringVersion 0.1.0, known defects: see audit".
4. Create tests/:
   - tests/legacy-scoring.test.mjs: port audit/evidence/harness.mjs and attacks.mjs into characterisation tests using node:test and node:assert. They assert the CURRENT outputs (e.g. keyword salad = 86), so later fixes change them deliberately.
   - tests/lint.mjs: adapted from slides/tests/lint.mjs. Check every .html and .css file outside audit/ and legacy/ for:
     - charset first in head;
     - no http(s) URLs in src/href/url()/@import/fetch;
     - no curly quotes in scripts;
     - no border-radius other than 0 or 50%.
     The legacy file is exempt via an allowlist that prints a warning, not a failure.
   - package.json with "type": "module" and scripts: "test" (node --test tests/), "lint" (node tests/lint.mjs). No dependencies other than an optional devDependency on playwright for later sessions.
5. Move skills-assessment-hult.html to legacy/skills-assessment-hult.html and add a root index.html that links to it with a "legacy prototype" notice (temporary; replaced in S5). Update the audit evidence scripts' paths.
6. Add a LICENSE placeholder file with the text "PLACEHOLDER: licence to be chosen by the owner" and note it in the final report.

Run npm test and npm run lint. Commit on a new branch named build/s0-foundations. Report: files created, test results, every PLACEHOLDER.
```

**Done when:**
- CLAUDE.md, README.md, docs/* and tests/* exist.
- `npm test` passes, with characterisation tests reproducing `audit/evidence/results.txt`.
- The legacy tool still runs from `legacy/`.

---

### S1. Legacy hotfixes — SKIPPED (prototype not in use; see Decisions log)

**Why:** K-1, K-2, K-3, C-2, B-2, B-5, I-1, F-3, F-4. Skip this session if no students use the prototype before the rebuild ships.

**Prompt:**

```text
Read CLAUDE.md, audit/AUDIT-REPORT.md and docs/SCORING.md. Work only on legacy/skills-assessment-hult.html. These are minimal hotfixes to stop the prototype misleading students; do not redesign it.

Fix:
1. K-1 Wason double-fire.
   - Remove the permanent addEventListener on #wason-btn and drive it only through one handler that checks state.wason.submitted.
   - Add a Playwright check: one click on Confirm shows feedback and stays on the same problem.
2. K-2 Faking warning hidden by loadSAPage. Remove the student-facing warning entirely (see F-4) and remove the faking-based reweighting in computeAllComposites. Keep recording faking-item responses in state for export.
3. K-3 Double-counting: moot after step 2. Confirm with a test.
4. C-2 Remove the within-person "split-half" consistency computation, badge and notice.
5. B-2 AUT originality:
   - remove the reverse substring match (c.indexOf(text));
   - responses whose tokens are mostly not English dictionary words score originality 0 and count as unscorable. Use a small embedded wordlist; document its source and licence or mark PLACEHOLDER.
6. B-5 Do not default missing task scores to 0.5. Show "not completed".
7. I-1 Make Info Gap topic cards buttons (keyboard operable, aria-expanded).
8. F-3 Replace the Google Fonts link with the system font stack.
9. A-3 Correct the octopus sentence. Mark the Tacoma, mycorrhizal and Pirahã texts "PLACEHOLDER: source needed" for owner review.
10. A-10 Change the intro sentence "compared against task performance" to an accurate description.
11. Add a visible banner on intro and results: "Prototype: scores are indicative only and are not validated."

Bump the legacy scoringVersion to 0.2.0 in docs/SCORING.md and docs/CHANGELOG.md. Update the characterisation tests to the new expected values and explain each change in the commit message. Run npm test and npm run lint. Commit on build/s1-legacy-hotfix.
```

**Done when:**
- The Wason test passes.
- No consistency badge or faking warning appears.
- Gibberish AUT input scores originality 0.
- Topic cards are keyboard operable.
- No external requests on load.

---

### S2. Construct definitions draft **(Gate: Hult sign-off)**

**Status:** Draft written (`docs/CONSTRUCTS.md`). Only the sign-off remains. Run the prompt below only if the draft needs regenerating; otherwise edit the file directly with reviewer changes.

**Why:** A-0. Items cannot be written against undefined constructs.

**Prompt:**

```text
Read CLAUDE.md and audit/AUDIT-REPORT.md sections A and 5.

Draft docs/CONSTRUCTS.md for Hult's five core skills: Collaboration, Curiosity, Critical Thinking, Creativity, Communication. For each skill write:
- a one-sentence working definition;
- 2 to 4 facets, each with a definition and two observable behaviours of an undergraduate who is strong and two of one who is developing;
- what is out of scope;
- the planned measures (from audit section 5), mapped to facets in a coverage table (facet x measure);
- open questions for Hult reviewers.

Rules:
- Do not attribute any definition to Hult. Mark the whole document "DRAFT for Hult review".
- Where a facet is informed by published work, cite only sources you are confident exist (as in the audit references). Otherwise give no citation.
- Write in plain UK English.

Also add a short docs/REVIEW-CHECKLIST.md that Hult reviewers can use to approve each skill (content coverage, wording for L2 readers, cultural neutrality, alignment with Hult teaching).

Commit on build/s2-constructs. Report the open questions as a numbered list.
```

**Gate:** A Hult reviewer approves or edits CONSTRUCTS.md. Record the approval (name or role, date) in the file header before starting S6.

---

## Phase 1: Platform

### S3. Architecture: skill-module platform skeleton

**Why:** K-4, C-3, D-1, D-6; architecture in audit section 4.

**Decided:** ES modules served over HTTP. `file://` is not supported.

**Prompt:**

```text
Read CLAUDE.md, audit/AUDIT-REPORT.md section 4, docs/DATA-SCHEMA.md and docs/CONSTRUCTS.md.

Build the platform skeleton for the rebuilt tool, no UI polish yet (S4 does design). Vanilla ES modules, no build step, served over HTTP (document in README that file:// is not supported and why).

Create:
- src/core/rng.js: seeded PRNG (e.g. mulberry32) and an unbiased Fisher-Yates shuffle. Tests: same seed gives same order; distribution test over 10,000 shuffles.
- src/core/ids.js: random pseudonymous participant ID (no names, no emails), and sitting IDs.
- src/core/store.js: a storage adapter interface {load, save, list, remove, exportAll, importAll} with a LocalStorageAdapter (key prefix skills5c:v1:, try/catch, in-memory fallback with a visible "progress will not be saved" notice) and a MemoryAdapter for tests.
- src/core/schema.js: the data model as JSDoc types plus a validate() function. Records:
  - Participant {id, createdAt, languageBackground?(optional, consented), consent}
  - Sitting {id, participantId, mode: "practice"|"assessment", formId, seed, appVersion, scoringVersion, startedAt, completedAt}
  - TaskAttempt {sittingId, skillId, taskId, itemResponses:[{itemId, response, rtMs, shownAt}], rawScore, score, scoringVersion}
  - SelfReport {sittingId, skillId, responses, score}
  Write docs/DATA-SCHEMA.md from this, and docs/data-schema.json as JSON Schema.
- src/core/migrate.js: versioned migrations with a test.
- src/core/timing.js: end-timestamp timers with pause, extend and accommodation multiplier (for E-3, I-5).
- src/core/router.js: hash-based routing (#/hub, #/skill/<id>, #/task/<skill>/<task>, #/results/<skill>, #/profile).
- src/skills/registry.js: loads skill manifests. Define the skill module contract in docs/ARCHITECTURE.md:
  {id, label, accentToken, facets, selfReport, tasks:[{id, type, estMinutes, mount(el, ctx), score(attempt, form)}]}
- One stub skill module (src/skills/_example/) with a trivial task, to prove the contract end to end.
- content/ directory convention: content/<skill>/<task>.js exporting {formA, formB, practice} item arrays, each item {id, status:"draft"|"reviewed", ...}.
- tests for rng, store, schema, migrate, timing, registry (node:test).

Do not port any legacy task yet. Run npm test and lint. Commit on build/s3-platform.
```

**Done when:**
- The stub skill runs end to end in the browser and its attempt is saved to and restored from localStorage.
- All core tests pass.

---

### S4. Design system port

**Why:** J-1 to J-4, I-3, I-6, I-8, F-3.

**Prompt:**

```text
Read CLAUDE.md (Visual style), the reference repos' CLAUDE.md design sections (mxtdnl/slides, mxtdnl/third-places), and audit/AUDIT-REPORT.md section J.

Create the design system for the rebuilt tool:
- styles/tokens.css: the light-theme tokens, eight accents, ink tones and feedback colours copied exactly from slides/CLAUDE.md, plus semantic skill tokens:
  --skill-collaboration: var(--accent-2); --skill-curiosity: var(--accent-4) (text: --accent-4-ink); --skill-critical: var(--accent-1); --skill-creativity: var(--accent-6); --skill-communication: var(--accent-3).
- styles/base.css: system font stack, type scale, focus-visible styles (thick accent outline), prefers-reduced-motion rule, print base.
- styles/components.css with component classes following the reference naming conventions:
  - buttons (primary, ghost, accent variants);
  - cards with an accent rail;
  - eyebrow, lede;
  - likert as a radio group (real input[type=radio] with visible labels, not buttons);
  - choice cards (aria-pressed);
  - timer ring with pause/extend controls;
  - progress dots;
  - feedback boxes (correct/incorrect/ambiguous);
  - notice;
  - skill tile;
  - results bar with uncertainty band;
  - colour-block banner;
  - decorative geometry helpers (.geo-square, .geo-circle, .geo-bar, .geo-tri, with position absolute, pointer-events none, and the opacity rules).
- assets/: one Hult logo file. Extract one copy of the base64 PNG from legacy/skills-assessment-hult.html to assets/hult-logo.png. If an official SVG is supplied later, replace it. Add a favicon.
- styleguide.html: a living specimen page showing every token and component in every state, with the five skill accents. Use it for visual review.
- Extend tests/lint.mjs with a contrast check: parse tokens.css and fail if any text/background pair listed in a CONTRAST_PAIRS table is below 4.5:1 (3:1 for large text and UI components).

Do not use the legacy styles. Take full-page screenshots of styleguide.html at 1280px and 390px with Playwright (deviceScaleFactor 2) and report them. Commit on build/s4-design-system.
```

**Done when:**
- styleguide.html renders all components.
- Lint passes, including contrast.
- No border-radius other than 0 or 50%.
- No web fonts.
- Screenshots reviewed by the owner.

---

### S5. Skill hub, flow, consent and modes

**Why:** R1, H-1, H-3, D-1, F-2, G-2.

**Prompt:**

```text
Read CLAUDE.md, docs/ARCHITECTURE.md, docs/DATA-SCHEMA.md and audit sections H, D, F, G.

Build the application shell in index.html using the platform (S3) and design system (S4):

1. First-run flow:
   - welcome screen (Hult logo, purpose, what is stored and where, prototype notice);
   - consent step: separate checkboxes for (a) using the tool and (b) allowing exported data to be used for programme evaluation. Write final, plain-English wording (owner has approved Claude-drafted wording). It must state:
     - what is stored and where (this browser only);
     - that nothing is sent anywhere unless the student exports a file and chooses to share it;
     - what programme evaluation means;
     - that consent (b) can be withdrawn by asking the coach to delete their file.
     Record the consent wording version in the data;
   - optional language-background question, clearly optional, explained as used only for fairness checks;
   - pseudonymous ID shown with a "save this code" prompt.
2. Skill hub (#/hub):
   - five skill tiles in their accents, each showing facets, estimated minutes and status (not started / in progress / complete per mode);
   - last activity date;
   - decorative geometry per reference style.
3. Mode selection per skill:
   - Practice (practice pool, immediate feedback, unlimited, never counted);
   - Assessment sitting (assigned form, no feedback until the skill is complete, one recorded sitting per window).
   Form assignment: counterbalanced, using the parity of a hash of the participant ID: even means A first, odd means B first. Store which form was used.
4. Skill page (#/skill/<id>): ordered list of that skill's self-report and tasks, resumable at item level. Back and exit allowed between tasks. Exiting mid-task asks for confirmation and saves.
5. Programme sitting mode (for start and end of programme): a coach-provided sitting code switches the hub into "full battery" with a fixed, recorded skill order.
6. Settings: extended time (x1.5, x2), reduced motion, reset all data (with typed confirmation), export/import (stubs wired to S12).
7. Autosave after every item response. Restore exactly on reload. Playwright test: answer items, reload, continue.

Port nothing from the legacy tasks; use the S3 stub skill to exercise the flow. Commit on build/s5-hub.
```

**Done when:**
- Any skill can be started, left and resumed.
- Reload restores the exact position.
- Practice and assessment are stored separately.
- Form assignment is recorded.
- Keyboard-only run of the whole shell passes.

---

## Phase 2: Measures

Each S6–S10 session follows the same shape:

1. **Content:** draft item banks (Form A, Form B, practice pool), all `status: "draft"`, written against the facets in docs/CONSTRUCTS.md, with L2-friendly wording.
2. **Task UI.**
3. **Scoring:** deterministic, documented in docs/SCORING.md, versioned.
4. **Adversarial tests:** gibberish, keyword stuffing, all-select, straight-lining, speed-clicking, empty input. Each must score at or near the floor.
5. **Practice feedback:** explanations and worked examples.

S6 (self-report) should be merged first because S7–S10 reuse its component.

### S6. Self-report rebuild (all five skills)

**Why:** A-8, A-9, C-2, F-4, D-5.

**Prompt:**

```text
Read CLAUDE.md, docs/CONSTRUCTS.md (approved), docs/SCORING.md and audit sections A-8, A-9, C-2, D-5.

Build the self-report component and content for all five skills.

Content (content/<skill>/self-report.js):
- 8 to 10 items per skill, covering every facet, about half positively and half negatively keyed (record keying per item).
- Use IPIP items where they match a facet (public domain; cite the IPIP scale and item code in the item metadata). Otherwise write new items marked draft.
- Plain UK English, one idea per item, no idioms, no double negatives.
- 5-point agreement scale with all points labelled.
- Optional end-of-programme retrospective item per facet ("Looking back, at the start of the programme I would have rated myself...") enabled only in programme sittings flagged "end".
- Remove forced-choice items and faking items entirely.

Scoring (src/skills/common/self-report-score.js):
- Reverse-key items; facet means and skill mean on a 1 to 5 scale (not 0 to 100).
- Response-quality indicators recorded in the attempt but NEVER shown as accusations to students:
  - straight-lining (all identical);
  - median response time under 1 second per item;
  - long identical runs.
  Visible only in the coach view.
- No within-person "consistency" statistic.

UI: radio-group Likert (S4 component), one facet per screen, progress within the skill.

Tests:
- reverse-keying correctness;
- straight-liners get the midpoint-adjacent score their answers imply, with no penalty, and the quality flag set;
- missing items are handled explicitly.

Update docs/SCORING.md (self-report section, scoringVersion 1.0.0-draft) and docs/ITEM-BANK.md (item table with sources). Commit on build/s6-self-report.
```

### S7. Critical thinking

**Why:** A-4, B-4, K-1.

**Prompt:**

```text
Read CLAUDE.md, docs/CONSTRUCTS.md (critical thinking), docs/ARCHITECTURE.md and audit sections A-4, B-4.

Build the critical thinking skill module with three tasks. Each has Form A, Form B and a practice pool; the forms are matched on item type counts and intended difficulty.

1. Conditional reasoning (selection task family):
   - 8 items per form: 4 abstract, 4 deontic, reported as separate sub-scores;
   - vary negations in antecedent and consequent so that the correct card set is not always "the first-mentioned and the negated second";
   - culturally neutral content (km/h, no country-specific ages);
   - all-or-nothing scoring per item;
   - no feedback in assessment mode; worked explanation in practice mode.
2. Argument and evidence evaluation:
   - 8 items per form; short scenarios (80 words maximum, plain English) with 4 options: identify the flaw / the assumption / the strongest evidence / what would weaken the claim;
   - single defensible key per item, with a written rationale stored with the item.
3. Calibration:
   - 10 two-alternative general-knowledge or estimation items per form, each with a 50 to 100% confidence rating;
   - score accuracy and calibration (mean confidence minus accuracy; Brier score);
   - items must have verifiable answers with a source URL in item metadata. If you cannot verify an answer, do not include the item.

Adversarial tests:
- select-all and select-none score 0 on selection items;
- always-option-A scores at chance;
- always-100%-confidence produces poor calibration.

Practice feedback explains the logic.

Update docs/SCORING.md and docs/ITEM-BANK.md. List every draft item for review. Commit on build/s7-critical-thinking.
```

### S8. Creativity

**Why:** A-6, B-2, E-1, E-3.

**Prompt:**

```text
Read CLAUDE.md, docs/CONSTRUCTS.md (creativity) and audit sections A-6, B-2, E-1, E-3.

Build the creativity skill module.

1. Alternate Uses Task:
   - one FIXED object per form (Form A and Form B objects chosen to be similar in familiarity; practice pool uses other objects);
   - 3 minutes, using the core timer with accommodation multiplier and pause;
   - one response per line, live count.
   Scoring, all components reported separately (no hidden weighted blend):
   - fluency = valid unique responses;
   - unscorable detection (mostly non-dictionary tokens, under 2 meaningful words, near-duplicates);
   - flexibility = number of distinct categories from a revised per-object taxonomy (no "Other" credit);
   - originality from a per-object frequency table in content/creativity/aut-norms.js, marked "provisional, author-estimated, replace with pilot norms". Responses are matched to table entries by normalised tokens and synonyms, never by reverse substring.
   - Add an optional scorer interface src/skills/creativity/llm-scorer.js that is disabled by default and documented as requiring a backend proxy and data protection sign-off. It must not make any network call in this session.
2. A second task, consequences or problem finding ("What problems might a student face when ..."; 3 minutes):
   - fluency and category breadth via taxonomy;
   - originality via provisional frequency table, as above.
3. Report raw indicators and a skill-level summary that does not combine originality with fluency.

Adversarial tests: gibberish, one repeated phrase, filler-padded common uses and empty input each score at or near the floor. Ten sensible varied uses score above six common uses.

Practice feedback shows the student's categories and suggests unexplored ones. Update docs. Commit on build/s8-creativity.
```

### S9. Communication

**Why:** A-7, B-1, E-1.

**Prompt:**

```text
Read CLAUDE.md, docs/CONSTRUCTS.md (communication) and audit sections A-7, B-1, E-1.

Build the communication skill module, designed to keep English production load low for L2 students.

1. "Which is clearer?":
   - 10 paired versions per form, each pair differing on one clarity dimension (ambiguity, buried key point, jargon, missing reasoning, register, structure);
   - the student picks the clearer version and the reason (from 4 options);
   - single defensible key per pair with rationale.
2. "Spot the problem":
   - 6 unmarked passages per form; the student selects the sentence with the problem and the problem type;
   - all-or-nothing per part.
3. One rewrite:
   - a short passage; the student rewrites it, then completes a 5-point self-check rubric (main point first, audience-appropriate words, reasons given, unambiguous references, appropriate register);
   - store the text;
   - no automated quality score in this session. Record a "coach-scorable" flag. Optional LLM rubric scoring goes through the same disabled interface pattern as in S8.

Delete all legacy keyword, concision, specificity and novelty formulas. None may be ported.

Adversarial tests: always-first-option scores at chance; random selection scores at chance.

Practice mode explains each key. Update docs. Commit on build/s9-communication.
```

### S10. Curiosity and Collaboration

These can be split into two sessions if context is tight.

**Why:** A-2, A-3, B-3 (curiosity); A-5, F-1 (collaboration).

**Prompt (curiosity):**

```text
Read CLAUDE.md, docs/CONSTRUCTS.md (curiosity) and audit sections A-2, A-3, B-3.

Build the curiosity skill module.

1. Information seeking with a cost:
   - 16 questions per form across varied domains;
   - per question the student rates prior knowledge (1-5) and curiosity (1-5);
   - then, with a budget of 6 tokens, chooses which answers to unlock; reading an answer is timed.
   Scores:
   - proportion of unlocks targeted at self-rated knowledge gaps (low/moderate knowledge with high curiosity);
   - mean curiosity rating;
   - reading time on unlocked answers (recorded, not scored, until the pilot).
   Every answer text must carry a source in item metadata. Contested topics are framed as contested. Do not reuse the legacy topic texts without verifying them.
2. Question generation:
   - a short stimulus (scenario or image description);
   - 3 minutes to write questions;
   - a transparent rule set classifies each as explanatory/causal (why/how/what if) or factual (who/what/when/where), with unscorable detection;
   - report count and explanatory proportion.
   The rules are listed in docs/SCORING.md.

Adversarial tests:
- unlocking at random gives no gap-targeting advantage;
- typing "why why why" lines is detected as unscorable.

Update docs. Commit on build/s10a-curiosity.
```

**Prompt (collaboration):**

```text
Read CLAUDE.md, docs/CONSTRUCTS.md (collaboration) and audit sections A-5, F-1, and section 3 point 3. The Public Goods Game is removed and must not be ported.

Build the collaboration skill module.

1. Situational judgement test:
   - 10 team scenarios per form (student project groups, plain English, culturally neutral), each with 4 response options;
   - the student rates each option's effectiveness (1-4);
   - keys come from an expert panel: until supplied, every key is "PLACEHOLDER: expert key". Scoring compares ratings with the key (mean absolute distance, converted to a 0-1 agreement score) and is disabled with an explanatory message while keys are placeholders.
2. Hidden-profile team task with DISCLOSED simulated teammates:
   - tell the student explicitly that teammates are scripted;
   - the team must choose one of three options; each teammate holds unshared facts;
   - the student can share facts, ask a teammate a question, or propose a decision;
   - scripted teammates reveal unshared facts only when asked;
   - scores: proportion of own unshared facts shared, number of targeted questions, decision correctness.
   Optionally review https://github.com/mxtdnl/hidden-profile-paradigm (read-only) for reusable logic and say what you reused.
3. Document in docs/CONSTRUCTS.md and on the results page that real collaborative skill is best evidenced through peer evaluation of real group work, planned for Hult-systems integration.

Adversarial tests:
- sharing everything immediately without asking scores below sharing plus asking;
- random proposals score low on decision correctness.

Update docs. Commit on build/s10b-collaboration.
```

---

## Phase 3: Results and data

### S11. Results and feedback views

**Why:** B-6, C-1, D-3, G-1, I-4.

**Prompt:**

```text
Read CLAUDE.md, docs/SCORING.md and audit sections B-6, C-1, D-3, G-1, I-4.

Build results views.

1. Per-skill results (#/results/<skill>), available as soon as that skill is complete:
   - performance indicators per task and facet in plain language;
   - self-report facet scores;
   - a calibration panel contrasting self-view with performance, worded as a reflection prompt, not a verdict;
   - what each measure does and does not capture;
   - 2 or 3 development suggestions per facet, linked to practice-mode tasks (content marked draft).
2. Profile (#/profile):
   - one row per skill with separate performance and self-report columns;
   - NO composite score and NO radar chart by default;
   - no cross-skill ranking language ("highest", "weakest");
   - charts are accessible SVG bars with text equivalents.
3. Progress (#/progress), shown only when two assessment sittings exist:
   - side-by-side values with the form used;
   - until docs/VALIDATION-PLAN.md contains pilot thresholds, show the banner "Change cannot yet be interpreted for individuals" and no up/down arrows. Implement the RCI calculation behind a config flag with placeholder reliabilities marked PLACEHOLDER.
4. Print stylesheet producing an A4 PDF personal report via window.print(): Hult logo, participant code (no name), date, sitting mode and form, per-skill pages, limitations page. No PDF library.

Playwright: screenshot each view at 1280px and 390px. Keyboard-only navigation test. Commit on build/s11-results.
```

### S12. Export and import (JSON, CSV)

**Why:** R5, L-1, L-2, D-6.

**Prompt:**

```text
Read CLAUDE.md, docs/DATA-SCHEMA.md and audit section L.

Implement data export and import.

1. JSON export: the complete participant record (participant, consent, sittings, attempts with item-level responses and timings, self-reports, versions), validated against docs/data-schema.json before download. Filename: skills5c-<participantId>-<YYYY-MM-DD>.json.
2. JSON import:
   - validates and runs migrations;
   - merges by sitting ID without duplicates;
   - reports what was added;
   - refuses files with an unknown schemaVersion, with a clear message.
3. CSV export, long format, two files:
   - responses.csv: participantId, sittingId, mode, formId, seed, skillId, taskId, itemId, itemStatus, response, correct, rtMs, shownAt, scoringVersion, appVersion;
   - scores.csv: participantId, sittingId, mode, formId, skillId, measure, facet, value, scale, scoringVersion.
   - UTF-8 with BOM for Excel, RFC 4180 quoting.
4. Only data covered by consent (b) is marked "evaluationConsent: true" in exports; the coach view (S13) filters on it.
5. Rescore utility: src/report/rescore.js recomputes scores from raw responses under the current scoringVersion, used by import and the coach view.

Tests:
- round trip (export → import → identical state);
- CSV quoting of commas, quotes and newlines in rewrite text;
- migration from a v0 fixture;
- rescore stability.

Document formats in docs/DATA-SCHEMA.md. Commit on build/s12-export.
```

### S13. Coach and cohort view

**Why:** Suite scope (coach/cohort), C-2 (correct place for reliability statistics), D-4, E-1.

**Prompt:**

```text
Read CLAUDE.md, docs/DATA-SCHEMA.md, docs/VALIDATION-PLAN.md and audit sections C, D, E.

Build cohort.html: a client-side coach/programme view. No server, no network.

1. Import many JSON exports (drag and drop or file picker), deduplicate, rescore to the current scoringVersion, and filter to evaluationConsent: true for programme analyses. Individual drill-down is allowed only for records the coach imported.
2. Views:
   - completion per skill and mode;
   - distributions per measure (histograms in SVG);
   - item analysis per scale: difficulty, item-total correlation, Cronbach's alpha with a bootstrap confidence interval; mark output "descriptive, requires n >= PLACEHOLDER";
   - start versus end paired comparison for programme sittings: mean change with a confidence interval, split by form order to show form effects;
   - response-quality flags summary;
   - simple DIF screen: item difficulty by language-background group where n permits, marked exploratory.
3. Export cohort CSVs (merged responses.csv and scores.csv) for R, SPSS or Excel.
4. Statistics functions in src/stats/ with unit tests against hand-computed fixtures.

Commit on build/s13-cohort.
```

---

## Phase 4: Quality and validation readiness

### S14. Accessibility, fairness and end-to-end pass

**Why:** Section I, section E, H-2.

**Prompt:**

```text
Read CLAUDE.md and audit sections E, H and I.

Run a full quality pass on the rebuilt tool.

1. Playwright end-to-end:
   - full keyboard-only run of every skill in both modes;
   - reload/resume at every task;
   - export/import round trip;
   - 390px mobile run;
   - extended-time setting honoured;
   - prefers-reduced-motion honoured.
2. Automated accessibility checks with an axe-core devDependency, run from tests only and never shipped. Zero serious or critical violations.
3. Manual WCAG 2.2 AA checklist in docs/ACCESSIBILITY.md, with each criterion marked pass, fail or n/a and the evidence.
4. Fairness pass over all content files:
   - flag sentences over 20 words, idioms, culture-specific references and passive constructions;
   - produce docs/FAIRNESS-REVIEW.md listing each item and the suggested rewrite.
   Do not auto-apply rewrites to reviewed items.
5. Time each skill with a scripted typical-pace run and update estMinutes; record real per-task durations in attempts for the pilot.
6. Remove legacy/ from the main navigation and keep it archived, with a README note.

Commit on build/s14-quality.
```

### S15. Pilot protocol and version freeze

**Why:** Section 6, D-3, D-4.

**Prompt:**

```text
Read CLAUDE.md, docs/* and audit section 6.

Prepare validation readiness. Do not invent statistics or thresholds.

1. Write docs/VALIDATION-PLAN.md:
   - pilot aims;
   - sample and recruitment (PLACEHOLDER numbers for Hult to set);
   - cognitive interview protocol (5-10 students including L2 speakers);
   - counterbalanced A/B design;
   - test-retest subsample (2-4 weeks);
   - analyses: alpha/omega, item analysis, DIF, form equating, test-retest correlation, SEM, RCI;
   - decision rules for dropping or revising items (stated as rules to be applied, with PLACEHOLDER cut-offs for Hult to confirm);
   - what the tool will display before and after the pilot;
   - the evaluation design for programme claims (comparison options);
   - data protection and ethics steps (PLACEHOLDER: Hult process).
2. Add analysis/ with scripts that run the pilot analyses on merged CSV exports. Use Node (reusing src/stats), or R if the owner prefers. Include synthetic fixture data clearly labelled synthetic, used only to test the scripts.
3. Add a release checklist to docs/CHANGELOG.md for freezing scoringVersion 1.0.0:
   - all items reviewed;
   - collaboration SJT keys supplied;
   - pilot run;
   - thresholds set.
   Tag nothing until the owner confirms.

Commit on build/s15-validation.
```

---

## Dependency map

```
S0 ─┬─ S1 (skipped)
    └─ S2 (Gate) ─┐
S0 ── S3 ── S4 ── S5 ── S6 ─┬─ S7 ─┐
                            ├─ S8 ─┤
                            ├─ S9 ─┼─ S11 ── S12 ── S13 ── S14 ── S15
                            └─ S10 ┘
S2 approval is required before S6–S10.
```

## Human inputs required, by session

| Session | Input |
|---|---|
| S2 | Hult reviewer sign-off of construct definitions |
| S3 | None (decided: ES modules over HTTP) |
| S4 | Official Hult logo SVG and any mandatory brand colour (optional; PNG fallback exists) |
| S5 | None (consent wording drafted by Claude, approved in principle) |
| S6–S10 | Subject-expert review of every draft item |
| S10b | Expert panel keys for the collaboration SJT |
| S15 | Pilot sample sizes, cut-offs, ethics process |
