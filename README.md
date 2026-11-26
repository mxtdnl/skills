# 5C Skills Assessment

A browser-based tool for Hult's five core skills: Collaboration, Curiosity, Critical Thinking, Creativity and Communication. It is intended for three uses:

- formative self-reflection by undergraduate students;
- input to coaching conversations;
- programme evaluation: cohort-level evidence of change between the start and end of the programme.

It is static and client-side. Nothing is sent to a server; data stays in the student's browser unless they export a file.

## Status

**Legacy prototype; rebuild in progress.**

- The only working version is the original prototype, `legacy/skills-assessment-hult.html`. An audit found that it is not fit for programme evaluation and that several of its scores can mislead students. Do not use its scores to judge any student or programme.
- The audit, the rebuild plan and the reproducible evidence are in [`audit/`](audit/): start with [`audit/AUDIT-REPORT.md`](audit/AUDIT-REPORT.md) and [`audit/BUILD-PLAN.md`](audit/BUILD-PLAN.md).
- Draft skill definitions, awaiting sign-off, are in [`docs/CONSTRUCTS.md`](docs/CONSTRUCTS.md).
- The platform skeleton for the rebuild (storage, data model, timers, routing, skill modules) is in `src/` and is exercised by a developer harness, `dev/platform.html`. It contains no skill measures yet. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
- Repository rules, conventions and the visual system are in [`CLAUDE.md`](CLAUDE.md).

## Running locally

The tool must be served over HTTP. Opening the files directly from disk (`file://`) is not supported. The rebuilt tool is written as ES modules (`<script type="module">` and `import`), and browsers load module scripts under CORS rules; a page opened from `file://` has no proper origin, so Chromium-based browsers (Chrome, Edge) refuse to load its modules and the page stays blank. Other browsers are not consistent either, so `file://` is not supported anywhere. Serving the files over HTTP gives them an origin. This was decided on 2026-11-26 in favour of testable modules (see the decisions log in `audit/BUILD-PLAN.md`). The legacy prototype is a single classic-script file and still opens from disk. From the repository root:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. The landing page links to the legacy prototype. The developer harness for the platform skeleton is at <http://localhost:8000/dev/platform.html>.

## Running the tests

Requires Node 18 or later. There are no dependencies to install.

```sh
npm test
```

```sh
npm run lint
```

- `npm test` runs every `tests/*.test.mjs` file: unit tests for the platform core (random numbers, IDs, data model, storage, migrations, timers, routing, skill registry) and the characterisation tests in `tests/legacy-scoring.test.mjs`, which assert the prototype's current scores, including the defective ones recorded by the audit, so that any later change to scoring is deliberate.
- `npm run lint` runs static checks (charset, no network URLs or network APIs, no curly quotes in scripts, no `innerHTML`, no rounded corners) on every `.html`, `.css` and `.js` file outside `audit/` and `legacy/`.
- `npm run schema` regenerates `docs/data-schema.json` from `src/core/schema.js`; a test fails if it is out of date.

See the Testing section of `CLAUDE.md` for details, and `audit/README.md` to reproduce the audit evidence.

## Documentation

| File | Contents |
|---|---|
| [`docs/CONSTRUCTS.md`](docs/CONSTRUCTS.md) | Draft definitions and facets for each skill |
| [`docs/REVIEW-CHECKLIST.md`](docs/REVIEW-CHECKLIST.md) | Checklist for Hult reviewers approving each skill |
| [`docs/SCORING.md`](docs/SCORING.md) | Scoring specification (currently the legacy formulas) |
| [`docs/ITEM-BANK.md`](docs/ITEM-BANK.md) | Item bank conventions and item table |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Module layout, skill module contract, content convention |
| [`docs/DATA-SCHEMA.md`](docs/DATA-SCHEMA.md) | Data model, storage, migrations and export formats |
| [`docs/data-schema.json`](docs/data-schema.json) | The data model as JSON Schema (generated) |
| [`docs/VALIDATION-PLAN.md`](docs/VALIDATION-PLAN.md) | Pilot and validation protocol |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Pointer to the visual system in `CLAUDE.md` |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Changes by session and scoring version |

## Licence

`PLACEHOLDER: licence to be chosen by the owner` (see [`LICENSE`](LICENSE)).
