// Self-report items for Critical thinking (CT-SR, docs/CONSTRUCTS.md section 3). DRAFT.
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

export const formA = [
  item('CT-SR-A01', 'CT1', '+', 'I look for cases that could prove a rule wrong.'),
  item('CT-SR-A02', 'CT1', '-', 'I treat a conclusion as proven when it seems likely.'),
  item('CT-SR-A03', 'CT2', '+', 'I look for unstated assumptions in an argument.'),
  item('CT-SR-A04', 'CT2', '-', 'I accept an argument if its conclusion matches my own view.'),
  item('CT-SR-A05', 'CT3', '+', 'I change my mind when I see better evidence.'),
  item('CT-SR-A06', 'CT3', '-', 'I am more confident in my answers than the evidence supports.'),
  item('CT-SR-A07', 'CT4', '+', 'Before I judge a single case, I ask how common that kind of case is.'),
  item('CT-SR-A08', 'CT4', '-', 'I draw general conclusions from one or two striking examples.'),
];

export const formB = [
  item('CT-SR-B01', 'CT1', '+', 'I check whether a conclusion follows necessarily from the facts given.'),
  item('CT-SR-B02', 'CT1', '-', 'To test a rule, I look only for examples that fit it.'),
  item('CT-SR-B03', 'CT2', '+', 'Before I criticise a view, I state it in a way its supporters would accept.'),
  item('CT-SR-B04', 'CT2', '-', 'I am more critical of arguments I disagree with than of arguments I agree with.'),
  item('CT-SR-B05', 'CT3', '+', 'When new evidence arrives, I revise my conclusions.'),
  item('CT-SR-B06', 'CT3', '-', 'I defend my view even when new evidence goes against it.'),
  item('CT-SR-B07', 'CT4', '+', 'I am careful with results that come from a small group of people.'),
  item('CT-SR-B08', 'CT4', '-', 'I trust a survey result without asking how many people took part.'),
];

export const practice = [];

/** End-of-programme retrospective items, one per facet (audit D-5). */
export const retrospective = [
  retro('CT-SR-R01', 'CT1', STEM + 'working out what follows logically from information.'),
  retro('CT-SR-R02', 'CT2', STEM + 'judging the strength of an argument.'),
  retro('CT-SR-R03', 'CT3', STEM + 'matching my confidence to the evidence.'),
  retro('CT-SR-R04', 'CT4', STEM + 'reasoning with numbers, samples and chance.'),
];
