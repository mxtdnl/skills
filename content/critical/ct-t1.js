// Conditional reasoning items for Critical thinking (CT-T1, facet CT1; docs/CONSTRUCTS.md section 3). DRAFT.
//
// Selection-task family (Wason, 1968). New items written for this tool: no item reuses the
// widely circulated letter-and-number version (vowel / even number) or the drinking-age
// version, and no rule uses an age or a country-specific law (audit A-4).
//
// Item fields (src/skills/critical/selection.js; docs/ITEM-BANK.md):
//   kind         "abstract" (arbitrary symbols) or "deontic" (a rule that people may break).
//                Reported as separate sub-scores (Griggs & Cox, 1982; Cosmides, 1989)
//   negation     { antecedent, consequent }: whether the rule's "if" part and "then" part are
//                negated. Each form has every one of the four patterns once per kind, so the
//                correct cards are not always "the first-mentioned and the negated second"
//   setting      what each card shows (plain text)
//   rule         the rule to test
//   cards        four cards, each { face, shows }, where shows says which case the visible side
//                is: "P" (the antecedent's condition holds), "notP", "Q" (the consequent's
//                condition holds) or "notQ". The rule is "if [not] P then [not] Q"
//   key          indices of the cards that must be turned. Always exactly the cards whose
//                visible side could be part of a case that breaks the rule;
//                tests/critical.test.mjs derives it from negation and cards and checks it
//   explanation  one or two sentences, shown with the worked explanation in practice mode
//
// Forms A and B are parallel: four abstract and four deontic items each, with the same four
// negation patterns per kind. Card order on screen is shuffled per item (ctx.rngFor).

const item = (id, kind, [antecedent, consequent], setting, rule, cards, key, explanation) => ({
  id,
  status: 'draft',
  kind,
  negation: { antecedent, consequent },
  setting,
  rule,
  cards: cards.map(([face, shows]) => ({ face, shows })),
  key,
  explanation,
});

const SHAPE_COLOUR = 'Each card has a shape on one side and a colour on the other side.';
const PERSON = (a, b) => `Each card shows one person. One side shows ${a}. The other side shows ${b}.`;

export const formA = [
  item('CT-T1-A01', 'abstract', [false, false], SHAPE_COLOUR,
    'If the shape is a circle, then the colour is red.',
    [['Circle', 'P'], ['Square', 'notP'], ['Red', 'Q'], ['Green', 'notQ']], [0, 3],
    'The rule is broken only by a card with a circle and a colour that is not red. So turn the circle and the green card.'),
  item('CT-T1-A02', 'abstract', [false, true], 'Each card has a number on one side and a letter on the other side.',
    'If the number is 3, then the letter is not M.',
    [['3', 'P'], ['8', 'notP'], ['M', 'Q'], ['T', 'notQ']], [0, 2],
    'The rule is broken only by a card with 3 and M. So turn the 3 and the M.'),
  item('CT-T1-A03', 'abstract', [true, false], 'Each card has a word on one side and a number on the other side.',
    'If the word is not "stone", then the number is 5.',
    [['stone', 'P'], ['water', 'notP'], ['5', 'Q'], ['9', 'notQ']], [1, 3],
    'The rule is broken only by a card with a word other than "stone" and a number other than 5. So turn "water" and 9.'),
  item('CT-T1-A04', 'abstract', [true, true], 'Each card has a colour on one side and a number on the other side.',
    'If the colour is not blue, then the number is not 4.',
    [['Blue', 'P'], ['Yellow', 'notP'], ['4', 'Q'], ['7', 'notQ']], [1, 2],
    'The rule is broken only by a card with a colour other than blue and the number 4. So turn the yellow card and the 4.'),
  item('CT-T1-A05', 'deontic', [false, false], 'Each card shows one delivery van. One side shows the road it was driving on. The other side shows its speed.',
    'A delivery company has this rule: If a van is on the motorway, its speed must be 90 km/h or less.',
    [['Motorway', 'P'], ['Town street', 'notP'], ['80 km/h', 'Q'], ['110 km/h', 'notQ']], [0, 3],
    'The rule is broken only by a van on the motorway going faster than 90 km/h. So check the van on the motorway and the van at 110 km/h.'),
  item('CT-T1-A06', 'deontic', [false, true], PERSON('whether they are carrying food', 'where they went'),
    'A laboratory has this rule: If a person is carrying food, they must not enter the laboratory.',
    [['Carrying food', 'P'], ['Not carrying food', 'notP'], ['Entered the laboratory', 'Q'], ['Stayed in the corridor', 'notQ']], [0, 2],
    'The rule is broken only by a person carrying food who entered the laboratory. So check the person carrying food and the person who entered.'),
  item('CT-T1-A07', 'deontic', [true, false], PERSON('whether they have returned their borrowed books', 'whether they paid a fee'),
    'A library has this rule: If a student has not returned their borrowed books, they must pay a fee.',
    [['Books returned', 'P'], ['Books not returned', 'notP'], ['Paid a fee', 'Q'], ['Did not pay a fee', 'notQ']], [1, 3],
    'The rule is broken only by a student who has not returned their books and did not pay. So check those two cards.'),
  item('CT-T1-A08', 'deontic', [true, true], PERSON('whether they have completed safety training', 'whether they used the cutting machine'),
    'A factory has this rule: If a worker has not completed safety training, they must not use the cutting machine.',
    [['Training completed', 'P'], ['Training not completed', 'notP'], ['Used the machine', 'Q'], ['Did not use the machine', 'notQ']], [1, 2],
    'The rule is broken only by a worker without the training who used the machine. So check "Training not completed" and "Used the machine".'),
];

export const formB = [
  item('CT-T1-B01', 'abstract', [false, false], 'Each card has a letter on one side and a shape on the other side.',
    'If the letter is R, then the shape is a triangle.',
    [['R', 'P'], ['H', 'notP'], ['Triangle', 'Q'], ['Star', 'notQ']], [0, 3],
    'The rule is broken only by a card with R and a shape that is not a triangle. So turn the R and the star.'),
  item('CT-T1-B02', 'abstract', [false, true], 'Each card has a number on one side and a colour on the other side.',
    'If the number is 6, then the colour is not white.',
    [['6', 'P'], ['2', 'notP'], ['White', 'Q'], ['Black', 'notQ']], [0, 2],
    'The rule is broken only by a card with 6 and white. So turn the 6 and the white card.'),
  item('CT-T1-B03', 'abstract', [true, false], 'Each card has a shape on one side and a letter on the other side.',
    'If the shape is not a square, then the letter is D.',
    [['Square', 'P'], ['Circle', 'notP'], ['D', 'Q'], ['K', 'notQ']], [1, 3],
    'The rule is broken only by a card with a shape other than a square and a letter other than D. So turn the circle and the K.'),
  item('CT-T1-B04', 'abstract', [true, true], 'Each card has a word on one side and a colour on the other side.',
    'If the word is not "river", then the colour is not orange.',
    [['river', 'P'], ['cloud', 'notP'], ['Orange', 'Q'], ['Purple', 'notQ']], [1, 2],
    'The rule is broken only by a card with a word other than "river" and the colour orange. So turn "cloud" and the orange card.'),
  item('CT-T1-B05', 'deontic', [false, false], 'Each card shows one bus. One side shows whether it is carrying passengers. The other side shows its speed.',
    'A bus company has this rule: If a bus is carrying passengers, its speed must be 60 km/h or less.',
    [['Carrying passengers', 'P'], ['Empty', 'notP'], ['50 km/h', 'Q'], ['75 km/h', 'notQ']], [0, 3],
    'The rule is broken only by a bus with passengers going faster than 60 km/h. So check the bus with passengers and the bus at 75 km/h.'),
  item('CT-T1-B06', 'deontic', [false, true], PERSON('whether they have a large bag', 'where they went'),
    'A museum has this rule: If a visitor has a large bag, they must not enter the gallery.',
    [['Large bag', 'P'], ['No large bag', 'notP'], ['Entered the gallery', 'Q'], ['Stayed in the entrance hall', 'notQ']], [0, 2],
    'The rule is broken only by a visitor with a large bag who entered the gallery. So check the visitor with the large bag and the visitor who entered.'),
  item('CT-T1-B07', 'deontic', [true, false], PERSON('whether they have booked a court', 'where they waited'),
    'A sports centre has this rule: If a member has not booked a court, they must wait in the reception area.',
    [['Court booked', 'P'], ['No court booked', 'notP'], ['Waited in reception', 'Q'], ['Went to the courts', 'notQ']], [1, 3],
    'The rule is broken only by a member without a booking who went to the courts. So check "No court booked" and "Went to the courts".'),
  item('CT-T1-B08', 'deontic', [true, true], PERSON('whether they have washed their hands', 'whether they entered the ward'),
    'A hospital has this rule: If a visitor has not washed their hands, they must not enter the ward.',
    [['Hands washed', 'P'], ['Hands not washed', 'notP'], ['Entered the ward', 'Q'], ['Did not enter the ward', 'notQ']], [1, 2],
    'The rule is broken only by a visitor who has not washed their hands and entered the ward. So check "Hands not washed" and "Entered the ward".'),
];

export const practice = [
  item('CT-T1-P01', 'abstract', [false, false], 'Each card has a number on one side and a shape on the other side.',
    'If the number is 5, then the shape is a heart.',
    [['5', 'P'], ['1', 'notP'], ['Heart', 'Q'], ['Diamond', 'notQ']], [0, 3],
    'The rule is broken only by a card with 5 and a shape that is not a heart. The heart card cannot break the rule: the rule does not say that only 5 can go with a heart.'),
  item('CT-T1-P02', 'abstract', [true, false], 'Each card has a colour on one side and a letter on the other side.',
    'If the colour is not grey, then the letter is S.',
    [['Grey', 'P'], ['Pink', 'notP'], ['S', 'Q'], ['B', 'notQ']], [1, 3],
    'The rule is broken only by a card with a colour other than grey and a letter other than S. So turn the pink card and the B. Notice that neither of these is named in the rule.'),
  item('CT-T1-P03', 'deontic', [false, false], 'Each card shows one document. One side shows whether it is marked "Confidential". The other side shows where it is kept.',
    'An office has this rule: If a document is marked "Confidential", it must be kept in a locked drawer.',
    [['Confidential', 'P'], ['Not confidential', 'notP'], ['In a locked drawer', 'Q'], ['On an open shelf', 'notQ']], [0, 3],
    'The rule is broken only by a confidential document that is not locked away. So check the confidential document and the document on the open shelf.'),
  item('CT-T1-P04', 'deontic', [false, true], PERSON('what they have on their feet', 'where they walked'),
    'A swimming pool has this rule: If a person is wearing outdoor shoes, they must not walk beside the pool.',
    [['Outdoor shoes', 'P'], ['Bare feet', 'notP'], ['Walked beside the pool', 'Q'], ['Stayed in the changing room', 'notQ']], [0, 2],
    'The rule is broken only by a person in outdoor shoes who walked beside the pool. So check the person in outdoor shoes and the person who walked beside the pool.'),
];
