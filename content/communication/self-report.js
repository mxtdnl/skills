// Self-report items for Communication (CM-SR, docs/CONSTRUCTS.md section 5). Written
// communication only (CM-X1 spoken items are not part of this version). DRAFT.
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
  item('CM-SR-A01', 'CM1', '+', 'In my emails, I state the main point in the first sentence.'),
  item('CM-SR-A02', 'CM1', '+', 'I check that each "it" or "they" in my writing refers to only one thing.'),
  item('CM-SR-A03', 'CM1', '-', 'In my writing, the main point comes after a lot of background.'),
  item('CM-SR-A04', 'CM2', '+', 'I use plain words when I write for someone outside my subject.'),
  item('CM-SR-A05', 'CM2', '-', 'I write in the same way for every reader.'),
  item('CM-SR-A06', 'CM2', '-', 'I mix formal and casual language in the same message.'),
  item('CM-SR-A07', 'CM3', '+', 'When I give a conclusion in writing, I explain why it follows from the facts.'),
  item('CM-SR-A08', 'CM3', '-', 'I list facts in my writing without showing how they connect.'),
  item('CM-SR-A09', 'CM3', '+', 'I use linking words, such as "because" and "however", that match my logic.'),
];

export const formB = [
  item('CM-SR-B01', 'CM1', '+', 'I organise my writing so that the reader can find the main point quickly.'),
  item('CM-SR-B02', 'CM1', '-', 'People often misunderstand what I mean in my written messages.'),
  item('CM-SR-B03', 'CM1', '-', 'Some of my sentences can be read in two different ways.'),
  item('CM-SR-B04', 'CM2', '+', 'I change the level of detail in my writing to suit the reader.'),
  item('CM-SR-B05', 'CM2', '+', 'I use a formal tone when I write to a formal reader.'),
  item('CM-SR-B06', 'CM2', '-', 'I use specialist terms even when my reader is not a specialist.'),
  item('CM-SR-B07', 'CM3', '-', 'I give conclusions in my writing without giving reasons.'),
  item('CM-SR-B08', 'CM3', '+', 'In my writing, I show the steps from the facts to my conclusion.'),
  item('CM-SR-B09', 'CM3', '-', 'I leave the reader to work out why my conclusion follows.'),
];

export const practice = [];

/** End-of-programme retrospective items, one per facet (audit D-5). */
export const retrospective = [
  retro('CM-SR-R01', 'CM1', STEM + 'making the main point of my writing clear.'),
  retro('CM-SR-R02', 'CM2', STEM + 'adapting my writing to the reader.'),
  retro('CM-SR-R03', 'CM3', STEM + 'explaining the reasons behind my conclusions in writing.'),
];
