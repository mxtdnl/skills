// Self-report items for Collaboration (CO-SR, docs/CONSTRUCTS.md section 1). DRAFT.
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
  item('CO-SR-A01', 'CO1', '+', 'In a group, I share information that the others may not have.'),
  item('CO-SR-A02', 'CO1', '+', 'Before my group makes a decision, I ask the quieter members for their view.'),
  item('CO-SR-A03', 'CO1', '-', 'In group discussions, I talk mainly about things that everyone already knows.'),
  item('CO-SR-A04', 'CO2', '+', 'I help my group agree who will do each task.'),
  item('CO-SR-A05', 'CO2', '-', 'I wait for other people to organise our group work.'),
  item('CO-SR-A06', 'CO2', '-', 'I finish my part of group work after the deadline that the group agreed.'),
  item('CO-SR-A07', 'CO3', '+', 'If I disagree with my group\'s plan, I say so and give my reason.'),
  item('CO-SR-A08', 'CO3', '-', 'I keep my concerns about my group\'s plan to myself.'),
  item('CO-SR-A09', 'CO3', '+', 'I give teammates specific feedback about their work.'),
];

export const formB = [
  item('CO-SR-B01', 'CO1', '+', 'When I know something useful for a group task, I tell the group without being asked.'),
  item('CO-SR-B02', 'CO1', '-', 'I accept the first idea in a group discussion before everyone has spoken.'),
  item('CO-SR-B03', 'CO1', '-', 'In group work, I rarely ask other members what they know.'),
  item('CO-SR-B04', 'CO2', '+', 'I check our group\'s progress against the deadlines we agreed.'),
  item('CO-SR-B05', 'CO2', '+', 'If I cannot finish my part on time, I warn the group early.'),
  item('CO-SR-B06', 'CO2', '-', 'When a teammate\'s work is weak, I redo it myself without telling them.'),
  item('CO-SR-B07', 'CO3', '-', 'After my group makes a decision, I keep arguing against it.'),
  item('CO-SR-B08', 'CO3', '+', 'I raise concerns about my group\'s direction early in a project.'),
  item('CO-SR-B09', 'CO3', '-', 'When a teammate\'s work has a problem, I say nothing to them about it.'),
];

export const practice = [];

/** End-of-programme retrospective items, one per facet (audit D-5). */
export const retrospective = [
  retro('CO-SR-R01', 'CO1', STEM + 'sharing information with my group and asking for theirs.'),
  retro('CO-SR-R02', 'CO2', STEM + 'organising group work and doing my share on time.'),
  retro('CO-SR-R03', 'CO3', STEM + 'raising disagreements and giving feedback in a group.'),
];
