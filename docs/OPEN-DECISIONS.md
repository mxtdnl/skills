# Open decisions and human review

**Purpose.** One list of every decision still needed from the owner or Hult, and every piece of review work that only a person can do. Each entry points to the document where the question arises. When an item is settled, it moves to [Resolved](#resolved) with the date, who settled it and where the answer is recorded. The answer itself lives in the source document or the decisions log in `audit/BUILD-PLAN.md`, not only here.

Maintained by every session (see `CLAUDE.md`, Workflow). Last updated: 27 November 2026, after S6.

**Who.** *Owner*: the repository owner. *Hult*: Hult staff (subject experts, faculty, coaches, brand, data protection), as named in each entry.

**Needed by.** The first session that cannot be finished properly without the answer. "Before use" means before the tool is used with students for that purpose.

---

## Decisions

| ID | Decision | Who | Needed by | Options or default | Source |
|---|---|---|---|---|---|
| D-1 | **Self-report forms A and B: different items or the same items?** S6 built two forms with different items, because the platform keeps forms disjoint (audit D-2). Different items mean any difference between the forms is mixed into measured change; counterbalancing (half the cohort A then B) separates it at cohort level only. Using the same items on both forms is the usual design for self-report change. | Owner | S11 (results) at the latest; ideally before S7 | Keep (current) / same items on both forms (needs a change to `validateContent` for self-reports and a scoring version bump) | `docs/ITEM-BANK.md` Pools and forms; decisions log 2026-11-27 |
| D-2 | **Which programme sittings count as "end of programme".** Retrospective items are asked at even programme windows (window 2 is the end), the same parity rule as form assignment. Nothing in the sitting records "end" explicitly. Matters if a programme has more than two windows. | Owner | Before programme use | Keep the parity rule / add an explicit end flag to the sitting code or record (schema change) | `docs/DATA-SCHEMA.md` Windows and programme sittings |
| D-3 | **Skills live before their tasks exist.** Since S6 the five skills are registered with self-reports only. A student who completes a self-directed assessment now has that sitting marked complete, so they cannot take the tasks in that window once S7 to S10 add them. | Owner | Before any use with students before S10 | Accept (tool not yet in use) / hide the skills until their tasks exist / reopen such sittings when tasks are added | `docs/ARCHITECTURE.md` Skill module contract |
| D-4 | **Collaboration SJT keying rule.** Who sits on the expert panel, how many members rate each option independently, how the key is set (for example, the panel mean), and when an item is dropped for disagreement. The S10 prompt specifies that until keys are supplied, every key is `PLACEHOLDER: expert key` and SJT scoring is disabled. | Hult (faculty who teach or assess group work, coaches) | S10 | No proposal made; to be fixed by Hult and recorded in `docs/SCORING.md` | `docs/CONSTRUCTS.md` section 1; `audit/BUILD-PLAN.md` S10b |
| D-5 | **Hult brand assets.** Official SVG logo, any mandatory brand colour, and whether Hult's aubergine replaces `--accent-1`. A PNG logo extracted from the prototype is used meanwhile. | Hult (brand) | Optional; before public release | Keep current palette and PNG / supply assets | `audit/AUDIT-REPORT.md` section 7, item 2; `docs/DESIGN.md` |
| D-6 | **Data protection and ethics approval for programme evaluation.** The owner approved the consent wording; using exported data for programme evaluation may still need Hult's data protection process. | Hult (data protection, ethics) | Before programme-evaluation use; S15 | Outside this repository; record the outcome in `docs/CONSENT.md` and `docs/VALIDATION-PLAN.md` | `docs/CONSENT.md` Status; `audit/AUDIT-REPORT.md` section 7, item 3 |
| D-7 | **Language-background categories.** The first-run question records only whether English is the student's first language. The categories Hult needs for the pilot fairness analysis are not decided. A change is a schema change. | Hult (with the pilot analyst) | S15 | Keep yes / no / prefer not to say / define categories | `docs/DATA-SCHEMA.md` Participant |
| D-8 | **Language-model scoring.** Creativity originality (and any later rewrite scoring) may use a language model only behind a disabled adapter, switched on after data protection approval, because responses would leave the browser. | Hult (data protection), then Owner | S8 (adapter stays disabled); before any switch-on | Keep disabled (default) | `docs/CONSTRUCTS.md` section 4; `audit/BUILD-PLAN.md` S8 |
| D-9 | **Pilot design inputs.** Pilot sample sizes, cut-offs and the ethics process. | Hult, Owner | S15 | None proposed | `audit/BUILD-PLAN.md` Human inputs required; S15 |
| D-10 | **Provisional scoring rules to confirm from pilot data.** Self-report long-run flag (6 identical answers in a row), fast-responding flag (median under 1 second per item), minimum answered items per facet (at least half), self-report time estimate (3 minutes). | Pilot analyst, Owner | S15 | Keep until pilot data exist | `docs/VALIDATION-PLAN.md` Provisional rules |
| D-11 | **Licence.** `LICENSE` holds `PLACEHOLDER: licence to be chosen by the owner`. | Owner | Before the repository or tool is shared outside the project | Choose a licence | `LICENSE`; `README.md` |

## Human review work

| ID | Work | Who | Needed by | Status | Source |
|---|---|---|---|---|---|
| R-1 | **Hult review of the construct definitions.** The S2 gate was passed by the owner's sign-off on 2026-11-27, which is not a review by Hult staff. A Hult reviewer should complete `docs/REVIEW-CHECKLIST.md` for each skill, including section 4 (fit with how the 5Cs are taught; no Hult rubrics or learning outcomes have been supplied for comparison). | Hult (faculty or programme leads) | Before programme-evaluation use; ideally before S7 to S10 items are reviewed | Not started | `docs/CONSTRUCTS.md` Sign-off; `docs/REVIEW-CHECKLIST.md` |
| R-2 | **Review every self-report item (S6).** 103 items, all `status: "draft"`: 86 form items (`CO-`, `CU-`, `CT-`, `CR-`, `CM-SR-A01` to `-A09`, `-B01` to `-B09`) and 17 retrospective items (`-R01` to `-R04`). Check facet fit, keying, plain English for second-language readers, and cultural neutrality; change `status` to `"reviewed"` only on approval. A materially changed item gets a new ID. | Hult subject experts | Before any use as evidence | Not started | `docs/ITEM-BANK.md` Item status and review, Item table |
| R-3 | **Review the items of each task as it is built.** Critical thinking (S7), Creativity (S8), Communication (S9), Curiosity and Collaboration (S10), including practice items and their feedback. Every item is draft until reviewed. | Hult subject experts | Each session's items before use as evidence | Not started (items not yet written) | `audit/BUILD-PLAN.md` Human inputs required |
| R-4 | **Check bibliographic details.** References in `docs/CONSTRUCTS.md` and `audit/AUDIT-REPORT.md` were written from memory (volume and page numbers in particular), including Howard (1980), cited for response shift in `docs/SCORING.md`. | Owner or Hult reviewer | Before either document is circulated outside the project | Not started | `docs/CONSTRUCTS.md` How to read; `audit/AUDIT-REPORT.md` References |
| R-5 | **Confirm the IPIP item attributions.** Three self-report items are IPIP items (X30, V330, V226). Codes, wording and keying were checked against ipip.ori.org on 2026-11-27 by Claude; a person should confirm the scale labels used in the citations. | Owner or Hult reviewer | With R-2 | Not started | `docs/ITEM-BANK.md` Sources and licences |
| R-6 | **Cognitive interviews and pilot.** Self-report and task items need cognitive interviews with students, including students writing in a second language, and a pilot to estimate reliability and set change thresholds. No individual change claim may be shown until then. | Hult, pilot team | S15 and after | Not started | `docs/VALIDATION-PLAN.md`; `audit/AUDIT-REPORT.md` section 6 |

---

## Resolved

| ID | Decision | Settled | By | Recorded in |
|---|---|---|---|---|
| — | Legacy prototype in use with students? No; S1 hotfixes skipped | 2026-11-26 | Owner | `audit/BUILD-PLAN.md` decisions log |
| — | ES modules over HTTP instead of classic scripts on `file://` | 2026-11-26 | Owner | `audit/BUILD-PLAN.md` decisions log |
| — | Consent wording drafted by Claude is acceptable | 2026-11-26 | Owner | `audit/BUILD-PLAN.md` decisions log; `docs/CONSENT.md` |
| — | First round of construct questions (CONSTRUCTS revision 2) | 2026-11-26 | Owner | `docs/CONSTRUCTS.md`; `audit/BUILD-PLAN.md` decisions log |
| — | Communication text colour: `--accent-7-ink` | 2026-11-27 | Owner | `docs/DESIGN.md`; `audit/BUILD-PLAN.md` decisions log |
| — | S2 gate: construct definitions signed off, approved as drafted (owner sign-off; Hult review remains as R-1) | 2026-11-27 | Owner | `docs/CONSTRUCTS.md` Sign-off |
