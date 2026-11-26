# Audit: 5C Skills Assessment (November 2026)

| File | Contents |
|---|---|
| [AUDIT-REPORT.md](AUDIT-REPORT.md) | Agreed parameters, method, findings by parameter with severity and line references, premise challenges, target architecture, recommended measures, validation roadmap, open decisions |
| [BUILD-PLAN.md](BUILD-PLAN.md) | 16 Claude Code sessions (S0–S15) with copy-paste prompts, acceptance criteria, gates and dependency map |
| [evidence/](evidence/) | Scripts that reproduce every quantitative finding, plus their recorded output (`results.txt`) |

## Reproducing the evidence

From the repository root:

```bash
node audit/evidence/attacks.mjs skills-assessment-hult.html
```

```bash
node audit/evidence/cons.mjs skills-assessment-hult.html
```

```bash
node audit/evidence/browser.cjs
```

The first two need only Node. The third needs Playwright and Chromium. If Session 0 moves the legacy file to `legacy/`, update the path arguments.

## Verdict in one paragraph

The prototype is not fit for programme evaluation, and several of its scores can mislead students:

- **Message Editing:** keyword stuffing beats careful rewriting (86 against 44).
- **Creativity:** gibberish earns maximum originality.
- **Public Goods Game:** the collaboration task has no other players and rewards giving everything.
- **Wason task:** a defect skips its feedback.
- **Self-report:** a meaningless "consistency" statistic flags 62.5% of all possible answer patterns.

Progress over time cannot be measured: nothing persists, there are no parallel forms, and scoring is not versioned. The design shares almost none of the slides/third-places system. The build plan starts with foundations and signed-off construct definitions, then rebuilds the platform, then the measures, then results, export and cohort analysis. It ends with a pilot protocol, because reliability and change detection cannot be established by code alone.
