# Design

**Purpose.** Points to the visual system for this tool. The specification itself is not duplicated here, so that there is one source of truth.

## Where the design system is specified

The visual system is specified in the **Visual style** section of [`../CLAUDE.md`](../CLAUDE.md): tokens (light theme, eight accents, ink tones, feedback colours), the 5C accent mapping, accent usage, typography, geometry, decorative geometry, components, motion and naming conventions.

It follows the reference system of the `mxtdnl/slides` and `mxtdnl/third-places` repositories. Where the two disagree, `slides/CLAUDE.md` wins, except for the 5C accent mapping, which is specific to this repository.

## Implementation

From Session 4, tokens live in `styles/tokens.css` and components in `styles/components.css`, with a living specimen page in `styleguide.html`. None of these exists yet.

## Open decisions

- Hult brand assets (official SVG logo, any mandatory colour) and whether Hult's aubergine replaces `--accent-1`: see `audit/AUDIT-REPORT.md` section 7, item 2.
