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
  <skill>/       one directory per skill, from S6
content/
  _example/      example content for the stub
  <skill>/       item banks, from S6
dev/
  platform.html  developer harness (not student-facing), replaced by the hub in S5
```

Planned: `styles/` and `assets/` (S4), `src/report/` (S11, S12), `cohort.html` (S13).

## Routes

`src/core/router.js`. Hash routes, so that any static host works without server configuration.

| Hash | Route name | Parameters |
|---|---|---|
| `#/hub` (also empty, `#` and `#/`) | `hub` | |
| `#/skill/<skillId>` | `skill` | `skillId` |
| `#/task/<skillId>/<taskId>` | `task` | `skillId`, `taskId` |
| `#/results/<skillId>` | `results` | `skillId` |
| `#/profile` | `profile` | |

IDs are slugs (`[a-z0-9_][a-z0-9_-]*`); anything else is `notFound`. `toHash(name, params)` builds a hash and refuses invalid IDs.

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
    estMinutes: 3,
    loadContent: () => import('../../../content/critical/self-report.js'),
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

`validateManifest()` checks every rule above that can be checked without running a task. `createRegistry()` also refuses two skills with the same `id` or the same `accentToken`.

### `mount(el, ctx)`

Renders the task into `el` and returns an optional cleanup function. It builds DOM with `createElement` and `textContent`, never `innerHTML` with content strings (audit K-5). It never writes to storage. The context:

| Member | Meaning |
|---|---|
| `skillId`, `taskId` | |
| `mode` | `"practice"` or `"assessment"`. In assessment mode a task gives no feedback |
| `formId` | `"A"`, `"B"` or `"practice"` |
| `items` | The item array for this mode and form, chosen by the runner |
| `rng` | Seeded generator for this task in this sitting (`src/core/rng.js`). Use it for every random choice |
| `now()` | Clock in epoch milliseconds. Use it for `shownAt` |
| `createTimer(limitMs, options)` | A timer with the participant's accommodation multiplier already applied (`src/core/timing.js`). Pass `null` for untimed |
| `record({ itemId, response, shownAt, answeredAt? })` | Record one raw response. `shownAt` and `answeredAt` are epoch ms; the runner stores `shownAt` as ISO and computes `rtMs` |
| `complete()` | The task is finished |

### `score(attempt, form)`

A pure function: given the attempt (with its `itemResponses`) and the items of the form it was taken on, returns `{ rawScore, score }`. It uses nothing else, so any stored attempt can be re-scored. `score` is a number, null, or one value per facet code. Each task's scoring is specified in `docs/SCORING.md`.

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

The runner calls `validateContent()` before every task and refuses to run on invalid content. Items are draft until reviewed by Hult staff.

## How a task runs

`runTask({ skill, task, sitting, store, el, multiplier })` in `src/skills/runner.js`:

1. Loads the task's content and validates it.
2. Chooses the items: the practice pool in practice mode, form A or B in assessment mode (`itemsFor`).
3. Derives the task's seed from the sitting seed, skill ID and task ID.
4. Mounts the task with its context and collects the responses it records.
5. When the task calls `complete()`, unmounts it, stops its timer, calls `score(attempt, items)`, and saves the TaskAttempt through the store (which validates it).

`cancel()` unmounts without saving. The developer harness (`dev/platform.html`) shows the whole path with the stub skill: hub, skill, task, results and profile routes, with records saved to and restored from `localStorage`.

## Developer harness

`dev/platform.html` is for developers only. Serve the repository (`python3 -m http.server 8000`) and open `http://localhost:8000/dev/platform.html`. It creates a participant with the consent notice version `dev-harness`, lists the stub skill, runs its task in practice or assessment mode, and shows saved attempts and the full JSON export. It is replaced by the skill hub in S5.
