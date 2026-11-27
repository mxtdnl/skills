# Architecture

**Purpose.** Describes how the rebuilt tool is put together: the module layout, the skill module contract, the content convention, and how a task runs from route to stored record. The target layout comes from `audit/AUDIT-REPORT.md` section 4. The data model is in `docs/DATA-SCHEMA.md`.

## Principles

- **No build step.** Vanilla ES modules, plain CSS, static HTML. No framework, bundler or runtime dependency (CLAUDE.md, Technical conventions 1).
- **Served over HTTP.** Browsers refuse to load ES modules from `file://` pages (module scripts are fetched with CORS, and a `file://` page has an opaque origin), so the tool must be served, by GitHub Pages or a local server. Decided 2026-11-26 (`audit/BUILD-PLAN.md` decisions log).
- **No network calls.** Every module is loaded from the same origin. Student data leaves the browser only in a file the student exports.
- **Content separate from logic.** Items live in `content/`; scoring lives in the skill module and is documented in `docs/SCORING.md`.
- **Replayable.** Every random choice uses the sitting's seed; every response is stored raw with its timing; every record carries its versions.

## Layout

```
src/core/
  version.js     SCHEMA_VERSION, APP_VERSION, SCORING_VERSION
  rng.js         seeded generator (mulberry32), unbiased integers, Fisher-Yates shuffle
  ids.js         pseudonymous participant codes and record IDs
  schema.js      data model (JSDoc types and field definitions), validate(), JSON Schema export
  migrate.js     versioned migrations between schema versions
  store.js       storage adapter interface; LocalStorageAdapter, MemoryAdapter
  timing.js      end-timestamp timers: pause, extend, accommodation multiplier, untimed
  router.js      hash routes
src/skills/
  registry.js    the list of skill modules; manifest and content validation
  runner.js      runs one task in a sitting and stores the attempt
  _example/      developer stub skill proving the contract
  common/        shared by the five skills (S6): self-report component, its scoring, manifest builder; ui.js task DOM helpers (S9, from critical/)
  <skill>/       one directory per skill, from S6 (index.js: the manifest)
  critical/      S7: selection.js (CT-T1), choice.js (CT-T2, CT-T4), calibration.js (CT-T3)
  communication/ S9: two-part.js, clearer.js (CM-T1), spot.js (CM-T2), rewrite.js (CM-T3), score.js, llm-scorer.js (disabled)
  creativity/    S8: ideas.js (idea-list task UI), ideas-score.js, text.js, summary.js, llm-scorer.js (disabled)
src/app/
  main.js        application shell entry (loaded by index.html): store, registry, router, render
  progress.js    pure rules: step and sitting state, windows, forms, programme batteries
  consent.js     consent wording and its version
  dom.js         createElement helpers, confirmation dialog, live announcements
  transfer.js    export and import stubs, replaced in S12
  views/         start (first run), hub, skill, run, results, settings
content/
  _example/      example content for the stub
  <skill>/       item banks, from S6 (self-report.js; one file per task from S7, for example critical/ct-t1.js)
```

Design system (S4): `styles/` (tokens, base, components), `assets/` and `styleguide.html`; see `docs/DESIGN.md`. Planned: `src/report/` (S11, S12), `cohort.html` (S13).

## Routes

`src/core/router.js`. Hash routes, so that any static host works without server configuration.

| Hash | Route name | Parameters |
|---|---|---|
| `#/hub` (also empty, `#` and `#/`) | `hub` | |
| `#/skill/<skillId>` | `skill` | `skillId` |
| `#/task/<skillId>/<taskId>` | `task` | `skillId`, `taskId` |
| `#/results/<skillId>` | `results` | `skillId` |
| `#/profile` | `profile` | (shows Settings) |
| `#/start`, `#/start/<step>` | `start` | `step`: `consent`, `language`, `code` or `returning` (first run) |
| `#/run/<sittingId>/<stepId>` | `run` | `sittingId` (`S-` record ID), `stepId` (`self-report` or a task ID) |
| `#/settings` | `settings` | |

IDs are slugs (`[a-z0-9_][a-z0-9_-]*`), except `sittingId`, which is a sitting record ID; anything else is `notFound`. `toHash(name, params)` builds a hash and refuses invalid IDs. The shell redirects the S3 route `#/task/<skillId>/<taskId>` to the skill page: steps run under `#/run/...`, which names the sitting, so a reload resumes the right one.

## Skill module contract

Each skill is one directory under `src/skills/`, whose `index.js` default-exports a manifest. The registry (`src/skills/registry.js`) is the only list of skill modules; the hub, results and export code read manifests from it, and nothing else names the skills.

```js
export default {
  id: 'critical',                    // slug; also used in routes and records
  label: 'Critical thinking',
  accentToken: '--skill-critical',   // CSS custom property; unique per skill (CLAUDE.md, 5C accent mapping)
  facets: [                          // from docs/CONSTRUCTS.md
    { code: 'CT1', label: 'Logical reasoning' },
  ],
  selfReport: null | {
    label: 'About you',              // optional; shown as the step name
    estMinutes: 3,
    loadContent: () => import('../../../content/critical/self-report.js'),
    mount(el, ctx) { /* as for a task */ },
    score(selfReport, items) { return { score }; },
  },
  tasks: [
    {
      id: 'ct-t1',                   // slug, unique within the skill
      label: 'Conditional reasoning',
      type: 'choice',                // slug describing the response format
      estMinutes: 4,
      facets: ['CT1'],               // facet codes this task measures; must be declared above
      loadContent: () => import('../../../content/critical/ct-t1.js'),
      mount(el, ctx) { /* render; call ctx.record() and ctx.complete() */ return () => { /* cleanup */ }; },
      score(attempt, form) { return { rawScore, score }; },
    },
  ],
};
```

The S3 prompt's contract is `{id, label, accentToken, facets, selfReport, tasks: [{id, type, estMinutes, mount(el, ctx), score(attempt, form)}]}`. S3 adds three task fields, all required: `label` (for the hub), `facets` (so coverage can be checked against `docs/CONSTRUCTS.md`) and `loadContent` (so the runner, not the task, chooses the item pool).

S5 adds `selfReport.mount` (required) and `selfReport.label` (optional), and reserves the task ID `self-report` for the self-report step.

S6 allows `tasks: []` for a skill that has a self-report, so the five skills can be registered with their self-reports before their tasks are built (S7 to S10). A skill must still have at least one step. A self-report's `score()` may also return `quality` and `retrospective`; the runner stores them on the record (see `docs/SCORING.md`, Self-report). The five manifests are built by `skillManifest()` in `src/skills/common/manifest.js` from their `SKILL_CATALOGUE` entries, so labels, accents and facets are defined once.

`validateManifest()` checks every rule above that can be checked without running a task. `createRegistry()` also refuses two skills with the same `id` or the same `accentToken`.

**Steps.** `stepsFor(skill, mode)` gives a skill's ordered steps: the self-report first, then the tasks in manifest order. Practice has no self-report (a self-report has no practice pool), so a practice sitting is the tasks only.

**Critical thinking (S7).** The first skill with tasks: `ct-t1` (type `selection`), `ct-t2` and `ct-t4` (type `choice`, both built by `choiceTask({ facet })`), `ct-t3` (type `calibration`). Each task resumes at the first item without a response; CT-T3 records two responses on a revision item (`phase` `initial`, then `revised`) and resumes at the evidence screen when only the first exists. Response shapes and scoring: `docs/SCORING.md`, Critical thinking tasks.

**Creativity (S8).** `cr-t1` and `cr-t2` (type `idea-list`) share `ideas.js` and `ideas-score.js`; one item per form, so the step records drafts of one response (`{ lines, final, elapsedMs }`) and the latest is scored. The scorer needs the English word list, which is loaded with the task content (`loadDictionary()` in `text.js`, called by `loadContent`) so the hub never loads it. The timer comes from `ctx.createTimer`. Response shapes and scoring: `docs/SCORING.md`, Creativity tasks.

**Skill catalogue.** `SKILL_CATALOGUE` in `src/skills/registry.js` lists the five skills in canonical order with their accent tokens and their facets from `docs/CONSTRUCTS.md` (signed off by the owner, 2026-11-27). The hub shows a skill whose module is not yet registered as "in preparation" from this entry. Since S6 all five modules are registered in `SKILL_MODULES`; their manifests are built from this entry, and `tests/registry.test.mjs` checks that they agree. A skill with no tasks yet shows Practice as "in preparation" on its skill page.

### `mount(el, ctx)`

Renders the task into `el` and returns an optional cleanup function. It builds DOM with `createElement` and `textContent`, never `innerHTML` with content strings (audit K-5). It never writes to storage. The context:

| Member | Meaning |
|---|---|
| `skillId`, `taskId` | |
| `mode` | `"practice"` or `"assessment"`. In assessment mode a task gives no feedback |
| `formId` | `"A"`, `"B"` or `"practice"` |
| `items` | The item array for this mode and form, chosen by the runner |
| `rng` | Seeded generator for this task in this sitting (`src/core/rng.js`). Use it for every random choice |
| `programmeEnd` | True in an end-of-programme sitting (S6; `isProgrammeEnd` in `src/skills/runner.js`): a programme sitting at an even window. The self-report's retrospective items are then at the end of `items` |
| `now()` | Clock in epoch milliseconds. Use it for `shownAt` |
| `createTimer(limitMs, options)` | A timer with the participant's accommodation multiplier already applied (`src/core/timing.js`). Pass `null` for untimed |
| `record({ itemId, response, shownAt, answeredAt? })` | Record one raw response and autosave. `shownAt` and `answeredAt` are epoch ms; the runner stores `shownAt` as ISO and computes `rtMs`. Returns a Promise that resolves when saved |
| `complete()` | The task is finished |
| `kind` | `"task"` or `"selfReport"` (S5) |
| `resume` | The responses already recorded, when resuming an in-progress record (S5). Start at the first item without a response; never re-record those items |
| `rngFor(itemId)` | A generator for one item, the same on every mount (S5). Use it for per-item choices such as option order, so a resumed item looks the same |
| `checkpoint()` | Save without a response, for example after pausing a timer (S5) |

### `score(attempt, form)`

A pure function: given the attempt (with its `itemResponses`) and the items of the form it was taken on, returns `{ rawScore, score }`. It uses nothing else, so any stored attempt can be re-scored. `score` is a number, null, or one value per facet code. A task with no automated score (CM-T3 Rewrite, S9) returns null `rawScore` and `score` and a boolean `coachScorable`, which the runner stores on the attempt. Each task's scoring is specified in `docs/SCORING.md`.

## Content convention

`content/<skill>/<task>.js` is an ES module exporting three arrays:

```js
export const formA = [ /* items */ ];
export const formB = [ /* items */ ];
export const practice = [ /* items */ ];
```

Every item has a unique `id` and `status: "draft"` or `"reviewed"`. Other fields are defined by the task and documented in `docs/ITEM-BANK.md`. `validateContent()` enforces:

- every item has an `id` and a valid `status`;
- no item ID appears in more than one pool, so practice and assessment items never mix (global rule) and forms A and B are disjoint (audit D-2).

A self-report module may also export `retrospective` (S6): end-of-programme items, one per facet, whose IDs are checked with the other pools. They are added after the form's items only in an end-of-programme sitting.

The runner calls `validateContent()` before every task and refuses to run on invalid content. Items are draft until reviewed by Hult staff.

## How a step runs

`runStep({ skill, step, sitting, store, el, existing, multiplier })` in `src/skills/runner.js` (S5; `runTask({ task, ... })` is kept as a wrapper):

1. Loads the step's content and validates it.
2. Chooses the items: the practice pool in practice mode, form A or B in assessment mode (`itemsFor`). For a self-report in an end-of-programme sitting, appends the content's `retrospective` items (S6).
3. Derives the step's seed from the sitting seed, skill ID and step ID.
4. Saves a new record with `status: "in-progress"`, or takes `existing` (an in-progress record of the same step) to resume.
5. Mounts the step with its context. Every `record()` appends the response and saves the record; saves run one after another, in order. A timed step's timer state is saved with each response and each `checkpoint()`. A timer saved while running resumes paused, at the remaining time it had when last saved, so time away from the page is not counted (S8).
6. When the step calls `complete()`, unmounts it, stops its timer, calls `score(record, items)` (for a self-report, also storing `quality` and `retrospective` when returned), and saves the record with `status: "complete"` through the store (which validates it).

`cancel()` unmounts without completing: it pauses the timer, saves, and leaves the in-progress record for a later resume. `flush()` waits for pending saves.

## Application shell

`index.html` loads `src/app/main.js`. Every render reloads the records from the store, so the page always shows what is saved and a reload restores the same screen. Pure rules live in `src/app/progress.js` and are unit-tested; views build DOM with `createElement` and `textContent` only.

- **First run** (`#/start`): welcome (purpose, what is stored, prototype notice) → consent (a, required; b, optional; wording in `src/app/consent.js`, recorded in `docs/CONSENT.md`) → optional language question → your code. The participant record is created at the end of the language step. A returning student can enter an existing code instead of getting a new one.
- **Hub** (`#/hub`): one tile per skill in `SKILL_CATALOGUE`, with facets, estimated minutes (from the manifest's steps) and a status per mode; last activity; the programme sitting entry. While a programme battery is in progress, the hub shows only the battery.
- **Skill page** (`#/skill/<id>`): Practice (unlimited, feedback, never counted) and Assessment sitting (one per skill in the "self" window; no feedback until finished), each with its ordered steps. Assessment steps are taken in order; practice steps in any order.
- **Runner** (`#/run/<sittingId>/<stepId>`): runs one step, resuming at the next unanswered item. "Save and exit" and in-page links ask for confirmation while a step runs; the browser's Back button leaves without asking, which loses nothing because every response is already saved.
- **Results** (`#/results/<id>`): available once an assessment sitting is complete; lists what was recorded. Full results views come in S11. No claim of change between sittings is made (audit D-3).
- **Settings** (`#/settings`): code, extended time, reduced motion, programme-evaluation consent, export and import (stubs until S12), reset all data (type `DELETE`).
- Rules for windows, forms and programme sittings: `docs/DATA-SCHEMA.md`, Sitting.

**Example skill.** Open `index.html?example` to add the developer stub skill to the hub (and to programme batteries). Without `?example`, the hub lists only production skills, of which there are none before S6. The end-to-end tests use it.
