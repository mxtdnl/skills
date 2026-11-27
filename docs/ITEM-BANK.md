# Item bank

**Purpose.** Records every item used by the tool: what it measures, which pool and form it belongs to, where it came from, and whether it has been reviewed. It is the provenance record required by audit finding M-1 and the global rule that item content is draft until reviewed by Hult staff.

Session 6 added the self-report items for all five skills (all draft). The legacy prototype's items are not part of this bank and must not be ported without review (see `audit/AUDIT-REPORT.md` sections A and B).

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

## Item status and review

Every item is `status: "draft"` until a Hult subject expert reviews it; only a reviewer changes it to `"reviewed"`. A materially changed item gets a new ID. Review should check, for each item: that it matches its facet definition in `docs/CONSTRUCTS.md` and nothing outside it; that its keying is right; that it reads clearly for a student writing in a second language; and that it fits the cultural-neutrality checks in `docs/REVIEW-CHECKLIST.md`. Self-report items are also candidates for cognitive interviews in the pilot (`docs/VALIDATION-PLAN.md`).

## Sources and licences

- **New items** were written for this tool in S6 against the facet definitions and behaviours in `docs/CONSTRUCTS.md`. They are not adapted from any published or proprietary scale.
- **IPIP items.** The International Personality Item Pool (ipip.ori.org) is in the public domain: its permission page states that permission is granted automatically for any use, commercial or non-commercial. Each IPIP item records its IPIP item code (from the site's alphabetical list of the 3,320 IPIP items), the IPIP scale it is keyed on and the page of that scale's key, and its original wording. The text here adds only the subject "I" and the matching verb form ("Am an original thinker." becomes "I am an original thinker."). Codes, wording and keying were checked against ipip.ori.org on 27 November 2026. General citation, as printed on the site's citation page: Goldberg, L. R., Johnson, J. A., Eber, H. W., Hogan, R., Ashton, M. C., Cloninger, C. R., & Gough, H. C. (2006). The International Personality Item Pool and the future of public-domain personality measures. *Journal of Research in Personality, 40*, 84-96.
- **Why few IPIP items.** IPIP scales measure broad traits (openness, intellect, VIA character strengths). Most of the facets here are specific behaviours (for example, CO2 coordination, CM3 explicit reasoning, CT4 base-rate reasoning) with no close IPIP match. IPIP items were used only where an item matches a facet definition directly; three did. Candidates considered and not used, because they match a facet only loosely, include VIA Originality/Creativity V5 ("Am able to come up with new and different ideas.") and V71 ("Like to think of new ways to do things."), and NEO O4 H2021 ("Am interested in many things.").

## Item table

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

