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

Current values: `schemaVersion` 1, `appVersion` 0.2.0, `scoringVersion` 0.2.0.

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

`consent`:

| Field | Type | Notes |
|---|---|---|
| `noticeVersion` | string | Version of the privacy and purpose notice the student saw. The notice is written in S5; until then the developer harness records `dev-harness` |
| `givenAt` | date-time | |
| `programmeEvaluation` | boolean | Agreed that results may be used, pseudonymously, for cohort-level programme evaluation (audit F-2) |
| `languageBackground` | boolean | Agreed to record language background, for differential item functioning checks in the pilot |

`languageBackground`:

| Field | Type | Notes |
|---|---|---|
| `englishFirstLanguage` | `"yes"`, `"no"` or `"prefer-not-to-say"` | Draft. The categories Hult needs for the pilot analysis are not decided (S5, S15). A change is a schema change |

### Sitting

One occasion on which a participant works through tasks, in one mode, with one form.

| Field | Type | Required | Notes |
|---|---|---|---|
| `type` | `"sitting"` | yes | |
| `schemaVersion` | integer | yes | |
| `id` | record ID, prefix `S` | yes | |
| `participantId` | participant ID | yes | |
| `mode` | `"practice"` or `"assessment"` | yes | Practice: practice pool, feedback allowed, not used as evidence. Assessment: fixed form, no feedback until the skill is complete |
| `formId` | `"A"`, `"B"` or `"practice"` | yes | `"practice"` in practice mode; `"A"` or `"B"` in assessment mode |
| `seed` | integer, 0 to 2^32 - 1 | yes | Seeds every random choice in the sitting (see `src/core/rng.js`) |
| `appVersion` | semver | yes | |
| `scoringVersion` | semver | yes | |
| `startedAt` | date-time | yes | |
| `completedAt` | date-time or null | yes | Null until the sitting is complete |

Form assignment (`assignForm` in `src/skills/runner.js`): a participant's first assessment sitting gets form A or B by the parity of its seed, which splits a cohort roughly in half; their next assessment sitting gets the other form (audit D-2). S5 may replace seed parity with an explicit counterbalancing list.

Per-task seeds are derived as `seedFromString("<seed>:<skillId>:<taskId>")`, so adding or reordering tasks does not change the random choices within another task.

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
| `timing` | timing log | no | Present for timed tasks |

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

### Cross-field rules

These rules are enforced by `validate()` but cannot be expressed in `docs/data-schema.json`:

1. `participant.languageBackground` may be present only if `participant.consent.languageBackground` is true.
2. A practice sitting has `formId` `"practice"`; an assessment sitting has `formId` `"A"` or `"B"`.
3. `sitting.completedAt`, if set, is not before `sitting.startedAt`.
4. A record whose `schemaVersion` is not the current version is rejected until it has been migrated.

## Identifiers

`src/core/ids.js`. All identifiers come from `crypto.getRandomValues`; none is derived from any personal data.

- **Participant ID** `P-XXXX-XXXXC`. Crockford base 32 (digits and upper-case letters without I, L, O and U), so a student can copy it by hand. Input is normalised: case is ignored, spaces and hyphens are dropped, `O` is read as `0`, and `I` and `L` as `1`. The check character is a weighted sum (odd weights 1, 3, 5, ... 15) modulo 32: it detects every single-character substitution, and every swap of two adjacent body characters except where their values differ by exactly 16.
- **Record IDs** `S-`, `A-`, `R-` followed by 16 random characters. Not meant to be typed.

How a student keeps their code between sittings a year apart is decided in S5.

## Storage

`src/core/store.js`. Every adapter implements the same Promise-based interface, so that a server or LMS adapter can replace local storage later without changing the rest of the tool:

| Method | Returns | Notes |
|---|---|---|
| `load(type, id)` | record or null | |
| `save(type, record)` | record | Validates first; an invalid record is refused with a `TypeError` |
| `list(type)` | records, sorted by key | |
| `remove(type, id)` | boolean | |
| `exportAll()` | export bundle | See [Export formats](#export-formats) |
| `importAll(bundle, { mode })` | `{ imported, rejected, migrations }` | Migrates, validates every record, then writes the valid ones. `mode` is `merge` (default) or `replace` |

Properties: `persistent` (false when data is held only in memory) and `notice` (the text to show when it is false). `onStatusChange(callback)` reports a switch to memory.

**LocalStorageAdapter.** Keys are `skills5c:v<schemaVersion>:<type>:<id>`, for example `skills5c:v1:sitting:S-0123456789ABCDEF`. Values are the record as JSON. Every access is wrapped in `try/catch`. If storage is unavailable at start-up (blocked, private mode, disabled), or a write fails later (quota), the adapter copies what it can read into memory, switches to memory, keeps working, and sets the notice: "Your browser is not letting this tool save data, so your progress will not be saved. If you close or reload this page, your answers will be lost." `mountStorageNotice(adapter, element)` shows it in a `role="status"` element. A corrupt entry is read as missing. Keys outside the `skills5c:` namespace are never touched.

**MemoryAdapter.** For tests. Same interface, nothing persists, no notice.

## Migrations

`src/core/migrate.js`. Data moves between schema versions as a bundle `{ schemaVersion, records: { <type>: [...] } }`, the shape `exportAll()` produces. Each migration advances exactly one version, never mutates its input and never drops raw responses. `migrate(bundle)` applies the chain up to the current version; it refuses data from a newer build and reports a gap in the chain.

Two paths use it:

- `importAll()` migrates an imported file before validating it.
- On start-up, `LocalStorageAdapter` calls `migrateStoredNamespaces()`, which reads each older namespace (`skills5c:v<N>:` with N below the current version), migrates it, writes it to the current namespace, and only then removes the old keys. If a migration fails, the old data is left untouched.

Schema version 1 is the first, so the real chain is empty. To add version 2, follow the steps at the top of `src/core/migrate.js`.

| From | To | Change | Session |
|---|---|---|---|
| (none) | 1 | First schema | S3 |

## Export formats

The JSON export bundle, as produced by `exportAll()`:

```json
{
  "format": "skills5c-export",
  "schemaVersion": 1,
  "appVersion": "0.2.0",
  "exportedAt": "2026-11-26T09:00:00.000Z",
  "records": {
    "participant": [],
    "sitting": [],
    "taskAttempt": [],
    "selfReport": []
  }
}
```

The student-facing export (download button, CSV for the cohort view) is written in Session 12.

## Import

`importAll()` accepts only `format: "skills5c-export"`, migrates, validates every record and writes only valid ones, returning the rejected records with their errors. The student-facing import flow is written in Session 12.
