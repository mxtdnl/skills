# Validation plan

**Purpose.** Sets out how the reliability and validity of the rebuilt measures will be established before any score is used for programme evaluation or any individual change claim is shown. Code alone cannot establish these (audit section 3, point 1, and section 6).

Until this document records pilot-based thresholds, the tool must not tell any student that they have improved or declined (global rule in `CLAUDE.md`).

Nothing below has been specified yet. Session 15 writes it. The roadmap it will follow is in `audit/AUDIT-REPORT.md` section 6.

## Pilot aims

To be written in Session 15.

## Sample and recruitment

To be written in Session 15.

## Cognitive interviews

To be written in Session 15.

## Design

To be written in Session 15.

## Analyses

To be written in Session 15.

## Item decision rules

To be written in Session 15.

## Provisional rules to be set from pilot data

Rules fixed before any data exists. Each must be reviewed against the pilot and recorded here with its evidence.

| Rule | Current value | Where |
|---|---|---|
| Self-report `longRun` flag: identical answers in a row | 6 (PROVISIONAL) | `LONG_RUN_MIN`, `src/skills/common/self-report-score.js` |
| Self-report `fastResponding` flag: median time per item | under 1000 ms (build plan S6) | `FAST_MEDIAN_MS`, same file |
| Self-report facet score: minimum answered items | at least half the facet's items | `scoreSelfReport`, same file |
| Self-report time estimate | 3 minutes (PROVISIONAL) | `src/skills/common/manifest.js` |
| Critical thinking task time estimates (untimed tasks) | CT-T1 5, CT-T2 7, CT-T3 5, CT-T4 5 minutes (PROVISIONAL) | `src/skills/critical/index.js` |
| CT-T3 indices: minimum answered items | at least half the form's items (5 of 10) | `score`, `src/skills/critical/calibration.js` |
| CT-T3 headline `CT3` | 1 minus the Brier score (PROVISIONAL, D-12) | same file |
| CT-T3 intended difficulty tags and form matching | author's judgement (4 easier, 6 harder per form) | `content/critical/ct-t3.js` |

The response-quality flags are for the coach view only. Before any flag is used to exclude data from a cohort analysis, the pilot should check how flagged response patterns affect the scale's reliability estimates.

## Change thresholds

None set. To be derived from pilot data.

## Programme evaluation design

To be written in Session 15.

## Data protection and ethics

To be written in Session 15.
