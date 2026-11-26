# 5C Skills Assessment: Audit Report

Audit date: 26 November 2026
Object of audit: `skills-assessment-hult.html` (single commit `c629630`, 1,389 lines, 482 KB)
Reference design systems: `mxtdnl/slides` and `mxtdnl/third-places` (both read at their default branch on the audit date)

---

## 0. Scope, method and agreed parameters

### 0.1 Requirements audited against

| # | Requirement (from the brief) |
|---|---|
| R1 | Move from a single linear assessment to a skill-by-skill structure |
| R2 | Establish whether the assessments are reliable and valid |
| R3 | Build the suite out further |
| R4 | Replace the current aesthetic with a design system close to `slides` and `third-places` |
| R5 | Add data export |
| R6 | Add a CLAUDE.md and better documentation |
| R7 | (Implied by the brief) Build skills, not only assess them, and track progress over time |

### 0.2 Decisions confirmed before the audit

| Question | Answer | Consequence for the audit |
|---|---|---|
| Intended use of scores | Student self-reflection, coaching input **and programme evaluation** | Programme evaluation sets the validity bar. Cohort-level reliability, form equivalence and change detection become mandatory, not optional. |
| Deployment | Proof of concept now; Hult systems integration later | Static, client-side build now, with a storage adapter and data schema designed for a later backend or LMS. |
| LLM scoring of open responses | Optional, later | Core scoring must be deterministic and client-side. An LLM hook is designed but disabled. |
| 5C framework | Fixed, no formal definitions | Operational definitions must be written and signed off before any new items are written. |
| Suite scope | More tasks per skill, parallel forms, practice mode, coach/cohort view | All four are in the build plan. |
| Stack | No-build vanilla JS | ES modules plus content files, no bundler. |
| Export | PDF report, JSON (raw, re-importable), CSV (analysis) | All three are specified. |
| Retake cadence | Start and end of programme | Two sittings, about one year apart. This shapes the parallel-form and change-score design. |
| Population | Undergraduates, many with English as a second language | Language load is treated as a primary fairness criterion. |
| Public Goods Game | Replace the task | A replacement collaboration measure is specified. |
| Branding | Keep Hult branding | Hult logo kept, inside the slides/third-places visual language. |

### 0.3 Audit parameters

| Code | Parameter | Question asked |
|---|---|---|
| A | Construct validity | Does each task measure the skill it claims to measure? |
| B | Scoring integrity | Does the score rise with the skill, and does it resist gaming? Tested with scripted adversarial inputs. |
| C | Reliability | Are there enough items? Can internal consistency, standard error or test-retest be estimated? |
| D | Longitudinal fitness | Can two sittings a year apart detect real change rather than memory, form differences or noise? |
| E | Fairness | Language load, cultural content, keyword strictness, timing. |
| F | Ethics and data protection | Deception, consent, third-party requests, how students are labelled. |
| G | Developmental value | Does using the tool build the skill? |
| H | UX and flow | Linearity, resume, navigation, time burden. |
| I | Accessibility | WCAG 2.2 AA: keyboard, labels, contrast, timing, motion. |
| J | Visual design | Gap to the slides/third-places design system. |
| K | Engineering | Architecture, defects, testability, versioning. |
| L | Data and export | What is captured, what can leave the browser, in what form. |
| M | Documentation | README, CLAUDE.md, scoring specification, item provenance. |

### 0.4 Severity scale

| Severity | Meaning |
|---|---|
| **Critical** | Produces wrong or misleading results, or blocks a stated requirement. Fix before any further student use. |
| **High** | Materially undermines validity, fairness, accessibility or a requirement. Fix in the rebuild. |
| **Medium** | Degrades quality or trust; should be fixed. |
| **Low** | Polish or hygiene. |

### 0.5 Method and evidence

1. Full read of the source. Line references are to `skills-assessment-hult.html`.
2. **Adversarial scoring harness.** The tool's own scoring functions were run in a Node VM against scripted inputs. Scripts and raw output are in `audit/evidence/`; reproduce with `node audit/evidence/attacks.mjs skills-assessment-hult.html`.
3. **Exhaustive check of the consistency statistic** over all 3,125 possible Likert response patterns (`audit/evidence/cons.mjs`).
4. **Browser run** in headless Chromium via Playwright (`audit/evidence/browser.cjs`): keyboard access, Wason flow, faking warning, reload behaviour, external requests.
5. **Contrast ratios** computed with the WCAG 2.x relative-luminance formula.
6. Design comparison against the `CLAUDE.md` design specifications in `slides` and `third-places`.

### 0.6 Limits of this audit

- No response data exists, so no empirical reliability or validity statistic could be computed. Every psychometric judgement below concerns design and scoring logic. None of them is an estimate of the actual reliability of this tool.
- Where a judgement rests on published research, the source is named. Where confidence in a claim is below roughly 80%, the text says so.
- Hult brand guidelines were not available. The current palette (`#50164A` and others) appears to be intended as Hult colours; this has not been verified.
- The user's `hidden-profile-paradigm` repository was not inspected. It is mentioned only as a possible starting point.

---

## 1. Executive verdict

**The tool is not fit for programme evaluation. It is unreliable even as a self-reflection prompt, because several of its scores can mislead students about their own abilities.**

The interface is coherent and the code is readable. However:

1. **Two of the five performance scores rank gamed answers above genuine effort.**
   - **Communication:** pasting the hidden keyword list scores **86/100**, while careful human rewrites score **44/100**.
   - **Creativity:** ten lines of gibberish score **61/100**, close to ten sensible, varied uses (**67/100**) and far above six common uses (**27/100**).
2. **A third performance score rewards a disposition, not the skill.** In the Public Goods Game, giving everything every round scores 100% "collaboration", against fictitious players who never respond.
3. **A critical defect** advances the Wason task on the same click that submits an answer, so the feedback is never shown.
4. **The "consistency" statistic shown to every student is meaningless.** It is computed within one person on 3 against 2 items. It flags **62.5% of all possible response patterns**, and it flags everyone who answers consistently.
5. **The composite score hides the most useful signal.** It blends self-report (45%) with performance (55%). A student who rates themselves at the maximum with weak performance (composite 67) outscores a modest student with better performance (composite 53).
6. **Progress over time is impossible today.** There is no persistence, no identifier, no parallel forms and no scoring version, and a page refresh loses everything.
7. **The visual design shares almost nothing with the reference system.** It uses web fonts, rounded corners, hairline borders, an italic serif display face and soft shadows, and dark-theme neon colours are left over in several components.

None of this is unusual for a first prototype. The rebuild needs measurement design first and interface second.

### 1.1 Top findings

| ID | Severity | Finding |
|---|---|---|
| K-1 | Critical | Wason "Confirm" submits and advances in one click; feedback is never shown |
| B-1 | Critical | Message Editing: keyword salad 86, careful rewrites 44 |
| B-2 | Critical | AUT: gibberish earns maximum originality; novel uses containing a common word earn zero |
| A-5 | Critical | Public Goods Game: no real or simulated players; 20 tokens every round = 100% collaboration |
| C-2 | Critical | Within-person "split-half r" is statistically meaningless and shown to students |
| B-6 | High | Composite rewards inflated self-report over performance |
| D-1 | Critical | No persistence, IDs, forms or versioning, so R7 (progress over time) cannot be met |
| B-3 | High | Info Gap: one click on a "novel" card scores 9 times one click on a "non-novel" card |
| B-4 | High | Wason partial credit: selecting all four cards (50) outscores the classic reasoning error (25) |
| I-1 | High | Curiosity task cannot be completed by keyboard; Likert buttons have no accessible names |
| E-1 | High | Communication and creativity scoring is English-keyword-based; penalises L2 writers |
| J-1 | High | Design system mismatch with slides/third-places on every core rule |

---

## 2. Findings by parameter

### A. Construct validity

**A-0 (High). The constructs are undefined.** The five Cs have no operational definitions (confirmed by the user). Each task therefore defines its skill implicitly, and the definitions conflict with one another. For example:

- Curiosity = clicking cards.
- Collaboration = giving tokens.
- Critical thinking = one conditional-reasoning paradigm.

Without written definitions and facets, the tool cannot be checked for coverage, and new items will drift. *Fix:* sign off a `docs/CONSTRUCTS.md` with two to four facets per skill before writing items.

**A-1 (High). One task per skill, single method.** Each skill's performance score comes from one task type. Single-task scores mix the skill with task-specific variance: familiarity, reading speed, typing speed. This is a standard concern in multitrait-multimethod reasoning (Campbell & Fiske, 1959). *Fix:* two or three tasks per skill, of different types.

**A-2 (High). Curiosity: the Information Gap task measures willingness to click.**

- Scoring (`:918-929`) combines breadth, proportion of "novel" cards and domain diversity.
- Cards cost nothing, nothing is recorded about time spent reading, and the student's prior knowledge is not asked. So the task cannot tell curiosity from compliance ("explore as many as you like") or haste.
- The `novel` flag (`:614-628`) is set by the author with no stated rationale. Physics time dilation is "novel" and sleep and memory is "not novel", but novel to whom?
- Information-gap theory (Loewenstein, 1994) and the trivia-curiosity paradigm (Kang et al., 2009) model curiosity *relative to what the person already knows*, and measure it through costly choices (waiting, spending tokens) rather than free clicks.

**A-3 (High). Curiosity content contains factual errors and contested claims presented as fact.** In a curiosity task these teach misconceptions.

| Line | Claim in the tool | Issue | Confidence |
|---|---|---|---|
| `:614` | "Each of their eight arms contains two-thirds of their neurons" | Arithmetic impossibility. The commonly cited figure is that about two-thirds of neurons are in the arms *collectively*. | High |
| `:624` | Tacoma Narrows collapsed because of resonance | The standard engineering account is aeroelastic flutter, and the resonance explanation is a well-known textbook misconception (Billah & Scanlan, 1991). The text's "partly" softens this but does not fix it. | High |
| `:619` | Older trees channel carbon to seedlings through fungal networks | Contested. Karst et al. (2023) argue that these claims are overinterpreted and affected by citation bias. | Moderate–high |
| `:620` | Pirahã has no colour words; challenges language universals | Contested in linguistics (Everett's claims are disputed, e.g. by Nevins, Pesetsky & Rodrigues, 2009). | Moderate |

*Fix:* every fact card cites a source, and contested claims are framed as contested. This mirrors the "no invented facts" rule in the `slides` CLAUDE.md.

**A-4 (High). Critical thinking: the Wason task is one narrow paradigm and is internally confounded.**

- All six problems have the same logical answer structure: P and not-Q, cards `[0,3]` before shuffling (verified: 6/6).
- Four of the six are deontic or social-rule versions (drinking age, approvals, penalties, overtime). These are much easier than abstract versions, a robust content effect (Griggs & Cox, 1982; Cosmides, 1989). The score therefore mixes two different kinds of reasoning with very different difficulty.
- Problem 5 (`:639`) mixes the two framings ("over 70 mph … penalty notice on the other side").
- The skill is broader than the paradigm. Critical thinking also covers argument evaluation, evidence quality, statistical and base-rate reasoning, bias detection and calibration; compare the scope of Halpern's HCTA or Stanovich, West & Toplak's CART (2016). Conditional selection is one facet at most.

**A-5 (Critical). Collaboration: the Public Goods Game.**

- The instructions say "you and three other players" (`:328`, `:606`). **No other players exist, simulated or otherwise.** Nothing they "do" is shown or used.
- Scoring is mean contribution divided by 20, minus a variance penalty (`:1173-1181`). Giving 20 tokens every round scores 100.
- Keeping all tokens is the dominant strategy for an individual, so the score measures unconditional generosity or a misreading of the incentives. It does not measure collaborative skill (communicating, coordinating, sharing information, resolving conflict).
- Public goods research distinguishes conditional cooperation, contributing in response to others (Fischbacher, Gächter & Fehr, 2001). That cannot be observed without others' behaviour.
- The "Est. pool return" display (`:1165`) assumes the others contribute 9 tokens each. That is an invented anchor shown as information.
- Decision taken: replace the task (see §5).

**A-6 (High). Creativity: the AUT implementation departs from how the measure is validly scored.**

- Originality is keyword-based rather than norm-based or rated (see B-2).
- Each sitting draws one of seven objects at random (`:1044-1045`). Objects differ in difficulty, so the forms are not equivalent.
- The comment cites "Guilford 1967", but the 10-category taxonomies per object are written by the author and not taken from Guilford.
- Established originality scoring uses either statistical infrequency against a norm sample, subjective top-k ratings (Silvia et al., 2008), semantic-distance scoring (SemDis; Beaty & Johnson, 2021), or more recently fine-tuned LLM scoring (Organisciak et al., 2023).

**A-7 (High). Communication: the Message Editing task.**

- The problems are underlined in the passage (`:303`, `:670-674`). This removes *diagnosis*, the harder part of clear communication, and leaves only repair.
- "Concision" rewards shortening (`:1132`), but the correct fix for the logical-gap passage is to *add* the missing reasoning, so the scoring penalises the right answer.
- Clarity for an audience is not measured. No reader comprehension is involved.

**A-8 (High). Self-report scales.**

- Five Likert items plus four "forced-choice" items per skill. **Every Likert item is worded so that agreeing means lower skill.** The tendency to agree with statements is therefore confounded with skill: agreeing with everything gives Likert 0, disagreeing with everything gives Likert 100.
- The header claims the forced-choice "pairs [are] matched for social desirability" (`:411-412`). They are not.
  - 13 of 20 pairs differ in score by 0.5 or more, and many have an obvious "right" answer. For example, `:514`: "Stick with it - reconsidering wastes time" scores 0.1.
  - These are scored binary items, not ipsative forced-choice. Real forced-choice formats pair statements from *different* traits matched on desirability and need specialist scoring (e.g. Thurstonian IRT; Brown & Maydeu-Olivares, 2011).
- The floors and ceilings of the forced-choice component differ by skill:

  | Skill | Minimum | Maximum |
  |---|---|---|
  | Creativity | 66 | 95 |
  | Critical thinking | 39 | 100 |

  Self-scores are therefore not comparable across skills even before measurement error.
- Some items are double-barrelled or ambiguously keyed. Collaboration item 4, "I tend to take on more than my share to ensure quality", is keyed as low collaboration, which is defensible but contestable.

**A-9 (Medium). Faking items.** One item per skill ("I have never…") with a threshold of 4 or above. A single lie-scale item cannot tell faking from a genuinely atypical respondent or a misread item. The consequence is to quietly re-weight the composite (`:1191-1195`) and tell the student their responses were "implausible as descriptions of any person" (`:1230`). That is accusatory, and it is based on one click.

**A-10 (Medium). The intro misdescribes the method.** `:164` says "Your survey responses are compared against task performance". They are averaged with it, not compared.

### B. Scoring integrity (adversarial results)

All values come from the tool's own functions (`audit/evidence/results.txt`).

| Input | Score | Expected if valid |
|---|---|---|
| **Message Editing**: careful human rewrites (all five passages) | **44** | High |
| Message Editing: hidden keyword list pasted as the answer | **86** | Near zero |
| Message Editing: original passage pasted back unchanged | **33** | Near zero |
| **AUT (brick)**: 10 gibberish lines ("zorp flim gax to blint") | **61** | Near zero |
| AUT: 10 sensible, varied uses | **67** | High |
| AUT: 6 common uses | **27** | Low–moderate |
| AUT: originality of "use as ballast weight for a narrowboat" | **0** of 2 | 1–2 |
| AUT: originality of "asdf qwerty" | **2** of 2 (maximum) | 0 |
| **Info Gap**: click all 15 cards | **81** | ? |
| Info Gap: click one "novel" card | **45** | Low |
| Info Gap: click one "non-novel" card | **5** | Low |
| Info Gap: click 7 "non-novel" cards | **35** | Moderate |
| **Wason**: correct on all six | 100 | 100 |
| Wason: select all four cards every time | **50** | Near zero |
| Wason: classic matching error (P and Q) | **25** | Near zero |
| **PG**: 20 tokens every round | **100** | n/a (invalid task) |
| PG: 20 tokens declining to 0 (reciprocity-like) | 41 | n/a |
| **Composite**: performance 40, self-report 100 | **67** | Lower |
| Composite: performance 60, self-report 45 | **53** | Higher |

**B-1 (Critical). Message Editing.**

- Keyword matching is substring-based (`:1127`). The logical-gap keyword list includes `"to"` (`:673`), which matches nearly any text.
- Lists include mutually exclusive alternatives ("not approved", "rejected", "declined"), so a natural rewrite cannot reach full keyword credit.
- "Specificity" counts tokens not on a high-frequency list, without stripping punctuation, so `report.` counts as "specific" (`:1136`).
- Result: the formula rewards keyword stuffing and deletion.

**B-2 (Critical). AUT originality is inverted at both ends.**

- `:1027` gives originality 0 if the response contains any "common" phrase, *or if any common phrase contains the response*. "Weight" in "ballast weight for a narrowboat" scores 0.
- `:1028-1029` gives the maximum (2) to anything that matches no keyword, including gibberish.
- Flexibility counts "Other" as a category.
- Elaboration rewards word count plus a connective (`:1032-1040`), so padding raises it.
- Component weights (`:1087`) are arbitrary and undocumented.

**B-3 (High). Info Gap** rewards the author's `novel` labels far more than exploration itself. The 0.40 weight on novelty ratio means a single "novel" click is worth nine times a single "non-novel" click.

**B-4 (High). Wason partial credit** (`:976`) gives 50 for selecting every card, more than the classic reasoning error (25). Partial credit has no defensible basis on this paradigm. Score each item as correct or incorrect.

**B-5 (High). Missing data becomes 50.** `computeAllComposites` replaces `null` with 0.5 (`:1199`). Any skipped or failed task silently appears as 50/100.

**B-6 (High). The composite.**

- The 55/45 weighting is arbitrary.
- Self-report and performance measure different things, the self-concept and the behaviour, and published research generally finds self-assessments only modestly related to measured performance. Blending them hides the calibration gap, which is the most developmentally useful signal.
- The radar chart and narrative ("highest-scoring area… most scope for development", `:1299-1309`) imply that scores on different skills are on a common metric. They are not; there are no norms.
- The "strong / developing / emerging" thresholds (`:1303`) are arbitrary.

### C. Reliability

**C-1 (High). Item counts are too low for individual-level interpretation.**

| Skill | Performance items |
|---|---|
| Curiosity | One free-choice task |
| Critical thinking | 6 near-identical items |
| Creativity | One prompt |
| Communication | 5 passages |
| Collaboration | 6 repetitions of one decision |

The standard error of measurement cannot be estimated without data. On design grounds it should be expected to be large relative to differences between skills and between sittings. This expectation is not a measured value.

**C-2 (Critical). The "split-half internal consistency" statistic is invalid.**

- `:827-836` correlates items 0, 2 and 4 against items 1 and 3 plus a padded 0.5, *within one respondent*. This is not split-half reliability, which is a property of a sample of respondents, not of one person.
- Exhaustive check over all 3,125 response patterns:
  - **62.5%** trigger the "Low internal consistency" notice.
  - **65.6%** get a "Check consistency" badge.
  - **Every** respondent who answers all items the same way gets r = 0.00 and is flagged as inconsistent.
- It is displayed to students as "r=0.00" on every card (see screenshot evidence). *Fix:* remove from the student view. Compute Cronbach's alpha, McDonald's omega and item-total correlations at cohort level in the coach view.

**C-3 (High). No alternate forms or seeded randomisation.**

- AUT objects are random per sitting.
- Topic, problem and passage order is shuffled with `sort(() => Math.random() - 0.5)` (`:889`, `:935`, `:1095`), which is a biased shuffle.
- No seed is recorded, so a sitting cannot be reproduced or audited.

**C-4 (Medium). Unknown and uncontrolled sources of variance:** typing speed (AUT, ME), reading speed in L2, device (phone or laptop), fatigue (fixed order, ME last but one). None of these is recorded.

### D. Longitudinal fitness (two sittings, about one year apart)

**D-1 (Critical). No infrastructure for change measurement.** There is:

- no participant identifier;
- no `localStorage` or other persistence (verified: 0 keys after reload);
- no record of item, form or scoring version;
- no timestamps or raw responses in the export.

A refresh mid-assessment loses all work (verified).

**D-2 (High). Retesting with the same items is contaminated.** Even after a year, the Wason answer structure, the AUT object (if the same one is drawn) and the self-report items are recognisable. *Fix:* at least two parallel forms (A/B), counterbalanced so that half the cohort sits A then B and half B then A. This lets form difficulty be separated from growth.

**D-3 (High). Individual change claims need known reliability.** A student's change should be reported as meaningful only when it exceeds a threshold derived from the measure's reliability, e.g. the Reliable Change Index (Jacobson & Truax, 1991). Until pilot data exist, the tool must not tell a student they have improved or declined.

**D-4 (High). Programme-level attribution.** A cohort mean rising from start to end shows change. It does not show that Hult caused it: maturation, practice and selection effects compete. A credible evaluation needs a comparison, such as a cross-sectional comparison of year groups on the same form, or a matched comparison group.

**D-5 (Medium). Response-shift bias in self-report.** After instruction, students often rate themselves *lower* because their standard has changed (response shift; Howard, 1980). A retrospective "then" rating at the end sitting is a known mitigation.

**D-6 (High). No scoring versioning.** Any change to a formula makes earlier and later scores incomparable unless every result records `scoringVersion` and raw responses are kept so that results can be re-scored.

### E. Fairness

**E-1 (High). English production load and English keyword scoring.** ME and AUT scores depend on English vocabulary matching hand-written keyword lists, with only partial British/American spelling coverage (`organise/organize` once). A student writing correct but differently worded English, or making typos, loses credit. For an L2 population this confounds language proficiency with communication and creativity. *Fix:*

- prefer selection-based items for communication;
- score AUT with a fluency-independent originality method;
- record language background (optional, consented) so differential item functioning can be checked in the pilot.

**E-2 (Medium). Cultural specificity.** "mph", the 70 mph limit and "over 18" for alcohol are UK-centric. These are minor for comprehension but should be neutral (e.g. "a speed limit of 110 km/h") or explicitly framed as "in this country".

**E-3 (Medium). Timing.** The 2-minute AUT timer (`:1057-1064`) has no accommodation option. L2 and slower typists are disadvantaged. WCAG 2.2.1 (Timing Adjustable) applies unless the time limit is essential; for a development tool an extended-time setting is the defensible choice.

**E-4 (Low). Reading level.** Several self-report items are long and use idiom ("pick your brain" appears deliberately in ME; SA items such as "Stay with the uncertainty"). Target plain English. *Unverified heuristic:* roughly CEFR B1–B2; check this against Hult's admissions English requirement.

### F. Ethics and data protection

**F-1 (Critical, resolved by decision). Deception in the PG game.** Students are told there are three other players. The task is being replaced; any simulated agents in the replacement must be disclosed.

**F-2 (High). No consent, privacy notice or purpose statement.** This is required once data is used for programme evaluation, which is processing for a purpose beyond the student's own reflection. Hult's data protection and, where relevant, research ethics processes need to approve the evaluation use. This audit does not establish what Hult's internal requirements are.

**F-3 (Medium). Third-party request on load.** The page loads Google Fonts (`:7`), which sends the visitor's IP address to Google. A German regional court (LG München I, January 2022) held that embedding Google Fonts this way breached the GDPR. *Moderate confidence on the case details; the general risk is well established.* The target design system uses system fonts only, which removes the issue.

**F-4 (Medium). Labelling students.** "Implausible as descriptions of any person" (`:1230`) and a "Check consistency" badge on every card (C-2) are accusatory and, in the second case, false.

**F-5 (Low). LLM scoring (future).** Sending student text to an LLM provider requires a data processing agreement and disclosure. The build plan keeps this behind a disabled adapter.

### G. Developmental value (R7)

**G-1 (High). The tool assesses but does not develop.**

- No task gives usable feedback: the Wason feedback exists but is never shown (K-1).
- Scores are not explained or linked to actions.
- There is no practice mode, no reflection prompt and no goal setting.

**G-2 (High). Building and measuring skills with the same items is a conflict.** Once students practise on assessment items, retake scores rise without the underlying skill changing (teaching to the test). *Fix:* separate **practice** and **assessment** item pools. Practice items are never used in a recorded assessment sitting.

### H. UX and flow (R1)

**H-1 (High). Strictly linear, about 30–40 minutes claimed, no resume.** The order is fixed: self-report for all five skills, then five tasks. There is no way to take one skill, pause or return. The claimed duration is unverified because no timing is recorded; my own estimate from item counts is 20–30 minutes, and that is an estimate.

**H-2 (Medium). Self-report before tasks.** Rating oneself on all five skills first may prime task behaviour. Order effects are unknown. In the rebuild, counterbalance or fix the order deliberately, and record it.

**H-3 (Medium). Back navigation exists only in self-report.** Restart (`:1356`) skips the intro and wipes all state without confirmation.

**H-4 (Low). Ctrl+Enter shortcut** in ME is undiscoverable.

### I. Accessibility (WCAG 2.2 AA)

| ID | Severity | Finding | Location |
|---|---|---|---|
| I-1 | High | Info Gap topic cards are `div`s with click handlers, no `tabindex` or role. The curiosity task cannot be done by keyboard. | `:900-913` |
| I-2 | High | Likert buttons are labelled only "1"–"5", with no `aria-label`, radio-group semantics or link to the statement (verified: `aria-label` null, `role` null). | `:735-739` |
| I-3 | High | Contrast failures: `--text-dimmer` `#B0A090` on `#FEF7E9` = **2.38:1** (scale labels, limitations text, footer); gold `#FBAE40` = **1.75:1**; radar labels **1.31–1.91:1** on white. AA requires 4.5:1 for text. | `:12`, `:42`, `:365`, `:1296` |
| I-4 | High | Radar chart is a `<canvas>` with no text alternative. | `:356` |
| I-5 | Medium | AUT timer cannot be extended (2.2.1). | `:1057` |
| I-6 | Medium | Selected states rely partly on colour; no `aria-pressed` or `aria-checked`. | `:47`, `:51`, `:72` |
| I-7 | Medium | Slider has no label; toast is not an `aria-live` region. | `:333`, `:374` |
| I-8 | Medium | No `prefers-reduced-motion` handling. | `:18-19` |
| I-9 | Low | Canvas not scaled for high-DPI displays (blurry). Labels clip at the canvas edge ("munication", "Curiosit" in screenshot). | `:1279-1297` |

### J. Visual design (R4)

**J-1 (High). Rule-by-rule gap to the slides/third-places system.** Both repositories specify the same "warm, hard-edged, playful Bauhaus" system.

| Rule in reference system | Current tool |
|---|---|
| System font stack only; no web fonts, no network calls | Google Fonts DM Serif Display + DM Sans |
| Headings weight 800, sentence case, `--text` colour | Italic serif display headings (`<em>` in every h1) — the main source of the "Claude-y" look |
| **Zero border-radius** except decorative circles and dots | 4–6px radii throughout; 20px pill tags |
| Borders 2px minimum | 1px hairlines everywhere |
| No resting shadows; warm shadow on hover only | Resting shadows on cards and arenas |
| `--bg #F2DFBE`, `--bg-card #FFFAF2`, `--text #2A1F18` | `#FEF7E9` / `#FFFFFF` / `#252C38` |
| Eight accents; "colour is architecture"; solid accent blocks | Muted; colour appears as 2px top rules and pale tints |
| Decorative geometry (rotated squares, circles, bars) on every page | None |
| Buttons: accent fill, 700, uppercase 0.12em | Similar intent, but weight 500 and rounded |
| Light theme fixed; no `prefers-color-scheme` | Light only (consistent) |
| UK English | Consistent |

**J-2 (Medium). Left-over palette from an earlier dark theme.**

- Radar `skillMeta` colours `#60c8f0`, `#c8f060`, `#f0c060`, `#f060a8`, `#a060f0` (`:1209-1215`) do not match the card colours (`:103-117`).
- Lime and cyan tints `rgba(200,240,96,…)` and `rgba(96,200,240,…)` remain (`:51`, `:57`, `:72`).
- Radar grid strokes are `rgba(255,255,255,…)` on a white canvas, so they are invisible (`:1286-1287`).
- `DM Mono` is referenced but never loaded (`:1295`).
- `--font-mono` is set to DM Sans (`:13`).

**J-3 (Low). Logo handling.** The Hult logo is embedded nine times as about 42 KB base64 PNG, roughly 385 KB or 80% of the file. One asset file (SVG from Hult brand, if available) should be used.

**J-4. Proposed 5C-to-accent mapping** (reference tokens; adjacent hues contrast; gold uses its ink tone for text):

| Skill | Token | Hex |
|---|---|---|
| Collaboration | `--accent-2` | `#B52838` red |
| Curiosity | `--accent-4` (text `--accent-4-ink` `#7A5410`) | `#D4A020` gold |
| Critical thinking | `--accent-1` | `#5C3A96` purple |
| Creativity | `--accent-6` | `#B83068` magenta |
| Communication | `--accent-3` | `#C85218` burnt orange |

Hult branding is kept through the logo and the header/footer lockup. Hult's aubergine could stand in for `--accent-1` if Hult brand guidelines require it; this needs a decision once the guidelines are available.

### K. Engineering

**K-1 (Critical). Wason double-fire.**

- `#wason-btn` has a permanent `addEventListener('click', wasonSubmit)` (`:1377`) and an `onclick` property reassigned between `wasonSubmit` and `wasonNext` (`:955`, `:984`).
- On "Confirm", the listener submits and sets `onclick = wasonNext`, which then runs in the same click.
- Verified in Chromium: one click moves from "Problem 1 of 6" to "Problem 2 of 6" with empty feedback.

**K-2 (High). Faking warning never visible.** `saNext` shows `#faking-flag` (`:802-806`), then immediately calls `loadSAPage`, which hides it (`:717`). Verified.

**K-3 (Medium). Faking flags double-count.** Back then Next on a flagged page increments `fakingFlags` again (`:803`, `:816`), changing the weighting.

**K-4 (High). Architecture.**

- One 482 KB file.
- Content, logic, styles and nine logo copies are interleaved.
- Global mutable state is reinitialised in two places (`:388-406`, `:1358-1364`).
- There are no tests and no module boundaries.
- Tasks are dispatched with an `if/else` chain (`:869-877`).

Adding a skill or task currently means editing six places.

**K-5 (Medium). Unsafe patterns that become risky once content is editable.** `innerHTML` is used with interpolated strings (`:1104`, `:1268`, `:1304`). This is safe today because all strings are static. It must change once the item bank is externalised or editable.

**K-6 (Low). Timer drift.** The AUT timer decrements a counter on `setInterval` (`:1058`). Use an end timestamp.

**K-7 (Low).** Unused state fields (`state.currentScreen`, `aut.done`); duplicated logo markup; inline styles.

### L. Data and export (R5)

**L-1 (High). The export is a text summary.** `downloadResults` (`:1321-1354`) writes rounded scores and fixed limitation sentences to `5C-skills-results.txt`. It contains:

- no raw responses or timings;
- no item, form or scoring version;
- no identifier or machine-readable structure;
- nothing that can be re-imported.

The required JSON, CSV and PDF exports are absent.

**L-2 (Medium). Not captured at all:** response times, task durations, AUT raw lines with their classifications, per-item Wason selections, device or viewport, assessment mode.

### M. Documentation (R6)

**M-1 (High). There is no README, CLAUDE.md, licence, scoring specification, item provenance or changelog.** Weights and thresholds are documented only in scattered code comments, some of them inaccurate (`:411-412`, `:654`). The reference repositories show the expected standard: CLAUDE.md with conventions, a Files section, a testing section and a lint harness.

---

## 3. Challenges to the brief's premises

1. **"Assesses progress in skills over time" cannot be delivered by software alone.** Code can make change measurable: forms, IDs, versioning, raw data. Whether change is *detectable* depends on reliability and form equivalence, and those need pilot data. The build plan therefore ends with a validation-readiness phase, and the tool must not make individual change claims until that phase reports.
2. **Build and assess must be separated** (G-2), or the assessment stops measuring.
3. **Collaboration cannot be validly measured by a solo, single-sitting online task.** An individual task can measure collaboration-relevant *judgement* (situational judgement) and *behaviour with simulated partners* (information sharing). Real collaborative skill is best evidenced in real group work, for example structured peer evaluation of the kind CATME provides (Ohland et al., 2012). That belongs to the later Hult-systems integration and is flagged as such.
4. **A five-number profile per student from about 30 minutes is overreach.** Realistic outputs:
   - cohort-level evaluation;
   - per-skill formative feedback with honest uncertainty;
   - the calibration gap between self-view and performance.
5. **A "fixed" framework without definitions is not yet fixed.** The labels are fixed; the constructs are not. Definitions are the first deliverable that needs sign-off.

---

## 4. Recommended target architecture

```
index.html                 skill hub (entry)
cohort.html                coach / cohort view (imports JSON exports)
assets/                    hult-logo.svg (or one PNG), favicon
styles/tokens.css          design tokens copied from slides/third-places
styles/components.css      buttons, cards, likert, timer, results, print
src/core/                  router, store (storage adapter), rng (seeded), timing, ids, schema, migrate
src/skills/<skill>/        one module per skill: index.js (manifest), tasks/*.js, scoring.js
src/report/                results views, PDF (print CSS), JSON/CSV export, import
content/<skill>/           item banks as ES modules: forms A/B, practice pool, metadata, sources
docs/                      CONSTRUCTS, SCORING, ITEM-BANK, DATA-SCHEMA, VALIDATION-PLAN, DESIGN
tests/                     node unit tests (scoring, schema), lint, playwright e2e
```

- **Skill module contract:** `{ id, label, accent, facets, tasks: [{ id, type, estMinutes, run(ctx), score(responses, form) }], selfReport }`. The hub reads manifests; nothing else lists skills.
- **Modes:**
  - **Practice**: practice pool, immediate feedback, not recorded as assessment.
  - **Assessment sitting**: a fixed form assigned by seed or counterbalancing, no feedback until the skill is complete, recorded.
- **Storage adapter:** `localStorage` now (namespaced `skills5c:v1:*`, wrapped in try/catch as in the reference repos), with an interface that a backend or LMS adapter can implement later.
- **Every result** records `schemaVersion`, `appVersion`, `scoringVersion`, `formId`, `seed`, timestamps, raw responses and per-item timings. Scores can always be recomputed from raw data.
- **ES modules require HTTP serving.** Browsers block module scripts from `file://`. The reference repos require `file://` to work, so this is a real trade-off. Recommendation: serve via GitHub Pages, and use `python3 -m http.server` locally. The alternative is classic scripts with a global namespace, which keeps `file://` working but makes Node testing clumsier. Decide before Session 2.

---

## 5. Recommended measures per skill (for item writing in the build plan)

All new items are **drafts until reviewed by Hult subject experts and piloted.** No proprietary test items (e.g. Watson-Glaser, HCTA) may be copied. Widely circulated items such as the Cognitive Reflection Test should be avoided because many students already know them. Items from the International Personality Item Pool (IPIP) are public domain and may be used for self-report where constructs align. Other published scales (e.g. the Five-Dimensional Curiosity Scale; Kashdan et al., 2018) require a licence check before use.

| Skill | Task 1 | Task 2 | Task 3 (optional) | Self-report |
|---|---|---|---|---|
| **Critical thinking** | Conditional reasoning: abstract and deontic items reported *separately*, varied negation forms so the surface answer pattern differs; all-or-nothing scoring | Argument and evidence evaluation: identify the flaw or the strongest evidence in short business or news scenarios | Calibration: answer factual or estimation items with confidence ratings; score accuracy and over/under-confidence | Balanced-keyed items per facet |
| **Creativity** | AUT with a **fixed object per form**; scored for fluency, flexibility (revised taxonomy) and originality against a provisional frequency table to be replaced by pilot norms; gibberish/unscorable detection; optional LLM hook | Problem finding or consequences task ("What would happen if…"), rubric-scored | | Balanced-keyed |
| **Communication** | "Which is clearer?" paired comparisons (selection, low L2 production load, deterministic key) | Diagnose: identify the problem in an *unmarked* passage (ambiguity, buried lead, jargon, logical gap, register) | One rewrite, scored by a transparent checklist the student self-checks; coach or LLM scoring optional later | Balanced-keyed |
| **Curiosity** | Information seeking with costs: rate prior knowledge and curiosity per question, then choose which answers to "buy" with a limited budget or wait; score information seeking relative to stated knowledge gap | Question generation: write questions about a stimulus; classify explanatory (why/how) against factual (what/when) with a transparent rule set plus manual review | | Balanced-keyed; IPIP intellect/openness items where aligned |
| **Collaboration** | Situational judgement test: team scenarios with response options rated for effectiveness; keys set by a Hult expert panel (`PLACEHOLDER:` until keyed) | Hidden-profile task with **disclosed** simulated teammates: success requires sharing and asking for unshared information; score sharing, querying and decision quality | Later: structured peer evaluation from real group work (Hult-systems integration) | Balanced-keyed |

Targets per skill: two or three tasks of 8–10 minutes in total, and 8–10 self-report items with balanced keying. These are planning heuristics, not reliability guarantees.

---

## 6. Validation roadmap (what code cannot do)

1. **Construct definitions** signed off (docs/CONSTRUCTS.md).
2. **Expert review** of every item for content, key and L2 readability.
3. **Cognitive interviews** with 5–10 students, including L2 speakers, to check item interpretation.
4. **Pilot** with a cohort large enough for item analysis. Several hundred students is a common rule of thumb for factor-analytic work; this is a heuristic, not a requirement derived for this tool.
   - Compute alpha and omega per scale, item-total correlations, and item difficulty and discrimination.
   - Analyse differential item functioning by language background.
   - Run a test-retest subsample over 2–4 weeks.
5. **Form equating** of A and B using counterbalanced administration.
6. **Freeze `scoringVersion` 1.0.0** before the first start-of-programme sitting.
7. **Set change thresholds** (RCI) and descriptive bands from pilot data. Only then show students change messages or comparisons.
8. **Evaluation design** for programme claims: a comparison group or cross-sectional comparison.

---

## 7. Decisions still needed from Hult or the owner

1. Operational definitions and facets for each C (draft in Session 1, sign-off by Hult).
2. Hult brand assets (SVG logo, any mandated colour) and whether aubergine replaces `--accent-1`.
3. Data protection and ethics approval for programme-evaluation use, and the consent wording.
4. Who keys the collaboration SJT and reviews items (expert panel).
5. ES modules over HTTP or classic scripts on `file://` (§4).
6. Whether the legacy tool is in use with students now. If so, apply the Session 1 hotfixes immediately.

---

## References

Only sources the auditor is confident exist and support the stated point are listed.

- Beaty, R. E., & Johnson, D. R. (2021). Automating creativity assessment with SemDis. *Behavior Research Methods, 53*, 757–780.
- Billah, K. Y., & Scanlan, R. H. (1991). Resonance, Tacoma Narrows bridge failure, and undergraduate physics textbooks. *American Journal of Physics, 59*(2), 118–124.
- Brown, A., & Maydeu-Olivares, A. (2011). Item response modeling of forced-choice questionnaires. *Educational and Psychological Measurement, 71*(3), 460–502.
- Campbell, D. T., & Fiske, D. W. (1959). Convergent and discriminant validation by the multitrait-multimethod matrix. *Psychological Bulletin, 56*(2), 81–105.
- Cosmides, L. (1989). The logic of social exchange. *Cognition, 31*(3), 187–276.
- Fischbacher, U., Gächter, S., & Fehr, E. (2001). Are people conditionally cooperative? *Economics Letters, 71*(3), 397–404.
- Griggs, R. A., & Cox, J. R. (1982). The elusive thematic-materials effect in Wason's selection task. *British Journal of Psychology, 73*(3), 407–420.
- Howard, G. S. (1980). Response-shift bias: A problem in evaluating interventions with pre/post self-reports. *Evaluation Review, 4*(1), 93–106.
- Jacobson, N. S., & Truax, P. (1991). Clinical significance: A statistical approach to defining meaningful change. *Journal of Consulting and Clinical Psychology, 59*(1), 12–19.
- Kang, M. J., et al. (2009). The wick in the candle of learning. *Psychological Science, 20*(8), 963–973.
- Karst, J., Jones, M. D., & Hoeksema, J. D. (2023). Positive citation bias and overinterpreted results lead to misinformation on common mycorrhizal networks in forests. *Nature Ecology & Evolution, 7*, 501–511.
- Kashdan, T. B., et al. (2018). The five-dimensional curiosity scale. *Journal of Research in Personality, 73*, 130–149.
- Loewenstein, G. (1994). The psychology of curiosity. *Psychological Bulletin, 116*(1), 75–98.
- Nevins, A., Pesetsky, D., & Rodrigues, C. (2009). Pirahã exceptionality: A reassessment. *Language, 85*(2), 355–404.
- Ohland, M. W., et al. (2012). The Comprehensive Assessment of Team Member Effectiveness. *Academy of Management Learning & Education, 11*(4), 609–630.
- Organisciak, P., Acar, S., Dumas, D., & Berthiaume, K. (2023). Beyond semantic distance: Automated scoring of divergent thinking greatly improves with large language models. *Thinking Skills and Creativity, 49*, 101356.
- Silvia, P. J., et al. (2008). Assessing creativity with divergent thinking tasks. *Psychology of Aesthetics, Creativity, and the Arts, 2*(2), 68–85.
- Stanovich, K. E., West, R. F., & Toplak, M. E. (2016). *The Rationality Quotient*. MIT Press.

Bibliographic details (volume and page numbers) were written from memory and should be checked before the report is circulated externally.
