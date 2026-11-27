// Problem-finding items for Creativity (CR-T2, facet CR4, with CR1 to CR3; docs/CONSTRUCTS.md
// section 4). DRAFT.
//
// One everyday student situation per item: "What problems might a student face when ...?" Forms A
// and B each have one fixed situation, chosen to be similar in familiarity for undergraduates:
// both are common in the first years of study and neither needs specialist knowledge. This is the
// author's judgement, to be checked in the pilot (docs/OPEN-DECISIONS.md). The practice pool uses
// another situation.
//
// Item fields (src/skills/creativity/ideas.js, ideas-score.js; docs/ITEM-BANK.md):
//   kind         "problems"
//   situation    completes "What problems might a student face when ...?"
//   objectWords  words that only restate the situation; they count towards the two-word minimum
//                but do not by themselves make a problem
//   categories   kinds of problem, written for this tool, as in content/creativity/cr-t1.js
//                (no "Other" category; practice items have hints)
//   norms        the provisional frequency table, from content/creativity/problem-norms.js
//
// Forms A and B are parallel: 12 categories each; tables of similar size and band mix
// (checked by tests/creativity.test.mjs).

import { PROBLEM_NORMS } from './problem-norms.js';

const cat = (id, label, keywords, hint = null) => ({ id, label, keywords: keywords.split('|'), ...(hint ? { hint } : {}) });
const item = (id, situation, objectWords, categories) => ({
  id, status: 'draft', kind: 'problems', situation, objectWords, categories, norms: PROBLEM_NORMS[id],
});

export const formA = [
  item('CR-T2-A01', 'they share a flat (an apartment) with other students for the first time', ['student', 'students', 'flat', 'flats', 'apartment', 'share', 'sharing', 'flatmate', 'flatmates', 'roommate', 'roommates', 'housemate', 'housemates', 'problem', 'problems'], [
    cat('money', 'Money and bills', 'money|bill|bills|rent|pay|cost|costs|expensive|afford|deposit|split|debt|owe|budget'),
    cat('chores', 'Cleaning and chores', 'clean|cleaning|dirty|mess|messy|dishes|rubbish|bin|trash|chores|tidy|vacuum|housework'),
    cat('noise', 'Noise and sleep', 'noise|noisy|loud|music|sleep|party|parties|night|quiet|wake'),
    cat('privacy', 'Privacy, space and guests', 'privacy|private|space|room|alone|personal|guest|guests|visitor|visitors|bathroom|queue'),
    cat('food', 'Food and the kitchen', 'food|fridge|kitchen|cook|cooking|eat|groceries|shopping|diet|vegetarian|halal|smell'),
    cat('conflict', 'Getting on with each other', 'argue|argument|conflict|disagree|fight|tension|personality|rude|annoying|communicate|communication|trust|respect'),
    cat('rules', 'Rules, contracts and the landlord', 'landlord|contract|lease|tenancy|rules|rota|repairs|broken|maintenance|agent|agreement'),
    cat('safety', 'Safety and security', 'safety|safe|security|lock|locked|key|keys|theft|stolen|burglary|fire|alarm|strangers'),
    cat('study', 'Studying and concentration', 'study|studying|concentrate|concentration|focus|exam|exams|homework|assignment|desk|distract|distraction'),
    cat('wellbeing', 'Health and wellbeing', 'ill|illness|sick|germs|health|stress|stressed|anxiety|lonely|loneliness|homesick|tired|isolated'),
    cat('culture', 'Different habits and cultures', 'culture|cultural|language|religion|religious|habits|habit|background|customs|lifestyle|smoking|routine'),
    cat('utilities', 'Internet, heating and shared equipment', 'wifi|internet|heating|heat|hot water|shower|electricity|energy|washing machine|laundry|appliances'),
  ]),
];

export const formB = [
  item('CR-T2-B01', 'they start a part-time job while studying full time', ['student', 'students', 'job', 'jobs', 'problem', 'problems'], [
    cat('time', 'Time and balance', 'busy|hours|balance|juggle|deadline|deadlines|behind|overload|manage|late'),
    cat('study', 'Studies and grades', 'study|grades|marks|exam|exams|assignment|assignments|lectures|classes|attendance|fail|homework|coursework|revise'),
    cat('health', 'Health, sleep and stress', 'tired|sleep|exhausted|stress|stressed|burnout|health|ill|sick|anxiety|eat|energy'),
    cat('money', 'Pay and money', 'pay|paid|wage|wages|salary|money|tax|underpaid|payslip|bank|grant|loan'),
    cat('rights', 'Contracts, rights and rules', 'contract|rights|visa|permit|legal|law|illegal|rules|unfair|overtime|breaks|holiday|fired|exploit'),
    cat('people', 'Managers and colleagues', 'manager|boss|supervisor|colleague|colleagues|coworker|team|bully|bullying|harassment|staff|employer'),
    cat('work', 'Customers and the work itself', 'customer|customers|rude|complaints|boring|repetitive|mistakes|training|skills|experience|language'),
    cat('travel', 'Travel and getting there', 'travel|commute|commuting|transport|bus|train|far|distance|walk|home'),
    cat('social', 'Friends, family and social life', 'friends|friend|social|socialise|party|parties|events|clubs|societies|family|relationship|lonely|fun'),
    cat('shifts', 'Shifts and rotas', 'shift|shifts|rota|roster|weekend|weekends|night|evening|cancelled|notice|swap|unpredictable|schedule'),
    cat('safety', 'Safety at work', 'safety|safe|injury|injured|accident|dangerous|hazard|hurt|unsafe|heavy|standing'),
    cat('future', 'Career and the future', 'career|cv|resume|future|degree|graduate|motivation|quit|priorities|internship|placement'),
  ]),
];

export const practice = [
  item('CR-T2-P01', 'they organise a weekend trip with friends on a small budget', ['student', 'students', 'trip', 'weekend', 'friends', 'organise', 'small', 'problem', 'problems'], [
    cat('money', 'Money and costs', 'money|budget|expensive|cost|costs|afford|price|split|owe|pay',
      'Money is the obvious one. What could go wrong with sharing costs?'),
    cat('transport', 'Getting there', 'transport|train|bus|car|drive|flight|travel|tickets|late|miss',
      'How will everyone get there and back, and what could go wrong?'),
    cat('stay', 'Somewhere to stay', 'accommodation|hostel|hotel|stay|room|booking|book|camp|sleep|beds',
      'Where will they sleep? Think about booking, rooms and sharing.'),
    cat('planning', 'Dates and plans', 'date|dates|when|day|free|available|schedule|cancel|plan|plans|deadline|exam',
      'What could get in the way of the dates and the plan?'),
    cat('group', 'Group decisions', 'agree|decide|decision|choose|disagree|argue|argument|leader|organise|fair|responsible',
      'Who decides, and what happens when friends want different things?'),
    cat('food', 'Food', 'food|eat|eating|meals|restaurant|cook|cooking|diet|vegetarian|allergy',
      'What will they eat, and does everyone eat the same things?'),
    cat('weather', 'Weather and the unexpected', 'weather|rain|storm|cold|snow|heat|closed|strike',
      'What outside events could spoil the trip?'),
    cat('safety', 'Safety and belongings', 'lost|safety|safe|danger|dangerous|stolen|theft|phone|wallet|night',
      'What could go wrong with safety or belongings?'),
    cat('health', 'Health and insurance', 'ill|sick|injury|hurt|medicine|insurance|tired',
      'What if someone is ill or hurt while away?'),
    cat('documents', 'Documents and borders', 'passport|visa|id|identity|documents|border',
      'Do all the friends have the papers they need? Not everyone holds the same passport.'),
  ]),
];
