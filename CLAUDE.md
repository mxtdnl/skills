# 5C Skills Assessment

A browser-based tool for Hult's five core skills: Collaboration, Curiosity, Critical Thinking, Creativity and Communication. It serves three purposes, in this order of how demanding they are on the measures:

1. **Formative self-reflection** for undergraduate students.
2. **Coaching input**: material a student and coach discuss together.
3. **Programme evaluation**: cohort-level evidence of change between the start and end of the programme.

Programme evaluation sets the validity bar for every measure (see `audit/AUDIT-REPORT.md` section 0.2). The tool is static and client-side: no build step, no server, no network calls. It is served over HTTP (GitHub Pages, or a local server for previews).

**Status.** The only working version is the legacy prototype in `legacy/`. An audit (`audit/AUDIT-REPORT.md`) found it unfit for programme evaluation. The rebuild follows `audit/BUILD-PLAN.md`, session by session (S0 to S15). The legacy prototype is kept unchanged for reference and characterisation tests; it is not edited unless a session prompt says so.

Read this file first in every session. Then read the session prompt in `audit/BUILD-PLAN.md`, and the documents it names. Construct definitions are in `docs/CONSTRUCTS.md`.

---

## Global rules

These are copied verbatim from `audit/BUILD-PLAN.md` and apply to every session.

- **No invented facts, item keys or statistics.** Draft content is prefixed `PLACEHOLDER:` or marked `status: "draft"` in the item bank, and is listed at the end of the session.
- **Item content is draft until reviewed by Hult staff.** Claude writes candidate items; humans approve them.
- **Never copy proprietary test items.** Avoid widely circulated items such as the CRT.
- **Every change to scoring bumps `scoringVersion` and updates `docs/SCORING.md`.**
- **No individual change claims in the UI** until `docs/VALIDATION-PLAN.md` records pilot-based thresholds.
- **UK English. System fonts only. No network calls. Zero border-radius** (except 50% circles). Design tokens come from `styles/tokens.css`.
- Practice items and assessment items are separate pools and never mix.

---

## Repository structure

```
index.html                  Temporary landing page linking to the legacy prototype (replaced by the skill hub in S5)
CLAUDE.md                   This file
README.md                   What the tool is, status, how to run and test it
LICENSE                     PLACEHOLDER: licence to be chosen by the owner
package.json                npm scripts (test, lint, schema); no runtime dependencies
legacy/
  skills-assessment-hult.html   The original prototype, unchanged
audit/
  AUDIT-REPORT.md           Audit findings (IDs such as K-1, B-2 are cited throughout)
  BUILD-PLAN.md             Sessions S0 to S15 with prompts, gates and acceptance criteria
  README.md                 Index of the audit and how to reproduce the evidence
  evidence/                 Scripts that reproduce every quantitative finding, and their recorded output
docs/                       Specifications (see Files)
src/
  core/                     Platform modules: version, rng, ids, schema, migrate, store, timing, router
  skills/                   Skill registry, task runner, one directory per skill (_example is a developer stub)
content/                    Item banks, content/<skill>/<task>.js exporting {formA, formB, practice}
dev/                        Developer harness for the platform (not student-facing)
tests/                      Node test and lint scripts (see Testing)
```

Planned by later sessions (not yet present): `styles/`, `assets/` and `styleguide.html` (S4), `src/report/` (S11, S12), `cohort.html` (S13), `analysis/` (S15). The target layout is in `audit/AUDIT-REPORT.md` section 4.

## Files

- `CLAUDE.md` — Repository rules, technical conventions, visual system, workflow and testing
- `README.md` — What the tool is, its status, how to run it locally and how to run the tests
- `LICENSE` — `PLACEHOLDER: licence to be chosen by the owner`
- `package.json` — `"type": "module"`; version 0.2.0 (= `APP_VERSION`); scripts `test`, `lint` and `schema`; no dependencies
- `index.html` — Temporary landing page with a legacy-prototype notice and a link to `legacy/skills-assessment-hult.html`. Replaced by the skill hub in S5
- `legacy/skills-assessment-hult.html` — The original single-file prototype (scoringVersion 0.1.0), moved here unchanged from the repository root in S0. Line references in the audit and in `docs/SCORING.md` refer to this file. Exempt from lint through the allowlist in `tests/lint.mjs`
- `audit/AUDIT-REPORT.md` — Audit of the prototype against the brief: parameters, findings with severity and line references, premise challenges, target architecture, recommended measures, validation roadmap
- `audit/BUILD-PLAN.md` — The rebuild plan: decisions log, global rules, sessions S0 to S15, dependency map, human inputs required
- `audit/README.md` — Index of the audit and commands to reproduce the evidence
- `audit/evidence/harness.mjs` — Loads the prototype's script into a Node VM with a DOM stub; path argument optional, defaults to `legacy/skills-assessment-hult.html`
- `audit/evidence/attacks.mjs` — Adversarial scoring inputs
- `audit/evidence/cons.mjs` — Exhaustive check of the within-person consistency statistic over 3,125 response patterns
- `audit/evidence/browser.cjs` — Playwright run of the prototype (keyboard, Wason flow, reload, external requests)
- `audit/evidence/results.txt` — Recorded output of the three scripts above
- `docs/CONSTRUCTS.md` — Draft operational definitions, facets, planned measures, coverage tables and open questions for each skill, marked DRAFT for Hult review; sign-off table in the header (S2 gate)
- `docs/REVIEW-CHECKLIST.md` — Checklist Hult reviewers use to approve each skill in `docs/CONSTRUCTS.md`
- `docs/SCORING.md` — Scoring specification: legacy formulas (scoringVersion 0.1.0) and the platform skeleton with the stub task (0.2.0); new measures add sections as they are built
- `docs/ITEM-BANK.md` — Item bank conventions (set in S3) and the item table (empty until S6)
- `docs/ARCHITECTURE.md` — Module layout, routes, skill module contract, content convention, how a task runs, developer harness
- `docs/DATA-SCHEMA.md` — Data model, identifiers, storage, migrations and export bundle (S3); student-facing export and import added in S12
- `docs/data-schema.json` — The data model as JSON Schema, generated from `src/core/schema.js` by `npm run schema`; never edited by hand
- `docs/VALIDATION-PLAN.md` — Pilot protocol, analyses and change thresholds (written in S15)
- `docs/DESIGN.md` — Pointer to the Visual style section of this file
- `docs/CHANGELOG.md` — Changes by session, including every `scoringVersion` bump
- `src/core/version.js` — `SCHEMA_VERSION`, `APP_VERSION`, `SCORING_VERSION`
- `src/core/rng.js` — Seeded generator (mulberry32), `seedFromString`, `randomSeed`, unbiased `int(n)` and Fisher-Yates `shuffle`
- `src/core/ids.js` — Pseudonymous participant codes (`P-XXXX-XXXXC`, Crockford base 32 with a check character) and record IDs (`S-`, `A-`, `R-`)
- `src/core/schema.js` — Data model as JSDoc types and field definitions; `validate()`, `assertValid()`, `toJsonSchema()`
- `src/core/migrate.js` — Migration chain (empty at schema version 1) and `migrate(bundle)`
- `src/core/store.js` — Storage adapter interface; `LocalStorageAdapter` (prefix `skills5c:v1:`, try/catch, memory fallback with notice), `MemoryAdapter`, `migrateStoredNamespaces`, `mountStorageNotice`
- `src/core/timing.js` — End-timestamp timers with pause, extend, accommodation multiplier, untimed mode, snapshot and restore; `startTicker`, `formatMs`
- `src/core/router.js` — Hash routes `#/hub`, `#/skill/<id>`, `#/task/<skill>/<task>`, `#/results/<skill>`, `#/profile`
- `src/skills/registry.js` — `SKILL_MODULES` (empty until S6), `EXAMPLE_MODULES`, `validateManifest`, `validateContent`, `createRegistry`, `loadSkills`
- `src/skills/runner.js` — `runTask` (loads content, mounts, scores, saves the attempt), `itemsFor`, `assignForm`
- `src/skills/_example/index.js` — Developer stub skill manifest (accent `--accent-5`, not a skill hue)
- `src/skills/_example/pick.js` — The stub's one task: `mount` and `score`
- `content/_example/pick.js` — Example items for the stub (draft; not part of the item bank)
- `dev/platform.html` — Developer harness page, served over HTTP; replaced by the hub in S5
- `dev/platform.js` — Harness script: participant, sittings, routes, runs the stub task, shows saved attempts and the export
- `tests/fixtures.mjs` — Valid example records shared by the tests
- `tests/rng.test.mjs`, `tests/ids.test.mjs`, `tests/schema.test.mjs`, `tests/store.test.mjs`, `tests/migrate.test.mjs`, `tests/timing.test.mjs`, `tests/router.test.mjs`, `tests/registry.test.mjs` — Unit tests for the platform core, registry, runner and stub skill
- `tests/write-data-schema.mjs` — Writes `docs/data-schema.json` (`npm run schema`)
- `tests/legacy-scoring.test.mjs` — Characterisation tests asserting the prototype's current scores, ported from `audit/evidence/`
- `tests/lint.mjs` — Static checks across every `.html`, `.css` and `.js` file outside `audit/` and `legacy/`

Keep this list current. Every session that adds, moves or removes a file updates it in the same commit.

---

## Technical conventions

These are non-negotiable.

1. **No build step.** Vanilla JavaScript as ES modules, plain CSS, static HTML. No frameworks, no bundler, no transpiler, no runtime dependencies. Development-only tools (Node built-ins; Playwright and axe-core in later sessions) live in `tests/` and are never shipped to the browser.
2. **Served over HTTP.** ES modules do not load from `file://`. Opening the files directly is not supported (decided 2026-11-26, `audit/BUILD-PLAN.md` decisions log); the `file://` rule of the slides repository does not apply here.
3. **System fonts only.** No web fonts.
4. **No network calls of any kind.** No CDN links, no `fetch` or `XMLHttpRequest` to remote hosts, no analytics, no remote images. Student data never leaves the browser unless the student exports a file. Any future LLM scoring sits behind a disabled adapter (audit F-5).
5. **`<meta charset="utf-8">`** is the first element in `<head>`.
6. **Straight quotes in JavaScript.** Strings use `'`, `"` or backticks, never Unicode curly quotes.
7. **Persistence.** `localStorage` keys are namespaced `skills5c:v<N>:*`, where `<N>` is the storage schema version. Every read and write is wrapped in `try/catch`. If storage is unavailable, the tool still works and says that progress will not be saved.
8. **Versioning.** Every stored result records `schemaVersion`, `appVersion`, `scoringVersion`, `formId` and `seed`, plus raw responses and timings, so scores can be recomputed (audit D-6).
9. **Content separated from logic.** Item content lives in `content/<skill>/`; scoring lives in the skill module and is documented in `docs/SCORING.md`. No `innerHTML` with interpolated content strings (audit K-5).
10. **Privacy.** No names or email addresses are collected. Participants are identified by a random pseudonymous code.
11. **Accessibility.** WCAG 2.2 AA: keyboard operable throughout, visible focus, labels on every input, AA contrast, `prefers-reduced-motion` honoured, adjustable time limits, touch targets at least 44px on narrow screens.
12. **UK English** throughout, in prose, labels and code comments. Plain English for an undergraduate population, many with English as a second language.

---

## Visual style

This tool follows the reference design system of `mxtdnl/slides` and `mxtdnl/third-places`. Where this section and the reference disagree, the reference (`slides/CLAUDE.md`, Visual style) wins, except for the 5C accent mapping below, which is specific to this repository. The tokens and rules below are copied from `slides/CLAUDE.md`; wording that referred to decks or to `SLIDES.md` has been adapted and is marked *(adapted)*.

From S4 the tokens live in `styles/tokens.css`; until then they are defined inline on `:root` in each page.

A warm, hard-edged, playful Bauhaus visual language, closer to a Kandinsky painting or a Herbert Bayer poster than a corporate template. Pages should feel alive with colour and geometric energy: floating shapes, bold accent blocks, diagonal tension. The eight accent colours are the primary expressive tool; neutral surfaces exist to let them sing. Colours are CSS custom properties on `:root`. Use these values exactly.

### Theme

Light theme only, fixed. No `prefers-color-scheme` switching. *(adapted: the reference also defines a dark theme for decks in dimmed rooms; this tool does not use it.)*

**Light theme:**

| Variable | Hex | Usage |
|---|---|---|
| `--bg` | `#F2DFBE` | Page and stage background |
| `--bg-card` | `#FFFAF2` | Card and panel background |
| `--bg-deep` | `#E8D2A8` | Inset tracks, deeper surfaces |
| `--text` | `#2A1F18` | Headings, primary text |
| `--text-muted` | `#6A5A48` | Secondary text |
| `--border` | `#D8C8A8` | Borders, dividers |

**Eight accent colours:**

| Variable | Hex | Name |
|---|---|---|
| `--accent-1` | `#5C3A96` | Purple |
| `--accent-2` | `#B52838` | Red |
| `--accent-3` | `#C85218` | Burnt orange |
| `--accent-4` | `#D4A020` | Gold |
| `--accent-5` | `#7A5828` | Brown |
| `--accent-6` | `#B83068` | Magenta |
| `--accent-7` | `#CC6830` | Orange |
| `--accent-8` | `#7E58A8` | Lighter purple |

**Derived ink tones** (text only, where an accent that fails contrast must carry text):

| Variable | Hex | For |
|---|---|---|
| `--accent-4-ink` | `#7A5410` | Gold text on light surfaces |
| `--accent-7-ink` | `#9E4718` | Orange text on light surfaces |

**Feedback colours:**

| Token | Fill / border (light) | Text ink (light) | Tint bg (light) | Fill / border (dark) | Tint bg (dark) |
|---|---|---|---|---|---|
| correct | `#2A7A42` | `#1F6A36` | `#E6F4EA` | `#2A8A4A` | `rgba(42,138,74,0.15)` |
| incorrect | `#B82828` | `#B82828` | `#FDEEEE` | `#C83838` | `rgba(200,56,56,0.12)` |
| ambiguous | `#B98A10` | `#7A5410` | `#FFF3D6` | `#D4A020` | `rgba(212,160,32,0.12)` |

The fill values of correct (4.06:1 on cream) and ambiguous (2.40:1 on cream) fail as body text, hence the separate ink column. The dark columns are kept for fidelity with the reference and are not used here.

### 5C accent mapping

From `audit/AUDIT-REPORT.md` section J-4. Each skill always appears in its accent; no other skill uses that hue. Adjacent skills in the canonical order below contrast.

| Skill | Token | Hex | Text on light surfaces |
|---|---|---|---|
| Collaboration | `--accent-2` | `#B52838` red | `--accent-2` |
| Curiosity | `--accent-4` | `#D4A020` gold | `--accent-4-ink` `#7A5410` |
| Critical thinking | `--accent-1` | `#5C3A96` purple | `--accent-1` |
| Creativity | `--accent-6` | `#B83068` magenta | `--accent-6` |
| Communication | `--accent-3` | `#C85218` burnt orange | `--accent-3` |

S4 adds semantic tokens `--skill-collaboration`, `--skill-curiosity`, `--skill-critical`, `--skill-creativity` and `--skill-communication` that point at these accents. Hult branding is kept through the logo and the header/footer lockup. Whether Hult's aubergine replaces `--accent-1` is an open decision pending Hult brand guidelines (audit section 7, item 2).

### Accent colour usage

- **Section identity.** Each section carries an accent via a thick left rail, a coloured top rule or a coloured eyebrow. For skill content, the accent is the skill's accent from the mapping above.
- **Card accents.** A card in a group gets a thick left or top border in its group colour, with its label in the same colour or its ink tone.
- **Colour bars.** Thick (`3px` to `6px`) rules in accent colours separate regions. They are compositional elements, not mere dividers.
- **Solid-colour blocks.** High-emphasis moments (section openers, task headers, reveals) use a solid accent fill. The colour field is the visual event.
- **Active and selected states** shift border or background to an accent colour, never just a darker neutral.
- **Data.** Bars, dots and swatches use the accent mapped to the data they represent.
- **Pairing.** No two adjacent accent elements share a hue.
- **Tints.** For secondary emphasis, an accent at `0.08` to `0.12` opacity over `--bg-card`.
- **Neutrals stay neutral.** `--bg`, `--bg-card`, `--bg-deep` are never tinted; accents sit on top of them.
- **Err toward more colour.** If a squinted page reads as "beige with text", it needs more accent fills.

### Typography

- **Font stack:** `system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- **Weights:** 800 for headings, 700 for labels and buttons, 400 for body.
- **Uppercase** for eyebrows, sub-headings, buttons, labels, tags and table headers. Body text and headings stay in sentence case.
- **Coloured type** for eyebrows and labels only; headings stay `--text` unless they sit on a solid accent fill.
- Pages use `16px` base, `clamp()` headings, `0.95rem` to `1.05rem` body, `0.68rem` to `0.85rem` eyebrows with `0.08em` to `0.2em` letter-spacing. *(adapted: the reference gives this scale for its `index.html`; decks use a separate stage scale not relevant here.)*
- No italic display headings (audit J-1).

### Geometry

Zero border-radius on cards, buttons, panels and inputs. Non-negotiable. The only exceptions are decorative circles and progress dots (`50%`). Borders are `2px` minimum; a `1px` border reads as incidental.

### Decorative geometry

Abstract shapes in accent colours appear on every page. They are empty elements or pseudo-elements with `position: absolute; pointer-events: none`, behind content.

- **Vocabulary:** solid squares and rectangles (rotated `12deg` to `45deg`), circles (solid or thick rings), triangles (`clip-path` or the border trick), diagonal bars (rotated `2deg` to `8deg`).
- **Placement:** two or three shapes per page, in contrasting hues, bleeding off at least one edge; larger shapes behind card grids to anchor them; shapes in any significant negative space.
- **Opacity:** background shapes `0.06` to `0.12`. Foreground accents (pips, marker blocks) at full opacity.
- **Layering:** shapes at a lower `z-index` than content; the containing element has `overflow: hidden` so rotations clip cleanly.
- Decorative shapes carry `aria-hidden="true"` and never sit behind text in a way that reduces contrast below AA.

### Components

- **Buttons:** `--accent-1` fill, white text, weight 700, uppercase, `letter-spacing: 0.12em`. Hover: `--accent-2` fill and `translateY(-2px)`. Disabled: `opacity: 0.4; cursor: not-allowed`. Ghost variant: transparent fill, thick `--text` border. Secondary actions may use another accent fill with white text, provided the pair meets AA contrast *(adapted: the reference cites its `SLIDES.md` section 10 contrast rules; here the contrast check added to `tests/lint.mjs` in S4 governs)*.
- **Cards:** `--bg-card` fill, thick `--border` border, thick accent left or top border when the card has a group identity. Interactive hover: `translateY(-2px)`, warm shadow, border shifts to the accent.
- **Shadows:** warm-tinted only, `0 4px 12px rgba(42,31,24,0.1)` on hover. No resting shadows.
- **Feedback boxes:** thick left border in the feedback colour, matching tint, text in the feedback ink.
- **Accent pips:** small solid squares marking list items, legend entries or steps.
- **Colour-block banners:** full-width solid accent fill, uppercase heading. The poster moments.

### Motion

- Hover: `translateY(-2px)` over `0.15s ease`.
- Reveals: `opacity 0` and `translateY(0.4rem)` to visible over `0.3s ease`.
- Colour changes: `border-color`, `background-color`, `color` over `0.2s ease`.
- Bar fills: width from zero over `0.6s`, or staggered `40ms` to `80ms` per bar.
- Under `prefers-reduced-motion: reduce`, every duration becomes `0.001ms`.

### Naming conventions

- Hyphenated compound class names (`skill-tile`, `timer-ring`, `results-bar`).
- State classes: `.active`, `.visible`, `.selected`, `.correct`, `.incorrect`, `.ambiguous`, `.locked`, `.revealed`, `.running`, `.expired`, `.disabled`.
- Utility classes: `.eyebrow`, `.lede`, `.small`, `.micro`, `.quiet`.
- Data attributes: `data-accent`, `data-skill`, `data-task`, `data-item`.

---

## Workflow

1. **Read** this file, then the session prompt in `audit/BUILD-PLAN.md` and every document it names. Respect gates: S6 to S10 need the `docs/CONSTRUCTS.md` sign-off recorded in its header.
2. **Branch.** Each session commits on its own branch, `build/s<N>-<slug>`, as named in its prompt.
3. **Plan before large changes.** If the session prompt leaves a material choice open, state the choice and the recommendation before building. If an instruction conflicts with this file, the audit or the build plan, point out the conflict and ask before proceeding.
4. **Build** in small steps, running `npm test` and `npm run lint` after each significant change, not once at the end.
5. **Document in the same commit.** Scoring changes update `docs/SCORING.md` and bump `scoringVersion`; data changes update `docs/DATA-SCHEMA.md`; new items update `docs/ITEM-BANK.md`; every session adds an entry to `docs/CHANGELOG.md` and updates the Files section above.
6. **Report**: files created or changed, test and lint results (with output for any failure), every `PLACEHOLDER:` string and every `status: "draft"` item added, and any decision still needed from the owner or Hult.

---

## Testing

Requires Node 18 or later; no `npm install` is needed for the current tests.

```sh
npm test        # node --test tests/*.test.mjs
npm run lint    # node tests/lint.mjs
```

`npm test` runs every `tests/*.test.mjs` file with `node:test`. The script uses a shell glob rather than `node --test tests/`, because Node 22 treats a bare directory argument as a module path and fails.

- The platform tests (`rng`, `ids`, `schema`, `store`, `migrate`, `timing`, `router`, `registry`) import the browser modules in `src/` directly; they need no DOM. Storage is tested through `MemoryStorage`, timers through an injected clock. The shuffle is checked for uniformity with chi-square tests over 10,000 shuffles, and the test is shown to catch a known biased shuffle. `schema.test.mjs` fails if `docs/data-schema.json` is out of date (`npm run schema`).

- `tests/legacy-scoring.test.mjs` loads `legacy/skills-assessment-hult.html` into a Node VM, calls the prototype's own scoring functions and asserts their current outputs, which reproduce `audit/evidence/results.txt`. These are characterisation tests: they pin the defective behaviour (for example, keyword salad scoring 86) so that any change is deliberate. A change to an expected value goes with a `scoringVersion` bump and a `docs/CHANGELOG.md` entry.

`tests/lint.mjs` checks every `.html`, `.css` and `.js` file outside `audit/` and `legacy/` and exits non-zero on any failure:

- `<meta charset="utf-8">` present and first in `<head>` (HTML)
- No `http:` or `https:` URLs in `src`, `href`, `url()`, `@import` or `fetch()`, and no `XMLHttpRequest`
- No curly quotes inside `<script>` blocks (HTML)
- No `border-radius` values other than `0` and `50%`
- JavaScript (`.js`): no `http:` or `https:` URLs in `import` or `fetch()`; no `XMLHttpRequest`, `sendBeacon`, `WebSocket` or `EventSource`; no `innerHTML` or `outerHTML` assignment and no `insertAdjacentHTML` (audit K-5); no curly quotes
- Files on the allowlist (currently only `legacy/skills-assessment-hult.html`) are exempt and printed as a warning
- A count of `PLACEHOLDER:` strings per file, printed as a warning

Later sessions extend this: a contrast check on `styles/tokens.css` (S4), Playwright end-to-end tests (S5, S11, S14) and axe-core accessibility checks (S14), added as development dependencies only.

To reproduce the audit evidence, see `audit/README.md`.

To serve the repository locally:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. The platform developer harness is at `http://localhost:8000/dev/platform.html`.
