# Changelog

**Purpose.** Records changes to the repository by build session, and every change to `scoringVersion`, so that results from different versions are never compared without knowing what changed.

## Scoring versions

| scoringVersion | Applies to | Status |
|---|---|---|
| 0.1.0 | Legacy prototype, `legacy/skills-assessment-hult.html` | Legacy; known defects, see `audit/AUDIT-REPORT.md` |
| 0.2.0 | Rebuilt platform skeleton (S3). Only the developer stub task is scored | No skill measures; nothing to compare |

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
