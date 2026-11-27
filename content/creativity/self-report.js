// Self-report items for Creativity (CR-SR, docs/CONSTRUCTS.md section 4). DRAFT.
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

const VIA_ORI = 'IPIP scale for VIA-IS Originality/Creativity [Ori] (key: ipip.ori.org/newVIAKey.htm)';

export const formA = [
  item('CR-SR-A01', 'CR1', '+', 'When I look for ideas, I keep going after the obvious ones.'),
  item('CR-SR-A02', 'CR1', '-', 'I run out of ideas quickly.'),
  item('CR-SR-A03', 'CR2', '+', 'I come up with very different kinds of solution to the same problem.'),
  item('CR-SR-A04', 'CR2', '-', 'My ideas for a problem are usually variations of one idea.'),
  item('CR-SR-A05', 'CR3', '+', 'I am an original thinker.',
    { type: 'ipip', code: 'V226', scale: VIA_ORI, key: '+', original: 'Am an original thinker.' }),
  item('CR-SR-A06', 'CR3', '-', 'My ideas are usually the same as most people\'s first ideas.'),
  item('CR-SR-A07', 'CR4', '+', 'I notice problems that other people overlook.'),
  item('CR-SR-A08', 'CR4', '-', 'I work only on the problems that I am given.'),
];

export const formB = [
  item('CR-SR-B01', 'CR1', '+', 'I can produce many ideas in a short time.'),
  item('CR-SR-B02', 'CR1', '-', 'After my first few ideas, I find it hard to think of more.'),
  item('CR-SR-B03', 'CR2', '+', 'When I am stuck, I look at the problem from a different angle.'),
  item('CR-SR-B04', 'CR2', '-', 'I stay with one way of seeing a problem.'),
  item('CR-SR-B05', 'CR3', '+', 'I combine ideas from unrelated areas.'),
  item('CR-SR-B06', 'CR3', '-', 'I find it hard to think of ideas that are new to other people.'),
  item('CR-SR-B07', 'CR4', '+', 'I turn a vague situation into a specific problem that I can work on.'),
  item('CR-SR-B08', 'CR4', '-', 'I wait for someone else to say what the problem is.'),
];

export const practice = [];

/** End-of-programme retrospective items, one per facet (audit D-5). */
export const retrospective = [
  retro('CR-SR-R01', 'CR1', STEM + 'producing many ideas.'),
  retro('CR-SR-R02', 'CR2', STEM + 'producing different kinds of idea.'),
  retro('CR-SR-R03', 'CR3', STEM + 'producing ideas that few other people think of.'),
  retro('CR-SR-R04', 'CR4', STEM + 'spotting problems that nobody has stated.'),
];
