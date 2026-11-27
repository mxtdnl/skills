# Item bank

**Purpose.** Records every item used by the tool: what it measures, which pool and form it belongs to, where it came from, and whether it has been reviewed. It is the provenance record required by audit finding M-1 and the global rule that item content is draft until reviewed by Hult staff.

Session 6 added the self-report items for all five skills (all draft). Session 7 added the items of the four critical thinking tasks (all draft). Session 8 added the creativity task items, their category lists and their provisional frequency tables (all draft). Session 9 added the communication task items, the rewrite checklist and its example rewrites (all draft). The legacy prototype's items are not part of this bank and must not be ported without review (see `audit/AUDIT-REPORT.md` sections A and B).

## Conventions

Set in Session 3; applied from Session 6. The full contract is in `docs/ARCHITECTURE.md` (Content convention).

- **Location.** `content/<skill>/<task>.js`, one ES module per task, exporting three arrays: `formA`, `formB` and `practice`.
- **Item fields.** Every item has `id` (unique across the repository; letters, digits, `.`, `_`, `-`) and `status` (`"draft"` or `"reviewed"`). Other fields are defined by the task and documented in the table below when items are added. Text is plain text, rendered with `textContent`, never as HTML.
- **ID pattern.** `<SKILL>-<TASK>-<POOL><NN>`, for example `CT-T1-A01`, `CT-T1-B01`, `CT-T1-P01`, where the pool letter is `A`, `B` or `P` (practice). The stub skill uses `EX-PICK-A01` and so on. Self-reports use the task code `SR` and the pool letter `R` for retrospective items (S6), for example `CO-SR-A01` and `CO-SR-R01`. Skill codes: `CO` Collaboration, `CU` Curiosity, `CT` Critical thinking, `CR` Creativity, `CM` Communication.
- **Separation.** No item ID appears in more than one pool. `validateContent()` in `src/skills/registry.js` enforces this, and the runner refuses to run a task whose content fails it.
- **Stability.** An item's ID never changes and is never reused, because stored responses refer to it. A materially changed item gets a new ID.
- **Example content.** `content/_example/pick.js` belongs to the developer stub skill. It is not part of this bank and is never shown to students.

## Pools and forms

Practice items and assessment items are separate pools and never mix.

- **Form A and form B** are parallel: the same facets, with the same number of items per facet, and no shared item. A participant takes one form at the start of the programme and the other at the end, counterbalanced (`docs/DATA-SCHEMA.md`, form assignment).
- **Practice** pools are written with each task (S7 to S10). A self-report has no practice pool.
- **Retrospective** (self-reports only, S6): one item per facet, asked only in an end-of-programme sitting, after the form's items. The same retrospective items are used whichever form the participant takes at the end.

## Self-report item fields

Defined in S6 (`content/<skill>/self-report.js`):

| Field | Meaning |
|---|---|
| `facet` | Facet code from `docs/CONSTRUCTS.md` |
| `keying` | `+`: agreeing means more of the facet. `-`: agreeing means less; reversed in scoring (`docs/SCORING.md`, Self-report) |
| `text` | The statement, plain text, rated on the five-point agreement scale |
| `source` | `{ type: "new" }`, or `{ type: "ipip", code, scale, key, original }` for an IPIP item |
| `retrospective` | `true` on retrospective items only |

Writing rules applied (and checked where possible in `tests/self-report.test.mjs`): plain UK English for readers of English as a second language; one idea per statement; one sentence; no idioms; no double negatives (at most one negation per statement); about half the items on each form negatively keyed, with both keyings in every facet; no forced-choice items and no faking ("I have never...") items (audit A-8, A-9).

## Critical thinking task item fields

Defined in S7 (`content/critical/ct-t1.js` to `ct-t4.js`; scoring in `docs/SCORING.md`, Critical thinking tasks). Every file's header comment repeats its fields.

| Task | Field | Meaning |
|---|---|---|
| CT-T1 | `kind` | `abstract` or `deontic`; reported as separate sub-scores |
| CT-T1 | `negation` | `{ antecedent, consequent }`: which parts of the rule "if P then Q" are negated. Each form has each of the four patterns once per kind |
| CT-T1 | `setting`, `rule` | What the cards show, and the rule to test |
| CT-T1 | `cards` | Four `{ face, shows }`; `shows` is `P`, `notP`, `Q` or `notQ` (which case the visible side is) |
| CT-T1 | `key` | Indices of the cards to turn; must equal the key derived from `negation` and `cards` (checked by `tests/critical.test.mjs`) |
| CT-T1 | `explanation` | Shown in practice mode, after a card-by-card explanation generated from `shows` |
| CT-T2 | `type` | `flaw`, `assumption`, `evidence`, `weaken`, `fairest` or `objection` |
| CT-T2 | `facets` | `["CT2"]`, or `["CT2", "CT4"]` for the evidence items (scored as CT2 only) |
| CT-T2 | `scenario`, `question`, `options`, `key` | Scenario of at most 80 words; four options; the index of the single defensible answer |
| CT-T2 | `rationale` | Why the key is right and the other options are not; shown in practice mode |
| CT-T3 | `kind`, `difficulty` | `comparison` or `estimation`; intended difficulty `easier` or `harder` (author's judgement, to be replaced by pilot facility values) |
| CT-T3 | `prompt`, `options`, `key` | Two options; the index of the correct one |
| CT-T3 | `facts` | The figures that decide the answer, as given by the sources |
| CT-T3 | `source` | `{ urls, checked, method }`: the pages that support the answer, the date checked and how |
| CT-T3 | `revision` | `null`, or `{ evidence }`: true evidence, from the same sources, shown after the first answer |
| CT-T4 | `type` | `base-rate`, `sample-size`, `proportion` or `chance` |
| CT-T4 | `scenario`, `question`, `options`, `key`, `rationale` | As CT-T2; the rationale is a worked solution |
| CT-T4 | `check` | The numbers the key follows from, recomputed by `tests/critical.test.mjs` |

Writing rules applied (checked where possible in `tests/critical.test.mjs`): plain UK English for readers of English as a second language; straight quotes; culturally neutral content (speeds in km/h, no ages, no alcohol, no country-specific law); forms A and B parallel in item types, kinds and negation patterns, in the same order; keys spread across option positions; option and card order shuffled on screen.

## Creativity task item fields

Defined in S8 (`content/creativity/cr-t1.js`, `cr-t2.js`; frequency tables in `aut-norms.js`, `problem-norms.js`; scoring in `docs/SCORING.md`, Creativity tasks). One item per form; the practice pools hold other objects and situations.

| Field | Meaning |
|---|---|
| `kind` | `uses` (CR-T1) or `problems` (CR-T2) |
| `object` / `situation` | The object ("a cardboard box"), or the situation completing "What problems might a student face when ...?" |
| `objectWords` | Words that only name the object or restate the situation: they count towards the two-word minimum but never make an idea on their own |
| `categories` | The taxonomy: `{ id, label, keywords, hint? }`. Written for this tool, not taken from Guilford (1967) or any scoring guide. No "Other" category. `hint` (practice items only) suggests the category in practice feedback |
| `norms` | The item's frequency table (attached from the norms file by item ID) |

Frequency-table entry fields: `id` (stable), `category`, `freq` (`common`, `occasional` or `rare`: **provisional, author-estimated, to be replaced with pilot norms**), `match` (word groups; the idea must contain one alternative of every group, as whole normalised words), `example` (an idea that matches the entry; `tests/creativity.test.mjs` checks that every example is read as valid and matched to its own entry and category).

Construction rules (checked in `tests/creativity.test.mjs`): forms A and B have the same number of categories (12) and tables whose sizes and band counts differ by at most 3; no alternative repeats across the groups of one entry; every category has at least 5 keywords. Forms A and B were chosen to be similar in familiarity (two everyday household containers; two common situations of student life). This is the author's judgement, to be checked in the pilot (R-10).

## Communication task item fields

Defined in S9 (`content/communication/cm-t1.js`, `cm-t2.js`, `cm-t3.js`; scoring in `docs/SCORING.md`, Communication tasks). Every item has `genre` (`business` or `academic`).

| Task | Field | Meaning |
|---|---|---|
| CM-T1 | `dimension` | The one clarity dimension on which the two versions differ: `ambiguity`, `buried`, `structure` (CM1), `jargon`, `register` (CM2), `reasoning` (CM3) |
| CM-T1 | `facet` | Derived from the dimension |
| CM-T1 | `context` | Who is writing to whom; the reader decides what counts as clear |
| CM-T1 | `versions`, `key` | The two versions, shown in this order as Version 1 and Version 2; `key` is the index of the clearer |
| CM-T1 | `reasons`, `reasonKey` | Four reason codes (`REASONS`), one of which is the item's dimension; `"shorter"` is a distractor only, used only where the clearer version is the longer |
| CM-T1 | `rationale` | Why the key is right and the other reasons do not apply; shown in practice |
| CM-T2 | `problem`, `facet` | The kind of problem (`ambiguity`, `buried`, `jargon`, `register`, `reasoning`) and its facet |
| CM-T2 | `context`, `sentences`, `key` | Who is writing to whom; the five sentences of the passage, in order; the index of the sentence with the problem (for a buried main point, the sentence that holds the main point) |
| CM-T2 | `rationale` | Why that sentence and that problem, and why the other sentences are fine; shown in practice |
| CM-T3 | `reader`, `goal`, `passage` | Who will read the rewrite, what it must achieve, and the text to rewrite (at most 80 words, with all five checklist problems) |
| CM-T3 | `model`, `notes` | One example rewrite (not a key) and one note per checklist point; shown in practice, available to coaches |

The checklist itself (`RUBRIC`: `mainPoint`, `words`, `reasons`, `references`, `register`) and its answers (`SELF_CHECK`: yes, partly, not yet) are exported by `cm-t3.js`.

Writing rules applied (checked where possible in `tests/communication.test.mjs`): plain UK English for readers of English as a second language; straight quotes; each CM-T1 pair differs on one dimension only, so the other three reasons are false of it; CM-T2 passages are unmarked and have exactly one problem sentence; forms A and B parallel in dimension or problem, facet and genre, in the same order; business and academic passages in equal numbers on each form of CM-T1 and CM-T2 (one CM-T3 passage per form cannot cover both; D-27); keys spread across positions. Names in the passages are chosen from several languages and are fictional.

## Item status and review

Every item is `status: "draft"` until a Hult subject expert reviews it; only a reviewer changes it to `"reviewed"`. A materially changed item gets a new ID. Review should check, for each item: that it matches its facet definition in `docs/CONSTRUCTS.md` and nothing outside it; that its keying is right; that it reads clearly for a student writing in a second language; and that it fits the cultural-neutrality checks in `docs/REVIEW-CHECKLIST.md`. Self-report items are also candidates for cognitive interviews in the pilot (`docs/VALIDATION-PLAN.md`).

For task items, review should also check that the key is the single defensible answer and that the rationale or explanation shown in practice is correct and clear. For CT-T3, the reviewer opens every source URL and confirms the fact (`docs/OPEN-DECISIONS.md` R-8).

## Sources and licences

- **New items** were written for this tool in S6 against the facet definitions and behaviours in `docs/CONSTRUCTS.md`. They are not adapted from any published or proprietary scale.
- **IPIP items.** The International Personality Item Pool (ipip.ori.org) is in the public domain: its permission page states that permission is granted automatically for any use, commercial or non-commercial. Each IPIP item records its IPIP item code (from the site's alphabetical list of the 3,320 IPIP items), the IPIP scale it is keyed on and the page of that scale's key, and its original wording. The text here adds only the subject "I" and the matching verb form ("Am an original thinker." becomes "I am an original thinker."). Codes, wording and keying were checked against ipip.ori.org on 27 November 2026. General citation, as printed on the site's citation page: Goldberg, L. R., Johnson, J. A., Eber, H. W., Hogan, R., Ashton, M. C., Cloninger, C. R., & Gough, H. C. (2006). The International Personality Item Pool and the future of public-domain personality measures. *Journal of Research in Personality, 40*, 84-96.
- **Critical thinking task items (S7)** were written for this tool. No item is copied or adapted from a published or proprietary test (for example, Watson-Glaser, HCTA or CART). The paradigms are standard and named in the literature: the selection task (Wason, 1968), base-rate and sample-size reasoning and independent chance events (Stanovich, West & Toplak, 2016, review such tasks). The widely circulated versions are avoided: no letter-and-number (vowel / even number) or drinking-age selection item, no Cognitive Reflection Test item, and no taxicab, Linda, hospital or medical-screening problem. Two CT-T4 sample-size items (CT-T4-A03, CT-T4-B03) use the same logic as the well-known hospital problem with different content; a reviewer should decide whether they are too close.
- **CT-T3 facts.** Every answer and every piece of evidence was checked on 27 November 2026 against the pages listed in the item's `source.urls`. The check was made through web searches whose results quoted those pages; the pages could not be opened directly from the build environment (its network policy refused them). A person must open each source and confirm it before the items are used (`docs/OPEN-DECISIONS.md` R-8). Items whose facts could not be confirmed were not written (for example, a comparison of Antarctica with Europe, because no source for Europe's area was found). Every item is decided by a margin larger than the differences between sources. CT-T3-B05 (Nigeria and Brazil, by population) depends on current estimates and must be rechecked before each use.
- **Creativity task items (S8)** were written for this tool. The alternate uses paradigm (Guilford, 1967) and problem-finding prompts are standard and not proprietary; no item, category list or norm table was copied from a published test or scoring guide (for example, the Torrance Tests). The objects of the legacy prototype (brick, paperclip, shoe, newspaper, plastic bottle, rubber band, wooden spoon) are not reused. The frequency bands are the author's estimates, not data.
- **Communication task items (S9)** were written for this tool. No item is copied or adapted from a published test, style guide or the legacy prototype's Message Editing passages, which are not reused. The clarity dimensions follow the facet definitions in `docs/CONSTRUCTS.md`. The example rewrites are the author's; the reason in CM-T3-P02's example is invented for the example and says so on screen.
- **Word list.** `content/creativity/wordlist.js` is generated (`tests/write-wordlist.mjs`) from SCOWL (Spell Checker Oriented Word Lists) by Kevin Atkinson, as packaged in the npm package `wordlist-english` 1.2.1 (MIT): sizes 10, 20 and 35 of the English, British and American lists, lower case a to z only. SCOWL permits use, copying, modification, distribution and sale provided its copyright and permission notice appear in all copies and in supporting documentation; the notice is in the file header and in full in `content/creativity/SCOWL-COPYRIGHT.txt` (R-11).
- **Why few IPIP items.** IPIP scales measure broad traits (openness, intellect, VIA character strengths). Most of the facets here are specific behaviours (for example, CO2 coordination, CM3 explicit reasoning, CT4 base-rate reasoning) with no close IPIP match. IPIP items were used only where an item matches a facet definition directly; three did. Candidates considered and not used, because they match a facet only loosely, include VIA Originality/Creativity V5 ("Am able to come up with new and different ideas.") and V71 ("Like to think of new ways to do things."), and NEO O4 H2021 ("Am interested in many things.").

## Item table

### Self-report items (S6)

Self-report items (S6). 86 form items (43 per form) and 17 retrospective items; 3 from the IPIP, 100 new. All draft.

| ID | Measure | Facet | Pool | Key | Text | Source | Status |
|---|---|---|---|---|---|---|---|
| CO-SR-A01 | CO-SR | CO1 | A | + | In a group, I share information that the others may not have. | New (written for this tool) | draft |
| CO-SR-A02 | CO-SR | CO1 | A | + | Before my group makes a decision, I ask the quieter members for their view. | New (written for this tool) | draft |
| CO-SR-A03 | CO-SR | CO1 | A | - | In group discussions, I talk mainly about things that everyone already knows. | New (written for this tool) | draft |
| CO-SR-A04 | CO-SR | CO2 | A | + | I help my group agree who will do each task. | New (written for this tool) | draft |
| CO-SR-A05 | CO-SR | CO2 | A | - | I wait for other people to organise our group work. | New (written for this tool) | draft |
| CO-SR-A06 | CO-SR | CO2 | A | - | I finish my part of group work after the deadline that the group agreed. | New (written for this tool) | draft |
| CO-SR-A07 | CO-SR | CO3 | A | + | If I disagree with my group's plan, I say so and give my reason. | New (written for this tool) | draft |
| CO-SR-A08 | CO-SR | CO3 | A | - | I keep my concerns about my group's plan to myself. | New (written for this tool) | draft |
| CO-SR-A09 | CO-SR | CO3 | A | + | I give teammates specific feedback about their work. | New (written for this tool) | draft |
| CO-SR-B01 | CO-SR | CO1 | B | + | When I know something useful for a group task, I tell the group without being asked. | New (written for this tool) | draft |
| CO-SR-B02 | CO-SR | CO1 | B | - | I accept the first idea in a group discussion before everyone has spoken. | New (written for this tool) | draft |
| CO-SR-B03 | CO-SR | CO1 | B | - | In group work, I rarely ask other members what they know. | New (written for this tool) | draft |
| CO-SR-B04 | CO-SR | CO2 | B | + | I check our group's progress against the deadlines we agreed. | New (written for this tool) | draft |
| CO-SR-B05 | CO-SR | CO2 | B | + | If I cannot finish my part on time, I warn the group early. | New (written for this tool) | draft |
| CO-SR-B06 | CO-SR | CO2 | B | - | When a teammate's work is weak, I redo it myself without telling them. | New (written for this tool) | draft |
| CO-SR-B07 | CO-SR | CO3 | B | - | After my group makes a decision, I keep arguing against it. | New (written for this tool) | draft |
| CO-SR-B08 | CO-SR | CO3 | B | + | I raise concerns about my group's direction early in a project. | New (written for this tool) | draft |
| CO-SR-B09 | CO-SR | CO3 | B | - | When a teammate's work has a problem, I say nothing to them about it. | New (written for this tool) | draft |
| CO-SR-R01 | CO-SR | CO1 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at sharing information with my group and asking for theirs. | New (written for this tool) | draft |
| CO-SR-R02 | CO-SR | CO2 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at organising group work and doing my share on time. | New (written for this tool) | draft |
| CO-SR-R03 | CO-SR | CO3 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at raising disagreements and giving feedback in a group. | New (written for this tool) | draft |
| CU-SR-A01 | CU-SR | CU1 | A | + | When I notice a gap in what I know, I look for the answer. | New (written for this tool) | draft |
| CU-SR-A02 | CU-SR | CU1 | A | + | When a fact surprises me, I look for the explanation. | New (written for this tool) | draft |
| CU-SR-A03 | CU-SR | CU1 | A | - | I look for information only when a task requires it. | New (written for this tool) | draft |
| CU-SR-A04 | CU-SR | CU2 | A | + | When I learn about a new situation, I ask why it happens. | New (written for this tool) | draft |
| CU-SR-A05 | CU-SR | CU2 | A | - | Most of my questions are about facts, such as dates or names, rather than causes. | New (written for this tool) | draft |
| CU-SR-A06 | CU-SR | CU2 | A | - | I accept explanations without asking further questions. | New (written for this tool) | draft |
| CU-SR-A07 | CU-SR | CU3 | A | + | I choose to learn about subjects outside my field of study. | New (written for this tool) | draft |
| CU-SR-A08 | CU-SR | CU3 | A | - | I prefer to stick with things that I know. | IPIP X30: IPIP scale for NEO-PI-R facet O4 Adventurousness (key: ipip.ori.org/newNEOFacetsKey.htm). Original: "Prefer to stick with things that I know." | draft |
| CU-SR-A09 | CU-SR | CU3 | A | + | I try to understand views that are different from my own. | New (written for this tool) | draft |
| CU-SR-B01 | CU-SR | CU1 | B | + | I use my free time to find out about things I know little about. | New (written for this tool) | draft |
| CU-SR-B02 | CU-SR | CU1 | B | - | When something puzzles me, I move on without looking into it. | New (written for this tool) | draft |
| CU-SR-B03 | CU-SR | CU1 | B | - | I stop looking for information as soon as I have enough for the task. | New (written for this tool) | draft |
| CU-SR-B04 | CU-SR | CU2 | B | + | I ask "what if" questions about new ideas. | New (written for this tool) | draft |
| CU-SR-B05 | CU-SR | CU2 | B | + | I ask questions that could change how I understand a topic. | New (written for this tool) | draft |
| CU-SR-B06 | CU-SR | CU2 | B | - | I rarely ask how or why something happens. | New (written for this tool) | draft |
| CU-SR-B07 | CU-SR | CU3 | B | - | I prefer to stay with subjects that I already know well. | New (written for this tool) | draft |
| CU-SR-B08 | CU-SR | CU3 | B | + | I love to hear about other countries and cultures. | IPIP V330: IPIP scale for VIA-IS Curiosity [Cur] (key: ipip.ori.org/newVIAKey.htm). Original: "Love to hear about other countries and cultures." | draft |
| CU-SR-B09 | CU-SR | CU3 | B | - | When I hear an unfamiliar view, I dismiss it quickly. | New (written for this tool) | draft |
| CU-SR-R01 | CU-SR | CU1 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at finding out about things I did not know. | New (written for this tool) | draft |
| CU-SR-R02 | CU-SR | CU2 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at asking why and how questions. | New (written for this tool) | draft |
| CU-SR-R03 | CU-SR | CU3 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at exploring unfamiliar subjects and views. | New (written for this tool) | draft |
| CT-SR-A01 | CT-SR | CT1 | A | + | I look for cases that could prove a rule wrong. | New (written for this tool) | draft |
| CT-SR-A02 | CT-SR | CT1 | A | - | I treat a conclusion as proven when it seems likely. | New (written for this tool) | draft |
| CT-SR-A03 | CT-SR | CT2 | A | + | I look for unstated assumptions in an argument. | New (written for this tool) | draft |
| CT-SR-A04 | CT-SR | CT2 | A | - | I accept an argument if its conclusion matches my own view. | New (written for this tool) | draft |
| CT-SR-A05 | CT-SR | CT3 | A | + | I change my mind when I see better evidence. | New (written for this tool) | draft |
| CT-SR-A06 | CT-SR | CT3 | A | - | I am more confident in my answers than the evidence supports. | New (written for this tool) | draft |
| CT-SR-A07 | CT-SR | CT4 | A | + | Before I judge a single case, I ask how common that kind of case is. | New (written for this tool) | draft |
| CT-SR-A08 | CT-SR | CT4 | A | - | I draw general conclusions from one or two striking examples. | New (written for this tool) | draft |
| CT-SR-B01 | CT-SR | CT1 | B | + | I check whether a conclusion follows necessarily from the facts given. | New (written for this tool) | draft |
| CT-SR-B02 | CT-SR | CT1 | B | - | To test a rule, I look only for examples that fit it. | New (written for this tool) | draft |
| CT-SR-B03 | CT-SR | CT2 | B | + | Before I criticise a view, I state it in a way its supporters would accept. | New (written for this tool) | draft |
| CT-SR-B04 | CT-SR | CT2 | B | - | I am more critical of arguments I disagree with than of arguments I agree with. | New (written for this tool) | draft |
| CT-SR-B05 | CT-SR | CT3 | B | + | When new evidence arrives, I revise my conclusions. | New (written for this tool) | draft |
| CT-SR-B06 | CT-SR | CT3 | B | - | I defend my view even when new evidence goes against it. | New (written for this tool) | draft |
| CT-SR-B07 | CT-SR | CT4 | B | + | I am careful with results that come from a small group of people. | New (written for this tool) | draft |
| CT-SR-B08 | CT-SR | CT4 | B | - | I trust a survey result without asking how many people took part. | New (written for this tool) | draft |
| CT-SR-R01 | CT-SR | CT1 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at working out what follows logically from information. | New (written for this tool) | draft |
| CT-SR-R02 | CT-SR | CT2 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at judging the strength of an argument. | New (written for this tool) | draft |
| CT-SR-R03 | CT-SR | CT3 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at matching my confidence to the evidence. | New (written for this tool) | draft |
| CT-SR-R04 | CT-SR | CT4 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at reasoning with numbers, samples and chance. | New (written for this tool) | draft |
| CR-SR-A01 | CR-SR | CR1 | A | + | When I look for ideas, I keep going after the obvious ones. | New (written for this tool) | draft |
| CR-SR-A02 | CR-SR | CR1 | A | - | I run out of ideas quickly. | New (written for this tool) | draft |
| CR-SR-A03 | CR-SR | CR2 | A | + | I come up with very different kinds of solution to the same problem. | New (written for this tool) | draft |
| CR-SR-A04 | CR-SR | CR2 | A | - | My ideas for a problem are usually variations of one idea. | New (written for this tool) | draft |
| CR-SR-A05 | CR-SR | CR3 | A | + | I am an original thinker. | IPIP V226: IPIP scale for VIA-IS Originality/Creativity [Ori] (key: ipip.ori.org/newVIAKey.htm). Original: "Am an original thinker." | draft |
| CR-SR-A06 | CR-SR | CR3 | A | - | My ideas are usually the same as most people's first ideas. | New (written for this tool) | draft |
| CR-SR-A07 | CR-SR | CR4 | A | + | I notice problems that other people overlook. | New (written for this tool) | draft |
| CR-SR-A08 | CR-SR | CR4 | A | - | I work only on the problems that I am given. | New (written for this tool) | draft |
| CR-SR-B01 | CR-SR | CR1 | B | + | I can produce many ideas in a short time. | New (written for this tool) | draft |
| CR-SR-B02 | CR-SR | CR1 | B | - | After my first few ideas, I find it hard to think of more. | New (written for this tool) | draft |
| CR-SR-B03 | CR-SR | CR2 | B | + | When I am stuck, I look at the problem from a different angle. | New (written for this tool) | draft |
| CR-SR-B04 | CR-SR | CR2 | B | - | I stay with one way of seeing a problem. | New (written for this tool) | draft |
| CR-SR-B05 | CR-SR | CR3 | B | + | I combine ideas from unrelated areas. | New (written for this tool) | draft |
| CR-SR-B06 | CR-SR | CR3 | B | - | I find it hard to think of ideas that are new to other people. | New (written for this tool) | draft |
| CR-SR-B07 | CR-SR | CR4 | B | + | I turn a vague situation into a specific problem that I can work on. | New (written for this tool) | draft |
| CR-SR-B08 | CR-SR | CR4 | B | - | I wait for someone else to say what the problem is. | New (written for this tool) | draft |
| CR-SR-R01 | CR-SR | CR1 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at producing many ideas. | New (written for this tool) | draft |
| CR-SR-R02 | CR-SR | CR2 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at producing different kinds of idea. | New (written for this tool) | draft |
| CR-SR-R03 | CR-SR | CR3 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at producing ideas that few other people think of. | New (written for this tool) | draft |
| CR-SR-R04 | CR-SR | CR4 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at spotting problems that nobody has stated. | New (written for this tool) | draft |
| CM-SR-A01 | CM-SR | CM1 | A | + | In my emails, I state the main point in the first sentence. | New (written for this tool) | draft |
| CM-SR-A02 | CM-SR | CM1 | A | + | I check that each "it" or "they" in my writing refers to only one thing. | New (written for this tool) | draft |
| CM-SR-A03 | CM-SR | CM1 | A | - | In my writing, the main point comes after a lot of background. | New (written for this tool) | draft |
| CM-SR-A04 | CM-SR | CM2 | A | + | I use plain words when I write for someone outside my subject. | New (written for this tool) | draft |
| CM-SR-A05 | CM-SR | CM2 | A | - | I write in the same way for every reader. | New (written for this tool) | draft |
| CM-SR-A06 | CM-SR | CM2 | A | - | I mix formal and casual language in the same message. | New (written for this tool) | draft |
| CM-SR-A07 | CM-SR | CM3 | A | + | When I give a conclusion in writing, I explain why it follows from the facts. | New (written for this tool) | draft |
| CM-SR-A08 | CM-SR | CM3 | A | - | I list facts in my writing without showing how they connect. | New (written for this tool) | draft |
| CM-SR-A09 | CM-SR | CM3 | A | + | I use linking words, such as "because" and "however", that match my logic. | New (written for this tool) | draft |
| CM-SR-B01 | CM-SR | CM1 | B | + | I organise my writing so that the reader can find the main point quickly. | New (written for this tool) | draft |
| CM-SR-B02 | CM-SR | CM1 | B | - | People often misunderstand what I mean in my written messages. | New (written for this tool) | draft |
| CM-SR-B03 | CM-SR | CM1 | B | - | Some of my sentences can be read in two different ways. | New (written for this tool) | draft |
| CM-SR-B04 | CM-SR | CM2 | B | + | I change the level of detail in my writing to suit the reader. | New (written for this tool) | draft |
| CM-SR-B05 | CM-SR | CM2 | B | + | I use a formal tone when I write to a formal reader. | New (written for this tool) | draft |
| CM-SR-B06 | CM-SR | CM2 | B | - | I use specialist terms even when my reader is not a specialist. | New (written for this tool) | draft |
| CM-SR-B07 | CM-SR | CM3 | B | - | I give conclusions in my writing without giving reasons. | New (written for this tool) | draft |
| CM-SR-B08 | CM-SR | CM3 | B | + | In my writing, I show the steps from the facts to my conclusion. | New (written for this tool) | draft |
| CM-SR-B09 | CM-SR | CM3 | B | - | I leave the reader to work out why my conclusion follows. | New (written for this tool) | draft |
| CM-SR-R01 | CM-SR | CM1 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at making the main point of my writing clear. | New (written for this tool) | draft |
| CM-SR-R02 | CM-SR | CM2 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at adapting my writing to the reader. | New (written for this tool) | draft |
| CM-SR-R03 | CM-SR | CM3 | Retrospective | + | Looking back, at the start of the programme I would have rated myself as good at explaining the reasons behind my conclusions in writing. | New (written for this tool) | draft |

### Critical thinking task items (S7)

78 items, all new, all draft: CT-T1 20 (8 per form, 4 practice), CT-T2 19 (8 per form, 3 practice), CT-T3 24 (10 per form, 4 practice), CT-T4 15 (6 per form, 3 practice). Full wording, options, rationales and sources are in `content/critical/`; this table was generated from those files.

#### CT-T1 Conditional reasoning

| ID | Facet | Pool | Kind | Pattern | Rule | Cards to turn (key) | Source | Status |
|---|---|---|---|---|---|---|---|---|
| CT-T1-A01 | CT1 | A | abstract | P → Q | If the shape is a circle, then the colour is red. | Circle, Green | New (written for this tool) | draft |
| CT-T1-A02 | CT1 | A | abstract | P → not-Q | If the number is 3, then the letter is not M. | 3, M | New (written for this tool) | draft |
| CT-T1-A03 | CT1 | A | abstract | not-P → Q | If the word is not "stone", then the number is 5. | water, 9 | New (written for this tool) | draft |
| CT-T1-A04 | CT1 | A | abstract | not-P → not-Q | If the colour is not blue, then the number is not 4. | Yellow, 4 | New (written for this tool) | draft |
| CT-T1-A05 | CT1 | A | deontic | P → Q | A delivery company has this rule: If a van is on the motorway, its speed must be 90 km/h or less. | Motorway, 110 km/h | New (written for this tool) | draft |
| CT-T1-A06 | CT1 | A | deontic | P → not-Q | A laboratory has this rule: If a person is carrying food, they must not enter the laboratory. | Carrying food, Entered the laboratory | New (written for this tool) | draft |
| CT-T1-A07 | CT1 | A | deontic | not-P → Q | A library has this rule: If a student has not returned their borrowed books, they must pay a fee. | Books not returned, Did not pay a fee | New (written for this tool) | draft |
| CT-T1-A08 | CT1 | A | deontic | not-P → not-Q | A factory has this rule: If a worker has not completed safety training, they must not use the cutting machine. | Training not completed, Used the machine | New (written for this tool) | draft |
| CT-T1-B01 | CT1 | B | abstract | P → Q | If the letter is R, then the shape is a triangle. | R, Star | New (written for this tool) | draft |
| CT-T1-B02 | CT1 | B | abstract | P → not-Q | If the number is 6, then the colour is not white. | 6, White | New (written for this tool) | draft |
| CT-T1-B03 | CT1 | B | abstract | not-P → Q | If the shape is not a square, then the letter is D. | Circle, K | New (written for this tool) | draft |
| CT-T1-B04 | CT1 | B | abstract | not-P → not-Q | If the word is not "river", then the colour is not orange. | cloud, Orange | New (written for this tool) | draft |
| CT-T1-B05 | CT1 | B | deontic | P → Q | A bus company has this rule: If a bus is carrying passengers, its speed must be 60 km/h or less. | Carrying passengers, 75 km/h | New (written for this tool) | draft |
| CT-T1-B06 | CT1 | B | deontic | P → not-Q | A museum has this rule: If a visitor has a large bag, they must not enter the gallery. | Large bag, Entered the gallery | New (written for this tool) | draft |
| CT-T1-B07 | CT1 | B | deontic | not-P → Q | A sports centre has this rule: If a member has not booked a court, they must wait in the reception area. | No court booked, Went to the courts | New (written for this tool) | draft |
| CT-T1-B08 | CT1 | B | deontic | not-P → not-Q | A hospital has this rule: If a visitor has not washed their hands, they must not enter the ward. | Hands not washed, Entered the ward | New (written for this tool) | draft |
| CT-T1-P01 | CT1 | Practice | abstract | P → Q | If the number is 5, then the shape is a heart. | 5, Diamond | New (written for this tool) | draft |
| CT-T1-P02 | CT1 | Practice | abstract | not-P → Q | If the colour is not grey, then the letter is S. | Pink, B | New (written for this tool) | draft |
| CT-T1-P03 | CT1 | Practice | deontic | P → Q | An office has this rule: If a document is marked "Confidential", it must be kept in a locked drawer. | Confidential, On an open shelf | New (written for this tool) | draft |
| CT-T1-P04 | CT1 | Practice | deontic | P → not-Q | A swimming pool has this rule: If a person is wearing outdoor shoes, they must not walk beside the pool. | Outdoor shoes, Walked beside the pool | New (written for this tool) | draft |

#### CT-T2 Argument and evidence evaluation

| ID | Facets | Pool | Type | Scenario (opening words) | Key | Source | Status |
|---|---|---|---|---|---|---|---|
| CT-T2-A01 | CT2 | A | flaw | Maya runs a small café near a university. Last month she put ... | She ignores another possible cause of the rise: the start of the university term. | New (written for this tool) | draft |
| CT-T2-A02 | CT2 | A | flaw | A manager says: "Either our team works in the office every day, ... | The manager offers only two possibilities, when others exist, such as working in the office on some days. | New (written for this tool) | draft |
| CT-T2-A03 | CT2 | A | assumption | A city council plans to make bus travel free. A councillor argues: ... | Many people who now drive would take the bus if it were free. | New (written for this tool) | draft |
| CT-T2-A04 | CT2 | A | assumption | An online shop finds that customers who read product reviews spend more ... | Reading reviews makes customers spend more, rather than customers who already plan to spend more choosing to read reviews. | New (written for this tool) | draft |
| CT-T2-A05 | CT2, CT4 | A | evidence | A company with 2,000 staff wants to know how many of them ... | A survey of 300 staff chosen at random from every department. | New (written for this tool) | draft |
| CT-T2-A06 | CT2 | A | weaken | A school claims that its new reading app improves students' reading. Students ... | Students who did not use the app improved by the same amount over the same term. | New (written for this tool) | draft |
| CT-T2-A07 | CT2 | A | fairest | Two students discuss whether exams should be replaced by coursework. Sam prefers ... | Sam thinks exams are fairer, because conditions are the same for everyone and outside help is harder to get. | New (written for this tool) | draft |
| CT-T2-A08 | CT2 | A | objection | Lena argues: "Our university should stop printing course handbooks and publish them ... | Students without reliable internet access or a suitable device could not use the handbook. | New (written for this tool) | draft |
| CT-T2-B01 | CT2 | B | flaw | A gym owner offered free personal training sessions in January. Membership rose ... | She ignores another possible cause of the rise: the new office building next door. | New (written for this tool) | draft |
| CT-T2-B02 | CT2 | B | flaw | A team leader says: "Either we finish the report by Friday, or ... | The team leader offers only two possibilities, when others exist, such as agreeing a short delay with the client. | New (written for this tool) | draft |
| CT-T2-B03 | CT2 | B | assumption | A supermarket plans to put fruit next to the checkouts instead of ... | Many customers buy what is next to the checkout, and will not simply buy sweets from another shelf instead. | New (written for this tool) | draft |
| CT-T2-B04 | CT2 | B | assumption | A university finds that students who go to more lectures get higher ... | Going to lectures causes higher marks, rather than more motivated students choosing to go to more lectures. | New (written for this tool) | draft |
| CT-T2-B05 | CT2, CT4 | B | evidence | A city wants to know how its residents travel to work. ... | A survey of 1,000 residents chosen at random from all parts of the city. | New (written for this tool) | draft |
| CT-T2-B06 | CT2 | B | weaken | A company claims that its new training course makes sales staff more ... | Staff who did not take the course also sold more over the same months, by the same amount. | New (written for this tool) | draft |
| CT-T2-B07 | CT2 | B | fairest | Priya and Tom discuss whether their city should build more cycle lanes. ... | Tom thinks the lanes would take road space from buses and vans, and would be used by few people in his area. | New (written for this tool) | draft |
| CT-T2-B08 | CT2 | B | objection | Omar argues: "Our company should replace all meetings with written updates. Writing ... | Some decisions need a quick discussion between several people, which written updates do not allow. | New (written for this tool) | draft |
| CT-T2-P01 | CT2 | Practice | flaw | A friend says: "I read three online reviews of this phone, and ... | She draws a conclusion about every phone on the market from three reviews of one phone. | New (written for this tool) | draft |
| CT-T2-P02 | CT2 | Practice | assumption | A restaurant owner says: "If we open on Mondays, we will earn ... | Enough customers will come on Mondays to cover the extra costs of opening, such as staff wages. | New (written for this tool) | draft |
| CT-T2-P03 | CT2 | Practice | fairest | Ana wants her company to let staff choose their own working hours. ... | Ana thinks choosing their own hours would help staff work better and help the company keep its staff. | New (written for this tool) | draft |

#### CT-T3 Calibration and revision

| ID | Facet | Pool | Kind | Difficulty (intended) | Question | Options (key in bold) | Revision | Source (checked 2026-11-27) | Status |
|---|---|---|---|---|---|---|---|---|---|
| CT-T3-A01 | CT3 | A | comparison | harder | Which moon has the larger diameter? | **Ganymede, a moon of Jupiter** / Titan, a moon of Saturn | No | <https://science.nasa.gov/jupiter/jupiter-moons/ganymede/facts/> | draft |
| CT-T3-A02 | CT3 | A | comparison | harder | On Venus, which takes longer? | **Spinning once on its axis** / Going once around the Sun | Yes | <https://spaceplace.nasa.gov/all-about-venus/> <https://www.britannica.com/place/Venus-planet> | draft |
| CT-T3-A03 | CT3 | A | comparison | harder | Which is larger in area? | Greenland / **The Democratic Republic of the Congo** | Yes | <https://www.cia.gov/the-world-factbook/field/area/country-comparison> <https://npr.org/2026/01/07/nx-s1-5668482/greenland-mercator-map-size-distortion> | draft |
| CT-T3-A04 | CT3 | A | comparison | harder | Which city is further north? | **Rome** / New York | Yes | <https://en.wikipedia.org/wiki/Rome> <https://en.wikipedia.org/wiki/New_York_City> | draft |
| CT-T3-A05 | CT3 | A | comparison | harder | Which element makes up a larger share of the Earth's crust, by mass? | Iron / **Aluminium** | No | <https://en.wikipedia.org/wiki/Abundance_of_elements_in_Earth%27s_crust> <https://www.open.edu/openlearn/science-maths-technology/an-introduction-minerals-and-rocks-under-the-microscope/content-section-3.1> | draft |
| CT-T3-A06 | CT3 | A | comparison | easier | Which has more mass? | **One litre of water** / One litre of olive oil | No | <https://cameochemicals.noaa.gov/chemical/18013> | draft |
| CT-T3-A07 | CT3 | A | comparison | easier | Which mountain is higher? | Mont Blanc / **Kilimanjaro** | No | <https://www.britannica.com/science/mountain-landform/Selected-world-mountains> | draft |
| CT-T3-A08 | CT3 | A | estimation | easier | Light from the Sun takes how long to reach the Earth? | **More than 5 minutes** / Less than 5 minutes | No | <https://howthingsfly.si.edu/ask-an-explainer/how-long-does-it-take-light-sun-get-earth> | draft |
| CT-T3-A09 | CT3 | A | estimation | harder | Compared with the Earth's diameter, the Moon's diameter is... | less than a quarter of it / **more than a quarter of it** | No | <https://starchild.gsfc.nasa.gov/docs/StarChild/solar_system_level1/earth_satellites.html> <https://www.esa.int/ESA_Multimedia/Images/2021/09/Moon_facts_Size> | draft |
| CT-T3-A10 | CT3 | A | estimation | easier | The height of Mount Everest is... | more than 9,000 m / **less than 9,000 m** | No | <https://www.aljazeera.com/news/2020/12/8/mt-everest-nepal-china-announce-revised-height-at-8848-metres> | draft |
| CT-T3-B01 | CT3 | B | comparison | harder | Which planet has the larger diameter? | **Uranus** / Neptune | No | <https://science.nasa.gov/uranus/facts/> <https://www.britannica.com/place/Neptune-planet/Basic-astronomical-data> | draft |
| CT-T3-B02 | CT3 | B | comparison | harder | Which gas makes up a larger share of the air? | Carbon dioxide / **Argon** | Yes | <https://glossary.ametsoc.org/wiki/Argon> | draft |
| CT-T3-B03 | CT3 | B | comparison | harder | Which is larger in area? | **The Sahara desert** / Australia | Yes | <https://en.wikipedia.org/wiki/List_of_deserts_by_area> <https://www.cia.gov/the-world-factbook/field/area/country-comparison> | draft |
| CT-T3-B04 | CT3 | B | comparison | harder | Which lake is deeper? | Lake Tanganyika / **Lake Baikal** | Yes | <https://www.guinnessworldrecords.com/world-records/deepest-lake> <https://www.worldatlas.com/lakes/the-10-deepest-lakes-in-the-world.html> | draft |
| CT-T3-B05 | CT3 | B | comparison | harder | Which country has more people? | Brazil / **Nigeria** | No | <https://www.un.org/development/desa/pd/world-population-prospects-2024> <https://www.populationpyramid.net/nigeria/2024/> | draft |
| CT-T3-B06 | CT3 | B | comparison | easier | At sea level, which boils at a lower temperature? | **Pure ethanol** / Pure water | No | <https://www.engineeringtoolbox.com/ethanol-ethyl-alcohol-properties-C2H6O-d_2027.html> | draft |
| CT-T3-B07 | CT3 | B | comparison | easier | Which planet has the higher average surface temperature? | Mercury / **Venus** | No | <https://www.livescience.com/space/venus/why-is-venus-hotter-than-mercury-when-mercury-is-closer-to-the-sun> | draft |
| CT-T3-B08 | CT3 | B | estimation | easier | The distance around the Earth at the equator is... | **less than 50,000 km** / more than 50,000 km | No | <https://www.space.com/17638-how-big-is-earth.html> | draft |
| CT-T3-B09 | CT3 | B | estimation | easier | The deepest point of the ocean, in the Mariana Trench, is... | **more than 10,000 m deep** / less than 10,000 m deep | No | <https://www.guinnessworldrecords.com/world-records/deepest-point-in-the-sea> <https://www.livescience.com/how-deep-is-the-mariana-trench> | draft |
| CT-T3-B10 | CT3 | B | estimation | harder | Jupiter spins once on its axis in... | more than 12 hours / **less than 12 hours** | No | <https://science.nasa.gov/jupiter/facts/> | draft |
| CT-T3-P01 | CT3 | Practice | comparison | harder | Which has more bones? | **One human hand, with its wrist** / One human foot, with its ankle | Yes | <https://www.britannica.com/science/human-skeleton/Hands-and-feet> <https://www.informedhealth.org/how-do-hands-work.html> | draft |
| CT-T3-P02 | CT3 | Practice | comparison | easier | Which country is larger in area? | Australia / **Brazil** | No | <https://www.cia.gov/the-world-factbook/field/area/country-comparison> | draft |
| CT-T3-P03 | CT3 | Practice | comparison | harder | Which metal melts at a higher temperature? | **Iron** / Copper | No | <https://www.engineeringtoolbox.com/melting-temperature-metals-d_860.html> | draft |
| CT-T3-P04 | CT3 | Practice | estimation | easier | The average distance from the Earth to the Moon is... | less than 300,000 km / **more than 300,000 km** | No | <https://starchild.gsfc.nasa.gov/docs/StarChild/solar_system_level1/earth_satellites.html> | draft |

#### CT-T4 Statistical and base-rate reasoning

| ID | Facet | Pool | Type | Question | Key | Source | Status |
|---|---|---|---|---|---|---|---|
| CT-T4-A01 | CT4 | A | base-rate | An application is marked "experienced". How likely is it that the applicant really has worked in the industry before? | Less than 10% | New (written for this tool); numbers invented and stated in the item | draft |
| CT-T4-A02 | CT4 | A | base-rate | Is the student more likely to study business or engineering? | Business, because there are so many more business students. | New (written for this tool); numbers invented and stated in the item | draft |
| CT-T4-A03 | CT4 | A | sample-size | In which shop is a day with an average rating below 3 more likely? | Shop X, which asks 10 customers a day. | New (written for this tool); numbers invented and stated in the item | draft |
| CT-T4-A04 | CT4 | A | sample-size | Which of these is a sound reason to doubt the company's claim? | 8 students is a very small group, and a different 8 people could give a very different result. | New (written for this tool); numbers invented and stated in the item | draft |
| CT-T4-A05 | CT4 | A | proportion | Which team has the higher proportion of French speakers? | Team B. | New (written for this tool); numbers invented and stated in the item | draft |
| CT-T4-A06 | CT4 | A | chance | What is the chance that it stops on red next time? | Exactly 1 in 4. | New (written for this tool); numbers invented and stated in the item | draft |
| CT-T4-B01 | CT4 | B | base-rate | An email is marked "suspicious". How likely is it that it really is a fraud? | Less than 10% | New (written for this tool); numbers invented and stated in the item | draft |
| CT-T4-B02 | CT4 | B | base-rate | Is the student more likely to study finance or marketing? | Finance, because there are so many more finance students. | New (written for this tool); numbers invented and stated in the item | draft |
| CT-T4-B03 | CT4 | B | sample-size | In which restaurant is a day when more than half of the customers order a dessert more likely? | Restaurant X, which serves 20 customers a day. | New (written for this tool); numbers invented and stated in the item | draft |
| CT-T4-B04 | CT4 | B | sample-size | Which of these is a sound reason to doubt the company's claim? | 5 employees is a very small group, and a different 5 people could give a very different result. | New (written for this tool); numbers invented and stated in the item | draft |
| CT-T4-B05 | CT4 | B | proportion | Which class has the higher pass rate? | Class A. | New (written for this tool); numbers invented and stated in the item | draft |
| CT-T4-B06 | CT4 | B | chance | What is the chance that the next roll shows a 6? | Exactly 1 in 6. | New (written for this tool); numbers invented and stated in the item | draft |
| CT-T4-P01 | CT4 | Practice | base-rate | A parcel is marked "damaged". How likely is it that it really is damaged? | About 30% | New (written for this tool); numbers invented and stated in the item | draft |
| CT-T4-P02 | CT4 | Practice | sample-size | Which rating tells you more about what most buyers think of the product? | Product Y's rating, because it comes from many more buyers. | New (written for this tool); numbers invented and stated in the item | draft |
| CT-T4-P03 | CT4 | Practice | proportion | Which club has the higher proportion of members who joined this year? | Club B. | New (written for this tool); numbers invented and stated in the item | draft |

### Creativity task items (S8)

All `status: "draft"`. Categories and frequency tables written for this tool; bands are author-estimated (provisional).

| ID | Task | Pool | Object or situation | Categories | Table entries (common / occasional / rare) |
|---|---|---|---|---|---|
| CR-T1-A01 | CR-T1 | Form A | a cardboard box | 12: Storing and organising; Carrying, sending and giving; Play and toys; Animals and plants; Furniture and building; Art, craft and display; Wearing and dressing up; Covering and protecting; Signs and messages; Cardboard as a material; Sport and movement; Music and sound | 37 (8 / 16 / 13) |
| CR-T1-B01 | CR-T1 | Form B | an empty glass jar | 12: Storing and organising; Food and drink; Light and candles; Plants and animals; Money and saving; Decoration and craft; Using it as a tool; Science and measuring; Music and sound; Memories and messages; Cleaning and the bathroom; Games and play | 36 (7 / 19 / 10) |
| CR-T1-P01 | CR-T1 | Practice | a pencil | 9: Writing and drawing; A small tool; Hair, food and the body; Music and sound; Measuring and lines; Plants and the garden; Games and play; Building and models; What it is made of | 14 (3 / 7 / 4) |
| CR-T1-P02 | CR-T1 | Practice | an old towel | 8: Cleaning and drying; Wearing and dressing up; Comfort and sleep; Protecting and insulating; Sport and exercise; Signals and first aid; Craft and new material; Play and games | 14 (2 / 7 / 5) |
| CR-T2-A01 | CR-T2 | Form A | they share a flat (an apartment) with other students for the first time | 12: Money and bills; Cleaning and chores; Noise and sleep; Privacy, space and guests; Food and the kitchen; Getting on with each other; Rules, contracts and the landlord; Safety and security; Studying and concentration; Health and wellbeing; Different habits and cultures; Internet, heating and shared equipment | 37 (7 / 17 / 13) |
| CR-T2-B01 | CR-T2 | Form B | they start a part-time job while studying full time | 12: Time and balance; Studies and grades; Health, sleep and stress; Pay and money; Contracts, rights and rules; Managers and colleagues; Customers and the work itself; Travel and getting there; Friends, family and social life; Shifts and rotas; Safety at work; Career and the future | 34 (5 / 15 / 14) |
| CR-T2-P01 | CR-T2 | Practice | they organise a weekend trip with friends on a small budget | 10: Money and costs; Getting there; Somewhere to stay; Dates and plans; Group decisions; Food; Weather and the unexpected; Safety and belongings; Health and insurance; Documents and borders | 14 (5 / 4 / 5) |

### Communication task items (S9)

All `status: "draft"`, written for this tool.

#### CM-T1 Which is clearer?

| ID | Pool | Dimension | Facet | Genre | Situation | Clearer | Reason options (key in bold) |
|---|---|---|---|---|---|---|---|
| CM-T1-A01 | Form A | Ambiguity | CM1 | business | A message from a team leader to the team. | Version 2 | **ambiguity**, buried, jargon, register |
| CM-T1-A02 | Form A | Ambiguity | CM1 | academic | A sentence from a student's summary of a study. | Version 1 | register, **ambiguity**, reasoning, structure |
| CM-T1-A03 | Form A | Buried main point | CM1 | business | An email from a manager to the team. | Version 2 | jargon, ambiguity, **buried**, register |
| CM-T1-A04 | Form A | Structure | CM1 | academic | Instructions from a lecturer to students about handing in coursework. | Version 2 | ambiguity, register, jargon, **structure** |
| CM-T1-A05 | Form A | Jargon | CM2 | business | A message from the IT team to all staff. Most staff are not IT specialists. | Version 1 | **jargon**, buried, register, reasoning |
| CM-T1-A06 | Form A | Jargon | CM2 | academic | A summary of a study, written for first-year students who have not studied statistics. | Version 2 | ambiguity, structure, **jargon**, register |
| CM-T1-A07 | Form A | Register | CM2 | business | An email from a graduate applicant to a company's head of recruitment, whom the applicant has never met. | Version 1 | jargon, **register**, ambiguity, reasoning |
| CM-T1-A08 | Form A | Missing reasoning | CM3 | business | A note from a shop manager to the owner. | Version 1 | register, shorter, **reasoning**, jargon |
| CM-T1-A09 | Form A | Missing reasoning | CM3 | academic | A paragraph from a student's essay. | Version 2 | shorter, ambiguity, structure, **reasoning** |
| CM-T1-A10 | Form A | Missing reasoning | CM3 | academic | A student's conclusion from a small survey, written for a class report. | Version 1 | jargon, register, ambiguity, **reasoning** |
| CM-T1-B01 | Form B | Ambiguity | CM1 | business | A message from a project leader to a colleague. | Version 2 | **ambiguity**, register, buried, jargon |
| CM-T1-B02 | Form B | Ambiguity | CM1 | academic | A sentence from a student's summary of a study. | Version 2 | structure, **ambiguity**, register, reasoning |
| CM-T1-B03 | Form B | Buried main point | CM1 | business | An email from a supplier to a customer. | Version 1 | jargon, ambiguity, **buried**, register |
| CM-T1-B04 | Form B | Structure | CM1 | academic | Information from a university office about how to apply for a study-abroad place. | Version 2 | ambiguity, register, jargon, **structure** |
| CM-T1-B05 | Form B | Jargon | CM2 | business | A message from the finance team to new project managers who have no finance training. | Version 2 | **jargon**, buried, register, reasoning |
| CM-T1-B06 | Form B | Jargon | CM2 | academic | A summary of a research article, written for students in their first week at university. | Version 1 | ambiguity, structure, **jargon**, register |
| CM-T1-B07 | Form B | Register | CM2 | business | An email from a new employee to the company's chief executive, asking for a meeting. | Version 1 | jargon, **register**, ambiguity, reasoning |
| CM-T1-B08 | Form B | Missing reasoning | CM3 | business | A note from a team member to a manager about choosing a supplier. | Version 2 | register, shorter, **reasoning**, jargon |
| CM-T1-B09 | Form B | Missing reasoning | CM3 | academic | Part of a student's essay about recorded lectures. | Version 1 | shorter, ambiguity, structure, **reasoning** |
| CM-T1-B10 | Form B | Missing reasoning | CM3 | academic | A student's conclusion from a class experiment. | Version 1 | jargon, register, ambiguity, **reasoning** |
| CM-T1-P01 | Practice | Buried main point | CM1 | academic | A message from a student to a partner in a group project. | Version 2 | **buried**, jargon, ambiguity, register |
| CM-T1-P02 | Practice | Jargon | CM2 | academic | A note for students on a first-year psychology course. | Version 2 | register, **jargon**, structure, ambiguity |
| CM-T1-P03 | Practice | Register | CM2 | business | A message in a team chat to a close colleague. | Version 1 | jargon, reasoning, **register**, buried |
| CM-T1-P04 | Practice | Missing reasoning | CM3 | academic | From a student's essay about city transport. | Version 2 | shorter, **reasoning**, ambiguity, register |
| CM-T1-P05 | Practice | Ambiguity | CM1 | business | A note left for a colleague. | Version 1 | **ambiguity**, buried, jargon, register |

#### CM-T2 Spot the problem

| ID | Pool | Problem | Facet | Genre | Situation | Key sentence |
|---|---|---|---|---|---|---|
| CM-T2-A01 | Form A | ambiguity | CM1 | business | An email from the office manager to all staff. | 2: "When the cleaners meet the team leaders on Monday, they will explain the new rules for the kitchens." |
| CM-T2-A02 | Form A | buried | CM1 | business | An email from a project leader to a client. | 5: "The website will be ready on 30 June, two weeks later than we agreed, and we need you to approve this new date by Friday." |
| CM-T2-A03 | Form A | jargon | CM2 | academic | Part of a study summary written for first-year students on a general business course. | 3: "Using a difference-in-differences estimator with fixed effects, they found a negligible treatment effect on independent retailer revenue." |
| CM-T2-A04 | Form A | register | CM2 | business | An email from a student to a company's head of human resources, whom the student has never met. | 1: "Hey there, hope ur good!!" |
| CM-T2-A05 | Form A | reasoning | CM3 | academic | A paragraph from a student's essay. | 4: "Therefore, home exams are fairer than exams in a hall." |
| CM-T2-A06 | Form A | reasoning | CM3 | academic | From a student's report on a survey. | 4: "This means that the university should start morning lectures later." |
| CM-T2-B01 | Form B | ambiguity | CM1 | academic | From a student's summary of a research article. | 1: "The article compares nurses who work night shifts with doctors who work day shifts, and it says that they report more stress." |
| CM-T2-B02 | Form B | buried | CM1 | academic | A message from a tutor to a class. | 5: "The presentations will now take place on 12 May instead of 5 May, and each group will have 15 minutes instead of 10." |
| CM-T2-B03 | Form B | jargon | CM2 | business | A message from a bank to its customers. | 2: "The AER will move from a fixed to a tracker basis, with a margin of 0.5% over base." |
| CM-T2-B04 | Form B | register | CM2 | academic | An email from a student to a lecturer whom the student has not met before. | 4: "Can u explain that bit to me sometime this week? thx" |
| CM-T2-B05 | Form B | reasoning | CM3 | business | A note from a manager to the team. | 3: "So we will stop answering emails on Fridays." |
| CM-T2-B06 | Form B | reasoning | CM3 | business | From a report to a company's board. | 4: "As a result, we recommend opening two more shops in Lisbon next year." |
| CM-T2-P01 | Practice | ambiguity | CM1 | business | A message from a team leader to the team. | 3: "Chen will sit next to Daniel until his desk is ready." |
| CM-T2-P02 | Practice | buried | CM1 | academic | An email from the library to students. | 5: "From next Monday, the second floor will be a silent study area, open 24 hours a day." |
| CM-T2-P03 | Practice | jargon | CM2 | business | A message from the IT team to all staff. | 1: "Please enable MFA on your SSO account before Friday." |
| CM-T2-P04 | Practice | register | CM2 | academic | An email from a student to a classmate the student knows well. | 2: "I would be most grateful if you would kindly inform me at your earliest convenience whether the library would be a suitable venue." |
| CM-T2-P05 | Practice | reasoning | CM3 | business | A note from a café owner to the staff. | 4: "So we will stop selling sandwiches from next week." |

#### CM-T3 Rewrite

| ID | Pool | Genre | Reader | Goal |
|---|---|---|---|---|
| CM-T3-A01 | Form A | academic | Ms Patel, the programme administrator. You have never met. | Ask Ms Patel to move you to a different group for the strategy project, so that Ms Patel can decide quickly. |
| CM-T3-B01 | Form B | business | The head of sales. They are not a technical specialist, and they must decide by Friday. | Ask the head of sales to approve a delay to the app update, so that they can decide by Friday. |
| CM-T3-P01 | Practice | academic | A lecturer you have not met. They teach your Monday marketing class. | Ask the lecturer whether your essay can be longer than the word limit. |
| CM-T3-P02 | Practice | business | Customers of an online shop, reading a notice on the shop's website. | Tell customers whether their order may be late, and why. |
