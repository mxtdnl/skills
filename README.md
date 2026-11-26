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
- Repository rules, conventions and the visual system are in [`CLAUDE.md`](CLAUDE.md).

## Running locally

The tool must be served over HTTP; opening the files directly from disk (`file://`) is not supported, because the rebuilt tool uses ES modules. From the repository root:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. The landing page links to the legacy prototype.

## Running the tests

Requires Node 18 or later. There are no dependencies to install.

```sh
npm test
```

```sh
npm run lint
```

- `npm test` runs the characterisation tests in `tests/legacy-scoring.test.mjs`. They assert the prototype's current scores, including the defective ones recorded by the audit, so that any later change to scoring is deliberate.
- `npm run lint` runs static checks (charset, no network URLs, no curly quotes in scripts, no rounded corners) on every `.html` and `.css` file outside `audit/` and `legacy/`.

See the Testing section of `CLAUDE.md` for details, and `audit/README.md` to reproduce the audit evidence.

## Documentation

| File | Contents |
|---|---|
| [`docs/CONSTRUCTS.md`](docs/CONSTRUCTS.md) | Draft definitions and facets for each skill |
| [`docs/SCORING.md`](docs/SCORING.md) | Scoring specification (currently the legacy formulas) |
| [`docs/ITEM-BANK.md`](docs/ITEM-BANK.md) | Item bank conventions and item table |
| [`docs/DATA-SCHEMA.md`](docs/DATA-SCHEMA.md) | Data model and export formats |
| [`docs/VALIDATION-PLAN.md`](docs/VALIDATION-PLAN.md) | Pilot and validation protocol |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Pointer to the visual system in `CLAUDE.md` |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Changes by session and scoring version |

## Licence

`PLACEHOLDER: licence to be chosen by the owner` (see [`LICENSE`](LICENSE)).
