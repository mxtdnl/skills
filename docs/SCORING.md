# Scoring specification

**Purpose.** Defines exactly how every score in the tool is computed, so that scores can be checked, reproduced and compared across versions. Every change to scoring bumps `scoringVersion` and updates this file in the same commit (global rule in `CLAUDE.md`).

## Versions

| scoringVersion | Section | Status |
|---|---|---|
| 0.1.0 | [Legacy prototype](#legacy-scoringversion-010-known-defects-see-audit) | Legacy, known defects |
| 0.2.0 | [Platform skeleton](#platform-skeleton-scoringversion-020) | Rebuilt platform; no skill measures yet |
| 0.3.0 | [Application shell](#application-shell-scoringversion-030) | Adds the developer stub's self-report score; no skill measures yet |
| 1.0.0-draft | [Self-report](#self-report-scoringversion-100-draft) | Self-reports of the five skills (S6). Draft: items not yet reviewed, no pilot data |

The rebuilt measures add their own sections from Session 6 onwards.

---

## Self-report, scoringVersion 1.0.0-draft

Introduced in Session 6 for the five skills' self-reports (CO-SR, CU-SR, CT-SR, CR-SR, CM-SR in `docs/CONSTRUCTS.md`). Code: `src/skills/common/self-report-score.js` (`scoreSelfReport`). The component is `src/skills/common/self-report.js`; the items are in `content/<skill>/self-report.js` and listed in `docs/ITEM-BANK.md`. Everything in 0.3.0 is unchanged; the developer stub keeps its own scoring.

This replaces the legacy self-assessment entirely (audit A-8, A-9, C-2): there are no forced-choice items, no faking item, no within-person "consistency" statistic, no 0 to 100 rescaling, and the self-report is not combined with any task score.

### Items and responses

- Each form has 8 or 9 statements: three per facet for Collaboration, Curiosity and Communication; two per facet for Critical thinking and Creativity. Forms A and B have the same facets with the same number of items each, and share no item.
- Every item records its `keying`: `+` (agreeing means more of the facet) or `-` (agreeing means less). Each form has 4 or 5 items of each keying, and each facet has both keyings across the two forms.
- Response: an integer from 1 to 5 on the agreement scale, every point labelled: 1 Strongly disagree, 2 Disagree, 3 Neither agree nor disagree, 4 Agree, 5 Strongly agree.
- Every answer and every change of answer is recorded. **The latest response to each item counts.** A response that is not an integer from 1 to 5 makes the item missing.
- Items on the form taken are scored; responses to any other item ID are ignored.

### Scores

All scores are on the response scale, 1 to 5.

```
item score   = response            if keying is "+"
             = 6 - response        if keying is "-"
facet mean   = mean of the item scores of the facet's answered items
               null if fewer than half of the facet's items on the form are answered
skill        = mean of the facet means (each facet weighs the same)
               null if any facet mean is null
```

`score` is `{ <facet code>: facet mean, ..., skill }`, for example `{ CO1: 3.67, CO2: 4, CO3: 3.33, skill: 3.67 }` (values are stored unrounded).

**Missing items.** The rule above is the only treatment of missing data: no imputation, and no default value (unlike the legacy 0.5, audit B-5). The number answered and missing is recorded in `quality`. The component asks for an answer to every statement before moving on, so missing items arise only from records changed outside the component.

**Straight-lining.** Answering every statement the same way gives exactly the score those answers imply, with no penalty and no adjustment. Because each form is balanced for keying, this lands near the midpoint: for example, all "Agree" (4) on Collaboration form A gives CO1 3.33, CO2 2.67, CO3 3.33, skill 3.11; all "Neither" (3) gives 3 everywhere. Across every form, answering all 1, 2, 4 or 5 gives a skill mean within 0.5 of 3 (`tests/self-report.test.mjs`).

### Retrospective items (end of programme)

Each skill has one retrospective item per facet ("Looking back, at the start of the programme I would have rated myself as good at ..."), rated on the same agreement scale, positively keyed. They are a mitigation for response-shift bias (audit D-5; Howard, 1980).

- Asked only in an end-of-programme sitting: a programme sitting at an even window (`isProgrammeEnd`, `src/skills/runner.js`). They come on a final screen after the form's items.
- Stored as `retrospective: { <facet code>: mean of the facet's answered retrospective items, or null }` on the SelfReport record.
- Never part of `score`, and never compared with the start-of-programme score in the student view. How "then" and "now" ratings are compared is for the validation plan (S15).

### Response-quality indicators (coach view only)

Computed over the form's items (not the retrospective items) and stored as `quality` on the SelfReport record. They describe a pattern of answers; they do not show that a student answered carelessly or dishonestly. **They are never shown to the student, never worded as an accusation, and never change a score.** They are for the coach and cohort view (S13).

| Field | Rule |
|---|---|
| `items`, `answered`, `missing` | Items on the form; items with a valid latest response; the difference |
| `straightLining` | At least 3 valid responses, all identical |
| `medianItemMs` | Median time per item. Items answered on one screen share a `shownAt`; on each screen the latest responses are ordered by `rtMs`, and each item's time is the gap from the previous one (the first from the screen appearing). Null if no timed response |
| `fastResponding` | `medianItemMs` under 1000 ms |
| `longestRun` | Longest run of identical valid responses in the order shown (facet screens in order; a missing item breaks a run) |
| `longRun` | `longestRun` at least 6. **Provisional**: chosen for 8- and 9-item forms before any data; to be reviewed against the pilot (`docs/VALIDATION-PLAN.md`) |

### Not computed

No within-person "split-half" or consistency statistic (audit C-2). Internal consistency (Cronbach's alpha, McDonald's omega) and item-total correlations are properties of a sample of respondents and belong in the cohort view and the pilot analysis, not in an individual's record.

### Records from earlier versions

Self-reports stored under scoringVersion 0.3.0 (schema version 2) were scored by the developer stub only. Every response is kept, so any record can be re-scored under 1.0.0-draft.

---

## Application shell, scoringVersion 0.3.0

Introduced in Session 5. It contains no skill measure. Everything in 0.2.0 below is unchanged, plus:

**Self-report scoring.** A skill's self-report has `score(selfReport, form)`, a pure function of the record's `responses` and the items of the form taken. It returns `{ score }` (a self-report has no raw score). The runner stores it on the SelfReport record with `scoringVersion`.

**Stub self-report `_example/self-report`** (`src/skills/_example/rate.js`). One statement per screen, rated on a five-point agreement scale.

- Response: an integer from 1 (Strongly disagree) to 5 (Strongly agree).
- `score` = `{ EX1: mean of the valid responses }`, counting only items of the form taken and integers from 1 to 5; `{ EX1: null }` if there are none.

**In-progress records.** A step that has started but not finished is stored with `status: "in-progress"`, `rawScore: null` and `score: null`. Scores are computed only on completion, under the `scoringVersion` in force at that moment, which is the version recorded on the record.

---

## Platform skeleton, scoringVersion 0.2.0

Introduced in Session 3 so that records written by the rebuilt platform are never labelled with the legacy version. It contains no skill measure. The only scoring function is the developer stub's, which measures nothing and is never shown to students.

**Where scoring lives.** Each task's `score(attempt, form)` in its skill module (`docs/ARCHITECTURE.md`). It is a pure function of the attempt's raw responses and the form's items, so any stored attempt can be re-scored. It returns `{ rawScore, score }`, where `score` is a number, null, or one value per facet code. The runner records `scoringVersion` (from `src/core/version.js`) on every attempt.

**Stub task `_example/pick`** (`src/skills/_example/pick.js`). One multiple-choice question per screen.

- Response: `{ choice, position }`, where `choice` is the index of the chosen option in the item's `options` and `position` is where it appeared on screen (option order is shuffled from the sitting seed; from 0.3.0, per item with `ctx.rngFor(itemId)`, so a resumed item keeps its order). In practice mode the task shows whether the answer was right; this does not change the score.
- `rawScore` = number of responses whose `choice` equals the item's `key`, counting only items of the form taken.
- `score` = `{ EX1: rawScore / number of items in the form }`, or `{ EX1: null }` for an empty form.

---

## Legacy, scoringVersion 0.1.0, known defects: see audit

This section documents the formulas **as implemented** in `legacy/skills-assessment-hult.html`, including the defects. It describes the code; it does not endorse it. The audit (`audit/AUDIT-REPORT.md`, sections A, B and C) explains why most of these scores are not valid measures of the skills they are labelled with. None of these formulas may be ported to the rebuilt tool.

- **Version label.** The prototype records no version. `0.1.0` is assigned retrospectively in Session 0 so that the characterisation tests and any later hotfix have a baseline.
- **Line references** are to `legacy/skills-assessment-hult.html` (the file was moved unchanged, so they match the audit's references to `skills-assessment-hult.html`).
- **Scale.** Every score is held internally on 0 to 1 and displayed as `Math.round(x * 100)` out of 100.
- **Regression tests.** `tests/legacy-scoring.test.mjs` asserts the current outputs for the inputs in `audit/evidence/attacks.mjs` and `cons.mjs`.

### Score structure

Each of the five skills has `cognitive` (performance task), `self` (self-assessment), `selfLikert`, `selfFC`, `consistency` and, after the composite step, `composite` (state initialised at `:394-398`, reset at `:1359`). The fixed order is: self-assessment for all five skills, then the five tasks (`tasks`, `:592`).

| Skill | Performance task | Function |
|---|---|---|
| Curiosity | Information Gap Task | `scoreIG`, `:918-929` |
| Critical thinking | Wason Selection Task | `wasonSubmit` `:965-985`, `wasonNext` `:987-993` |
| Creativity | Alternate Uses Task (AUT) | `scoreAUT`, `:1067-1089` |
| Communication | Message Editing Task | `scoreME`, `:1118-1148` |
| Collaboration | Public Goods Game | `pgConfirm`, `:1168-1184` |

### Self-assessment (`computeSAScore`, `:818-853`)

Per skill: 5 Likert items (1 to 5, Disagree to Agree), 1 embedded faking item, 4 forced-choice items (`saSkills`, `:415`).

**Likert component** (`:820-825`). Every item is negatively worded, so each response `v` is reversed:

```
item = (5 - v) / 4                 v = 1 -> 1.00,  v = 5 -> 0.00
selfLikert = mean(item)            0.5 if no item answered
```

**Forced-choice component** (`:838-844`). Each item has two options with author-assigned values `scores[0]` (option a) and `scores[1]` (option b):

```
selfFC = mean(value of chosen option)    0.5 if no item answered
```

The attainable range differs by skill because the option values differ (from the characterisation tests):

| Skill | Minimum | Maximum |
|---|---|---|
| Collaboration | 46 | 94 |
| Curiosity | 48 | 100 |
| Critical thinking | 39 | 100 |
| Creativity | 66 | 95 |
| Communication | 53 | 98 |

13 of the 20 forced-choice pairs differ in value by 0.5 or more.

**Combined self score** (`:847`):

```
self = 0.40 * selfLikert + 0.60 * selfFC
```

**"Split-half consistency"** (`:827-836`, `pearsonR` `:693-703`). Within one respondent, the reversed Likert values of items 0, 2 and 4 are correlated with items 1 and 3; the shorter list is padded with `0.5` to equal length. `pearsonR` returns 0 when fewer than 2 values or when either list has zero variance. Stored as `consistency`. Not used in any score; used for display only (see Display thresholds). Defect: audit C-2.

**Faking item** (`saNext`, `:801-807`). A response of 4 or 5 increments `state.fakingFlags`. Going back and forward again on a flagged page increments it again (audit K-3). The flag changes the composite weights (below). The response itself is not scored.

### Curiosity: Information Gap (`scoreIG`, `:918-929`)

15 topic cards (`igTopics`, `:613`), each with a `domain` (15 distinct domains) and an author-set `novel` flag (8 of 15 are `true`). Topic order is shuffled with `sort(() => Math.random() - 0.5)` (`:889`).

```
if no card revealed: cognitive = 0
breadth      = revealed / 15
noveltyRatio = revealed cards flagged novel / revealed
diversity    = min(distinct domains among revealed / 10, 1)
cognitive    = 0.30 * breadth + 0.40 * noveltyRatio + 0.30 * diversity
```

Defects: audit A-2, B-3.

### Critical thinking: Wason Selection (`:965-993`)

6 problems (`wasonProblems`, `:634`), 4 cards each. Problem order is shuffled with the biased sort (`:935`) and card positions are shuffled per problem (`shuffleWasonCards`). In all six, the correct cards are indices `[0, 3]` before shuffling.

Per problem (`:973-976`), with `selected` the chosen cards and `correct` the answer cards:

```
correctHits = |selected ∩ correct|
wrongHits   = |selected \ correct|
partial     = max(0, (correctHits - 0.5 * wrongHits) / |correct|)
```

`isCorrect` (exact match) is recorded but not used in the score. After the last problem (`:990`):

```
cognitive = mean(partial over the 6 problems)
```

Defects: audit A-4, B-4. The Confirm button submits and advances in one click, so feedback is never shown (audit K-1); this does not change the score.

### Creativity: Alternate Uses Task (`:1000-1089`)

One object is drawn uniformly at random from the 7 in `AUT_TAXONOMY` (`:656`, draw at `:1044-1045`). Each object has 10 categories with keyword lists and a list of 6 to 9 "common" phrases. Time limit 120 seconds, decremented by `setInterval` (`:1057-1064`); at 0 the textarea is disabled and `scoreAUT` runs.

**Responses** (`:1069-1076`). Lines with more than 2 non-space characters after trimming. A line is a duplicate, and is skipped, if its token string equals an earlier line's, or if the Jaccard overlap of their token sets exceeds 0.75 (`autIsDuplicate`, `:1000-1010`). Tokens: lower case, non-alphanumerics replaced by spaces, tokens of length 2 or more (`autTokenise`, `:998`).

**Category** (`autGetCategory`, `:1012-1022`). For each category, count keywords that occur as a substring of the lower-cased line, or equal a token, or (for keywords longer than 4 characters) whose first 5 characters start a token. The category with the most hits is assigned; with no hits, the category is `"Other"`.

**Originality** (`autGetOriginality`, `:1024-1030`), per response, 0 to 2:

```
0  if any common phrase is a substring of the response, or the response is a substring of any common phrase
1  else if any category keyword is a substring of the response
2  otherwise (including gibberish)
```

**Elaboration** (`autGetElaboration`, `:1032-1040`), per response, 0 to 3. `wc` = word count; `conn` = the response matches one of the connectives `to `, `so that`, `because`, `in order`, `by `, `when `, `which`, `while`, `using`, `through`, `allowing`, `enabling`, `as a`, `as an`:

| Word count | No connective | Connective |
|---|---|---|
| 0 to 2 | 0 | 0 |
| 3 to 4 | 0 | 1 |
| 5 to 8 | 1 | 2 |
| 9 or more | 2 | 3 |

**Task score** (`:1077-1087`), with `fluency` = non-duplicate responses and `flexibility` = distinct categories assigned (including `"Other"`):

```
fluNorm  = min(log(fluency + 1) / log(21), 1)
flexNorm = min(flexibility / number of categories for the object, 1)      (10 for every object)
origNorm = min((sum of originality / fluency) / 2, 1)                     0 if fluency = 0
elabNorm = min(sum of elaboration / (3 * fluency), 1)                     0 if fluency = 0
cognitive = 0.35 * flexNorm + 0.35 * origNorm + 0.20 * fluNorm + 0.10 * elabNorm
```

Defects: audit A-6, B-2, E-1, E-3.

### Communication: Message Editing (`scoreME`, `:1118-1148`)

5 passages (`mePassages`, `:669`), each with a plain-text original and a keyword list (8 to 12 keywords). Passage order is shuffled with the biased sort (`:1095`). The problem in each passage is underlined in the display. `HF_WORDS` (`:383`) is a list of 157 high-frequency words.

Per passage, with `o` the original's words and `r` the rewrite's words (lower case, split on whitespace, punctuation kept):

```
kwScore     = 0.45 * min(keywords found as substrings of the rewrite / number of keywords, 1)
concision   = 0.25 * min((|o| - |r|) / |o|, 1)    if |r| < |o|, else 0
specificity = 0.20 * min(words in r not in HF_WORDS and longer than 2 characters / |r|, 1)    0 if |r| = 0
shared      = words of o that occur in r (counted over o, with repeats)
jaccard     = shared / (|o| + |r| - shared)
novelty     = 0.10 * (1 - min(jaccard, 1))
passage     = kwScore + concision + specificity + novelty
```

```
cognitive = min(mean(passage over the 5 passages), 1)
```

Defects: audit A-7, B-1, E-1.

### Collaboration: Public Goods Game (`pgConfirm`, `:1168-1184`)

6 rounds; each round the participant chooses a contribution `c` from 0 to 20 tokens. No other players exist (audit A-5, F-1). The "Est. pool return" display (`:1165`) assumes the others contribute 9 tokens each; it does not enter the score.

```
mean     = mean(c)
variance = mean((c - mean)^2)                         population variance
penalty  = 0.2 * min(variance / (20^2 / 4), 1)        20^2 / 4 = 100
cognitive = max(0, mean / 20 - penalty)
```

### Composite (`computeAllComposites`, `:1191-1204`)

```
f       = 0.05 * min(fakingFlags, 2)
cogW    = min(0.55 + f, 0.65)
selfW   = max(0.45 - f, 0.35)
if cognitive is null: cognitive = 0.5
if self is null:      self = 0.5
composite = cogW * cognitive + selfW * self
```

The weights are the same for all five skills and depend on the faking flags across all skills. Defects: audit B-5 (missing data becomes 50), B-6.

### Display thresholds (results screen)

These do not change any score but are shown to the student.

| Element | Rule | Lines |
|---|---|---|
| Faking notice | Shown when `fakingFlags` is 1, and with different wording when it is 2 or more | `:1227-1236` |
| "Low internal consistency" notice | Any skill with `consistency < 0.3` | `:1239-1244` |
| Consistency badge | `consistency >= 0.5`: "Consistent"; otherwise "Check consistency"; shown with `r` to 2 decimal places | `:1260-1266` |
| Overall level | Mean composite across the five skills: `>= 0.75` "strong", `>= 0.5` "developing", otherwise "emerging" | `:1303` |
| Highest and lowest area | Skills ranked by composite | `:1300-1309` |

Defects: audit C-2, F-4, B-6.

### Known defects

The full list, with severities, is in `audit/AUDIT-REPORT.md` section 1.1 and section B. The characterisation tests pin the defective values (for example, keyword salad 86 against careful rewrites 44 on Message Editing; gibberish 61 on the AUT), so that a fix changes them deliberately.
