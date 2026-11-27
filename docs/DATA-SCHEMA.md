# Data schema

**Purpose.** Specifies the data the tool stores and exports: records, fields, versioning, storage keys and file formats. It is the contract between the tool, the export and import functions, the coach/cohort view and any later Hult-systems integration.

**Source of truth.** The field definitions in `src/core/schema.js` (`RECORDS`). `validate()` checks records against them, and `docs/data-schema.json` (JSON Schema, draft 2020-12) is generated from them with `npm run schema`. `tests/schema.test.mjs` fails if the JSON file is out of date. This document explains the fields; where it and `schema.js` disagree, `schema.js` is right and this document must be corrected.

The legacy prototype stores nothing and exports only a text summary (audit D-1, L-1). Everything below applies to the rebuilt tool only.

## Versioning

Three versions are recorded, all defined in `src/core/version.js`:

| Field | Type | Meaning | Changes when |
|---|---|---|---|
| `schemaVersion` | integer | Shape of the stored records. Also the `<N>` in the storage prefix `skills5c:v<N>:` | A field is added, removed, renamed or changes meaning. Needs a migration |
| `appVersion` | semver string | The release of the tool. Matches `package.json` | Every release |
| `scoringVersion` | semver string | The scoring rules in force | Any change to any scoring function. Documented in `docs/SCORING.md` |

Current values: `schemaVersion` 2, `appVersion` 0.3.0, `scoringVersion` 0.3.0.

Every record carries `schemaVersion`. A sitting carries all three plus `formId` and `seed`. Task attempts and self-reports carry `scoringVersion` and every raw response with its timing, so any score can be recomputed under a later scoring version (audit D-6). Results with different `scoringVersion` values are never compared without re-scoring.

## Records

There are four record types. Each record has a `type` field naming its type. No record has a field for a name, email address or any other direct identifier, and the validator rejects any field not listed here, so one cannot be added by accident (CLAUDE.md, Technical conventions 10).

Common formats:

- **date-time**: ISO 8601 with a time zone, as produced by `Date.prototype.toISOString()`, for example `2026-11-26T09:00:00.000Z`.
- **participant ID**: `P-XXXX-XXXXC`, eight random Crockford base-32 characters (40 bits) and one check character. See [Identifiers](#identifiers).
- **record ID**: a type prefix (`S`, `A` or `R`), a hyphen and 16 random Crockford base-32 characters (80 bits).
- **slug**: lower-case letters, digits, `_` and `-`, for skill and task IDs.

### Participant

One student.

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | `"participant"` | yes | |
| `schemaVersion` | integer | yes | |
| `id` | participant ID | yes | Random. The only identifier |
| `createdAt` | date-time | yes | |
| `consent` | object | yes | See below |
| `languageBackground` | object | no | Only if `consent.languageBackground` is true (audit E-1) |
| `settings` | object | no | See below. Written by the first-run flow and the Settings page |

`consent`:

| Field | Type | Notes |
|---|---|---|
| `noticeVersion` | string | Version of the consent wording the student saw, from `src/app/consent.js` (currently `consent-2026-11-27`). Every version's wording is in `docs/CONSENT.md`. Records migrated from schema version 1 carry `dev-harness` |
| `givenAt` | date-time | Time of the latest consent decision (first run, or a change in Settings) |
| `toolUse` | `true` | Consent (a): agreed to use the tool as described. Required; the tool cannot be used without it. Added in schema version 2 |
| `programmeEvaluation` | boolean | Agreed that results may be used, pseudonymously, for cohort-level programme evaluation (audit F-2) |
| `languageBackground` | boolean | Agreed to record language background, for differential item functioning checks in the pilot |

`languageBackground`:

| Field | Type | Notes |
|---|---|---|
| `englishFirstLanguage` | `"yes"`, `"no"` or `"prefer-not-to-say"` | Answer to "Is English your first language?". The categories Hult needs for the pilot analysis are not decided (S15). A change is a schema change |

`settings` (schema version 2):

| Field | Type | Notes |
|---|---|---|
| `timeMultiplier` | `1`, `1.5` or `2` | Extended time for timed tasks (audit E-3). Passed to the runner; recorded on each timed attempt as `timing.multiplier` |
| `reducedMotion` | boolean | Reduce motion even if the operating system does not ask for it |

### Sitting

One occasion on which a participant works through the steps of one skill (its self-report and tasks), in one mode, with one form.

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | `"sitting"` | yes | |
| `schemaVersion` | integer | yes | |
| `id` | record ID, prefix `S` | yes | |
| `participantId` | participant ID | yes | |
| `skillId` | slug | yes | The skill this sitting covers. Added in schema version 2 |
| `mode` | `"practice"` or `"assessment"` | yes | Practice: practice pool, feedback allowed, not used as evidence. Assessment: fixed form, no feedback until the skill is complete |
| `windowId` | `"self"`, `"programme:<code>"` or null | yes | Assessment window; null for practice. See [Windows](#windows-and-programme-sittings). Added in schema version 2 |
| `programme` | object or null | yes | Set for a sitting that is part of a programme battery. See below. Added in schema version 2 |
| `formId` | `"A"`, `"B"` or `"practice"` | yes | `"practice"` in practice mode; `"A"` or `"B"` in assessment mode |
| `seed` | integer, 0 to 2^32 - 1 | yes | Seeds every random choice in the sitting (see `src/core/rng.js`) |
| `appVersion` | semver | yes | |
| `scoringVersion` | semver | yes | |
| `startedAt` | date-time | yes | |
| `completedAt` | date-time or null | yes | Null until the sitting is complete |

`programme`:

| Field | Type | Notes |
|---|---|---|
| `code` | string | The coach's sitting code, normalised to upper case, for example `SEP26-1` |
| `window` | integer, 1 to 9 | The last digit of the code: 1 for the start of the programme, 2 for the end |
| `skillOrder` | array of slugs | The fixed order of the battery, the same on every sitting of the battery |
| `position` | integer | This sitting's index in `skillOrder` |

Form assignment (`assignForm` and `firstForm` in `src/skills/runner.js`, audit D-2). Every participant has a first form, set by the parity of an FNV-1a hash (`seedFromString`, `src/core/rng.js`) of their participant ID: even means A first, odd means B first. Because it depends only on the code, a student who re-enters their code on a new device keeps the same order.

- **Programme sittings** take the form from the window: odd windows (1, the start) get the first form, even windows (2, the end) get the other. This keeps the counterbalancing correct even if the student's browser data is lost between the two sittings.
- **Self-directed assessment sittings** get the other form from the participant's most recent assessment sitting of the same skill, or their first form if there is none.

The form used is stored as `formId` on each sitting.

Per-task seeds are derived as `seedFromString("<seed>:<skillId>:<taskId>")`, so adding or reordering tasks does not change the random choices within another task. Per-item generators (`ctx.rngFor(itemId)`) are derived as `seedFromString("<taskSeed>:<itemId>")`, so an item resumed after a reload shows the same option order.

### Windows and programme sittings

- A **practice** sitting has no window (`windowId: null`). Practice is unlimited and never counted as evidence.
- An **assessment** sitting belongs to one window. A participant has at most one assessment sitting per skill per window.
  - `"self"`: started by the student from the skill page. One per skill.
  - `"programme:<code>"`: started with a coach's sitting code. The code starts a full battery: one assessment sitting per available skill, created together, in the fixed canonical order (`SKILL_CATALOGUE` in `src/skills/registry.js`), each recording that order in `programme.skillOrder`. Steps are taken in that order; practice and self-directed assessment are unavailable until the battery is complete. Each code can be used once.
- Sitting code format: 2 to 12 letters or digits, a hyphen and one window digit (`^[A-Z0-9]{2,12}-[1-9]$`, after normalising case and removing spaces). The code is not verified against any list: the tool has no server, so any well-formed code is accepted.
- A sitting is complete when every step has a complete record; `completedAt` is then set.

### TaskAttempt

One attempt at one task within a sitting.

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | `"taskAttempt"` | yes | |
| `schemaVersion` | integer | yes | |
| `id` | record ID, prefix `A` | yes | Added to the S3 prompt's field list so that a sitting can hold more than one attempt at a task (for example, repeated practice) |
| `sittingId` | record ID, prefix `S` | yes | |
| `skillId` | slug | yes | |
| `taskId` | slug | yes | |
| `itemResponses` | array of item responses | yes | In the order answered |
| `rawScore` | number or null | yes | Defined per task in `docs/SCORING.md` |
| `score` | number, null, or object | yes | A single number, or one number (or null) per facet code, for example `{ "CT1": 0.6, "CT2": null }`, in line with the per-facet reporting decision in `docs/CONSTRUCTS.md` |
| `scoringVersion` | semver | yes | The version that produced `rawScore` and `score` |
| `status` | `"in-progress"` or `"complete"` | yes | Added in schema version 2. An in-progress attempt has `rawScore`, `score` and `completedAt` null |
| `startedAt` | date-time | yes | When the step was first opened |
| `updatedAt` | date-time | yes | Last autosave |
| `completedAt` | date-time or null | yes | Null while in progress |
| `timerSnapshot` | object | no | The timer state (`snapshot()` in `src/core/timing.js`) while a timed task is in progress, so it resumes with the same time left. Removed on completion |
| `timing` | timing log | no | Present for completed timed tasks |

Item response:

| Field | Type | Notes |
|---|---|---|
| `itemId` | string | Matches an item `id` in `content/` |
| `response` | any JSON value | Raw response. Its shape is defined by the task and documented with it. Options are stored by their original index, never by screen position |
| `rtMs` | number or null | Milliseconds from `shownAt` to the response. Null if not answered |
| `shownAt` | date-time | |

Timing log (from `src/core/timing.js`, audit E-3, I-5):

| Field | Type | Notes |
|---|---|---|
| `limitMs` | number or null | Base time limit. Null if untimed |
| `multiplier` | number, at least 1 | Accommodation multiplier (1 = standard time) |
| `extendedMs` | number | Total time added by the student's extensions |
| `pausedMs` | number | Total time paused |
| `expired` | boolean | The limit was reached before the task was completed |

### SelfReport

One skill's self-report questionnaire within a sitting.

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | `"selfReport"` | yes | |
| `schemaVersion` | integer | yes | |
| `id` | record ID, prefix `R` | yes | Added, as for TaskAttempt |
| `sittingId` | record ID, prefix `S` | yes | |
| `skillId` | slug | yes | |
| `responses` | array of item responses | yes | Same shape as a task's item responses |
| `score` | number, null, or object | yes | As for TaskAttempt |
| `scoringVersion` | semver | yes | Added: a self-report score is a scoring rule too (D-6) |
| `status`, `startedAt`, `updatedAt`, `completedAt` | | yes | As for TaskAttempt. Added in schema version 2 |

### Autosave

The runner (`runStep`, `src/skills/runner.js`) saves a step's record when the step starts, after every item response and on completion, in that order. A reload therefore loses nothing that was answered; the step resumes at the first item without a response. Leaving a step (the exit button, a link, or another route) pauses its timer and saves the timer state. Closing the tab while a timed task runs does not pause the timer: the time limit keeps running, as it would on paper.

### Cross-field rules

These rules are enforced by `validate()` but cannot be expressed in `docs/data-schema.json`:

1. `participant.languageBackground` may be present only if `participant.consent.languageBackground` is true.
2. A practice sitting has `formId` `"practice"`; an assessment sitting has `formId` `"A"` or `"B"`.
3. `sitting.completedAt`, if set, is not before `sitting.startedAt`.
4. A record whose `schemaVersion` is not the current version is rejected until it has been migrated.
5. A practice sitting has `windowId` and `programme` null; an assessment sitting has a `windowId`.
6. A sitting with `programme` has `windowId` `"programme:<code>"`, `programme.window` equal to the last digit of the code, and `programme.skillOrder[programme.position]` equal to `skillId`. A sitting without `programme` has `windowId` `"self"` or null.
7. On task attempts and self-reports: `status` `"complete"` needs `completedAt`; `"in-progress"` needs `completedAt`, `score` (and `rawScore`) null; `timerSnapshot` only while in progress; `updatedAt` and `completedAt` not before `startedAt`.
8. `consent.toolUse` is `true`.

## Identifiers

`src/core/ids.js`. All identifiers come from `crypto.getRandomValues`; none is derived from any personal data.

- **Participant ID** `P-XXXX-XXXXC`. Crockford base 32 (digits and upper-case letters without I, L, O and U), so a student can copy it by hand. Input is normalised: case is ignored, spaces and hyphens are dropped, `O` is read as `0`, and `I` and `L` as `1`. The check character is a weighted sum (odd weights 1, 3, 5, ... 15) modulo 32: it detects every single-character substitution, and every swap of two adjacent body characters except where their values differ by exactly 16.
- **Record IDs** `S-`, `A-`, `R-` followed by 16 random characters. Not meant to be typed.

**Keeping the code between sittings (decided in S5).** The student keeps it. The first-run flow shows the code with a "save this code" prompt (copy button, advice to write it down or store it in notes or a password manager) and will not continue until the student ticks "I have saved my code". The code is shown again in Settings. On a new device or browser, the student chooses "I already have a code" on the welcome screen and types it; the check character catches mistyping. Records stored in another browser are not copied: the coach matches files by code. The tool cannot recover a lost code.

## Storage

`src/core/store.js`. Every adapter implements the same Promise-based interface, so that a server or LMS adapter can replace local storage later without changing the rest of the tool:

| Method | Returns | Notes |
|---|---|---|
| `load(type, id)` | record or null | |
| `save(type, record)` | record | Validates first; an invalid record is refused with a `TypeError` |
| `list(type)` | records, sorted by key | |
| `remove(type, id)` | boolean | |
| `clear()` | number of records removed | Removes every record in the current namespace (Settings, reset all data). Keys outside it are untouched |
| `exportAll()` | export bundle | See [Export formats](#export-formats) |
| `importAll(bundle, { mode })` | `{ imported, rejected, migrations }` | Migrates, validates every record, then writes the valid ones. `mode` is `merge` (default) or `replace` |

Properties: `persistent` (false when data is held only in memory) and `notice` (the text to show when it is false). `onStatusChange(callback)` reports a switch to memory.

**LocalStorageAdapter.** Keys are `skills5c:v<schemaVersion>:<type>:<id>`, for example `skills5c:v2:sitting:S-0123456789ABCDEF`. Values are the record as JSON. Every access is wrapped in `try/catch`. If storage is unavailable at start-up (blocked, private mode, disabled), or a write fails later (quota), the adapter copies what it can read into memory, switches to memory, keeps working, and sets the notice: "Your browser is not letting this tool save data, so your progress will not be saved. If you close or reload this page, your answers will be lost." `mountStorageNotice(adapter, element)` shows it in a `role="status"` element. A corrupt entry is read as missing. Keys outside the `skills5c:` namespace are never touched.

**MemoryAdapter.** For tests. Same interface, nothing persists, no notice.

## Migrations

`src/core/migrate.js`. Data moves between schema versions as a bundle `{ schemaVersion, records: { <type>: [...] } }`, the shape `exportAll()` produces. Each migration advances exactly one version, never mutates its input and never drops raw responses. `migrate(bundle)` applies the chain up to the current version; it refuses data from a newer build and reports a gap in the chain.

Two paths use it:

- `importAll()` migrates an imported file before validating it.
- On start-up, `LocalStorageAdapter` calls `migrateStoredNamespaces()`, which reads each older namespace (`skills5c:v<N>:` with N below the current version), migrates it, writes it to the current namespace, and only then removes the old keys. If a migration fails, the old data is left untouched.

To add a version, follow the steps at the top of `src/core/migrate.js`.

| From | To | Change | Session |
|---|---|---|---|
| (none) | 1 | First schema | S3 |
| 1 | 2 | Adds `consent.toolUse`, `participant.settings` (optional), `sitting.skillId`, `windowId` and `programme`, and `status`, `startedAt`, `updatedAt`, `completedAt` and `timerSnapshot` (optional) on task attempts and self-reports. Defaults: `toolUse` true; `skillId` from the sitting's records, else `"_unknown"`; `windowId` `"self"` for assessment, null for practice; `programme` null; attempts `"complete"`, with all three times set to the first response's `shownAt` (else the sitting's `startedAt`, else the Unix epoch). Version 1 data could be made only by the S3 developer harness | S5 |

## Export formats

The JSON export bundle, as produced by `exportAll()`:

```json
{
  "format": "skills5c-export",
  "schemaVersion": 2,
  "appVersion": "0.3.0",
  "exportedAt": "2026-11-26T09:00:00.000Z",
  "records": {
    "participant": [],
    "sitting": [],
    "taskAttempt": [],
    "selfReport": []
  }
}
```

The student-facing export (download button, CSV for the cohort view) is written in Session 12. The Settings page already has Export and Import buttons, wired to the stubs in `src/app/transfer.js`, which S12 replaces.

## Import

`importAll()` accepts only `format: "skills5c-export"`, migrates, validates every record and writes only valid ones, returning the rejected records with their errors. The student-facing import flow is written in Session 12.
