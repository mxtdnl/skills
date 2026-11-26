# Changelog

**Purpose.** Records changes to the repository by build session, and every change to `scoringVersion`, so that results from different versions are never compared without knowing what changed.

## Scoring versions

| scoringVersion | Applies to | Status |
|---|---|---|
| 0.1.0 | Legacy prototype, `legacy/skills-assessment-hult.html` | Legacy; known defects, see `audit/AUDIT-REPORT.md` |

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
