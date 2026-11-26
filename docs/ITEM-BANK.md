# Item bank

**Purpose.** Records every item used by the tool: what it measures, which pool and form it belongs to, where it came from, and whether it has been reviewed. It is the provenance record required by audit finding M-1 and the global rule that item content is draft until reviewed by Hult staff.

No items have been written for the rebuilt tool yet. The legacy prototype's items are not part of this bank and must not be ported without review (see `audit/AUDIT-REPORT.md` sections A and B).

## Conventions

Set in Session 3; applied from Session 6. The full contract is in `docs/ARCHITECTURE.md` (Content convention).

- **Location.** `content/<skill>/<task>.js`, one ES module per task, exporting three arrays: `formA`, `formB` and `practice`.
- **Item fields.** Every item has `id` (unique across the repository; letters, digits, `.`, `_`, `-`) and `status` (`"draft"` or `"reviewed"`). Other fields are defined by the task and documented in the table below when items are added. Text is plain text, rendered with `textContent`, never as HTML.
- **ID pattern.** `<SKILL>-<TASK>-<POOL><NN>`, for example `CT-T1-A01`, `CT-T1-B01`, `CT-T1-P01`, where the pool letter is `A`, `B` or `P` (practice). The stub skill uses `EX-PICK-A01` and so on.
- **Separation.** No item ID appears in more than one pool. `validateContent()` in `src/skills/registry.js` enforces this, and the runner refuses to run a task whose content fails it.
- **Stability.** An item's ID never changes and is never reused, because stored responses refer to it. A materially changed item gets a new ID.
- **Example content.** `content/_example/pick.js` belongs to the developer stub skill. It is not part of this bank and is never shown to students.

## Pools and forms

To be written from Session 6. Practice items and assessment items are separate pools and never mix.

## Item status and review

To be written from Session 6.

## Sources and licences

To be written from Session 6.

## Item table

Empty. Items are added by Sessions 6 to 10.
