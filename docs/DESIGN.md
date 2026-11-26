# Design

**Purpose.** Points to the visual system for this tool. The specification itself is not duplicated here, so that there is one source of truth.

## Where the design system is specified

The visual system is specified in the **Visual style** section of [`../CLAUDE.md`](../CLAUDE.md): tokens (light theme, eight accents, ink tones, feedback colours), the 5C accent mapping, accent usage, typography, geometry, decorative geometry, components, motion and naming conventions.

It follows the reference system of the `mxtdnl/slides` and `mxtdnl/third-places` repositories. Where the two disagree, `slides/CLAUDE.md` wins, except for the 5C accent mapping, which is specific to this repository.

## Implementation

Since Session 4:

- `styles/tokens.css`: tokens. Load first.
- `styles/base.css`: reset, type scale, focus, reduced motion, print.
- `styles/components.css`: components. Each reads its accent from the context set by `data-skill="<id>"` or `data-accent="1".."8"` on itself or an ancestor (`--accent`, `--accent-ink`, `--accent-on`, `--accent-tint`).
- `styleguide.html`: the living specimen. Review visual changes there.
- `npm run lint` fails if a reference token drifts from `slides/CLAUDE.md` or a pair in `CONTRAST_PAIRS` (`tests/lint.mjs`) falls below AA.

Contrast rules encoded in the components:

- Accent-coloured text (eyebrows, labels) sits on `--bg-card` or a tint. Eyebrows on `--bg` are `--text`.
- Burnt orange (`--accent-3`, Communication) and orange (`--accent-7`) fills carry large text only; `.btn-accent` in those contexts is outlined. Banners set all their text large for this reason.
- States never depend on an accent's contrast alone: the checked Likert mark is solid `--text`, pressed choice cards add a thicker border and a visible "Selected" label, results bars mark the estimate and band edges in `--text`, and the timer always prints the time.
- Likert radios are square (zero-radius rule); the group is a `fieldset` with a `legend` and every point has a visible label.

## Open decisions

- Communication text colour: burnt orange (`--accent-3`) is 4.32:1 on `--bg-card`, below AA for body text. S4 uses the reference orange ink `--accent-7-ink` (6.00:1) for Communication text. Alternatives: a new `--accent-3-ink` derived in the reference, or Communication labels in `--text` with a burnt orange pip.

- Hult brand assets (official SVG logo, any mandatory colour) and whether Hult's aubergine replaces `--accent-1`: see `audit/AUDIT-REPORT.md` section 7, item 2.
