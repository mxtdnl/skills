// Self-report items for Curiosity (CU-SR, docs/CONSTRUCTS.md section 2). DRAFT.
//
// Item fields for the self-report (src/skills/common/self-report.js; docs/ITEM-BANK.md):
//   facet          facet code from docs/CONSTRUCTS.md
//   keying         "+" (agreeing means more of the facet) or "-" (agreeing means less; reversed in scoring)
//   text           statement rated on the five-point agreement scale (plain text, rendered with textContent)
//   source         { type: 'new' } for an item written for this tool, or
//                  { type: "ipip", code, scale, key, original } for an IPIP item (public domain), where
//                  original is the IPIP wording exactly and text adds only "I" and the matching verb form
//   retrospective  true for the end-of-programme "Looking back" items (asked only in programme
//                  sittings at an even window; scored separately, never part of the skill score)
//
// Every item is status "draft" until reviewed by Hult staff. Forms A and B are parallel: the same
// facets with the same number of items each. A self-report has no practice pool.

const NEW = Object.freeze({ type: 'new' });
const item = (id, facet, keying, text, source = NEW) => ({ id, status: 'draft', facet, keying, text, source });
const retro = (id, facet, text) => ({ id, status: 'draft', facet, keying: '+', text, source: NEW, retrospective: true });
const STEM = 'Looking back, at the start of the programme I would have rated myself as good at ';

const NEO_O4 = 'IPIP scale for NEO-PI-R facet O4 Adventurousness (key: ipip.ori.org/newNEOFacetsKey.htm)';
const VIA_CUR = 'IPIP scale for VIA-IS Curiosity [Cur] (key: ipip.ori.org/newVIAKey.htm)';

export const formA = [
  item('CU-SR-A01', 'CU1', '+', 'When I notice a gap in what I know, I look for the answer.'),
  item('CU-SR-A02', 'CU1', '+', 'When a fact surprises me, I look for the explanation.'),
  item('CU-SR-A03', 'CU1', '-', 'I look for information only when a task requires it.'),
  item('CU-SR-A04', 'CU2', '+', 'When I learn about a new situation, I ask why it happens.'),
  item('CU-SR-A05', 'CU2', '-', 'Most of my questions are about facts, such as dates or names, rather than causes.'),
  item('CU-SR-A06', 'CU2', '-', 'I accept explanations without asking further questions.'),
  item('CU-SR-A07', 'CU3', '+', 'I choose to learn about subjects outside my field of study.'),
  item('CU-SR-A08', 'CU3', '-', 'I prefer to stick with things that I know.',
    { type: 'ipip', code: 'X30', scale: NEO_O4, key: '-', original: 'Prefer to stick with things that I know.' }),
  item('CU-SR-A09', 'CU3', '+', 'I try to understand views that are different from my own.'),
];

export const formB = [
  item('CU-SR-B01', 'CU1', '+', 'I use my free time to find out about things I know little about.'),
  item('CU-SR-B02', 'CU1', '-', 'When something puzzles me, I move on without looking into it.'),
  item('CU-SR-B03', 'CU1', '-', 'I stop looking for information as soon as I have enough for the task.'),
  item('CU-SR-B04', 'CU2', '+', 'I ask "what if" questions about new ideas.'),
  item('CU-SR-B05', 'CU2', '+', 'I ask questions that could change how I understand a topic.'),
  item('CU-SR-B06', 'CU2', '-', 'I rarely ask how or why something happens.'),
  item('CU-SR-B07', 'CU3', '-', 'I prefer to stay with subjects that I already know well.'),
  item('CU-SR-B08', 'CU3', '+', 'I love to hear about other countries and cultures.',
    { type: 'ipip', code: 'V330', scale: VIA_CUR, key: '+', original: 'Love to hear about other countries and cultures.' }),
  item('CU-SR-B09', 'CU3', '-', 'When I hear an unfamiliar view, I dismiss it quickly.'),
];

export const practice = [];

/** End-of-programme retrospective items, one per facet (audit D-5). */
export const retrospective = [
  retro('CU-SR-R01', 'CU1', STEM + 'finding out about things I did not know.'),
  retro('CU-SR-R02', 'CU2', STEM + 'asking why and how questions.'),
  retro('CU-SR-R03', 'CU3', STEM + 'exploring unfamiliar subjects and views.'),
];
