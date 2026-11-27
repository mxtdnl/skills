// Rewrite task for Communication (CM-T3; docs/CONSTRUCTS.md section 5). DRAFT. New items written
// for this tool.
//
// One short passage per form. The student rewrites it for the named reader, then checks their own
// rewrite against the five-point checklist below. The text and the self-check are stored; there
// is NO automated quality score (audit/BUILD-PLAN.md S9). The attempt is flagged coach-scorable,
// and a coach may score it later with the same checklist. An optional language-model rubric scorer
// exists only as a disabled interface (src/skills/communication/llm-scorer.js; D-8).
//
// Every passage has all five problems the checklist names, so the checklist applies to every
// rewrite in the same way.
//
// Item fields (src/skills/communication/rewrite.js; docs/ITEM-BANK.md):
//   genre      'business' or 'academic'
//   reader     who will read the rewrite (shown above the passage)
//   goal       what the rewrite must achieve, one sentence
//   passage    the text to rewrite
//   model      one possible rewrite, for coaches and for practice feedback. It is an example, not
//              a key: many different rewrites meet every point
//   notes      per checklist point: what the original did and how the model deals with it; shown
//              in practice mode and available to coaches
//
// Form A is academic (a student writing to a programme administrator) and form B is business (a
// team member writing to a manager): with one passage per form, the two genres cannot both appear
// on one form (docs/OPEN-DECISIONS.md D-27).

/**
 * The self-check checklist. The same five points are used by the student (self-check), by a coach
 * (later) and by any future scorer.
 */
export const RUBRIC = Object.freeze([
  { id: 'mainPoint', facet: 'CM1', text: 'The main point comes first.' },
  { id: 'words', facet: 'CM2', text: 'The words suit the reader: no specialist terms or slang that this reader may not know.' },
  { id: 'reasons', facet: 'CM3', text: 'The reasons are given, so the reader can see why.' },
  { id: 'references', facet: 'CM1', text: 'Every "it", "they" or "this" clearly refers to one thing.' },
  { id: 'register', facet: 'CM2', text: 'The tone suits the reader and the situation.' },
]);

/** Answers to each checklist point, in screen order. */
export const SELF_CHECK = Object.freeze([
  { value: 'yes', label: 'Yes' },
  { value: 'partly', label: 'Partly' },
  { value: 'no', label: 'Not yet' },
]);

const rewrite = (id, genre, reader, goal, passage, model, notes) => ({ id, status: 'draft', genre, reader, goal, passage, model, notes });

export const formA = [
  rewrite('CM-T3-A01', 'academic',
    'Ms Patel, the programme administrator. You have never met.',
    'Ask Ms Patel to move you to a different group for the strategy project, so that Ms Patel can decide quickly.',
    'hey!! so I have been thinking about it a lot and talked to my tutor and my parents and they said it\'s ok but you need to approve it. my group for the strategy project has a big problem with it, the meetings are always at 8am and I work nights at a hotel on mon and wed. can I switch to another one?',
    'Dear Ms Patel, Could I please move to a different group for the strategy project? My current group always meets at 8 am, and on Mondays and Wednesdays I work night shifts at a hotel, so I cannot take a full part in those meetings. My tutor agrees that a move would help, but I understand that the decision is yours. Thank you for your help. Kind regards, [your name]',
    {
      mainPoint: 'The original asks its question in the last sentence. The model asks it first, so Ms Patel knows at once what decision is needed.',
      words: 'The original uses "mon and wed" and "switch". The model uses full, everyday words that any reader knows.',
      reasons: 'The original mentions the 8 am meetings and the night work but does not link them. The model says what the clash means: the student cannot take a full part.',
      references: 'In the original, "it" and "they" are used for several things (the problem, the move, the tutor and parents), and "another one" could mean another group or another project. The model names each thing.',
      register: '"hey!!" and lower-case writing are too casual for an administrator the student has never met. The model uses a formal greeting, polite wording and a formal closing.',
    }),
];

export const formB = [
  rewrite('CM-T3-B01', 'business',
    'The head of sales. They are not a technical specialist, and they must decide by Friday.',
    'Ask the head of sales to approve a delay to the app update, so that they can decide by Friday.',
    'Following on from the sync, we did a deep dive on the churn numbers and the cohort analysis shows the onboarding funnel is leaking at step 3. They think we should push the release. It would mean the Q3 campaign slips a bit but whatever. Can you OK it by Friday?',
    'Could you approve a short delay to the app update by Friday? We looked closely at why customers stop using the app, and many new customers give up at step 3 of signing up. The product team would like to fix this before the update goes out, because otherwise more new customers will leave. The delay would move the summer sales campaign back a little. Thank you.',
    {
      mainPoint: 'The original asks for approval in its last sentence. The model asks first, so the reader knows at once that a decision is needed and by when.',
      words: '"sync", "deep dive", "churn", "cohort analysis" and "onboarding funnel" are specialist terms. The model says what each means in plain words: why customers stop using the app, and the steps of signing up.',
      reasons: 'The original gives a finding and a request but not the link between them. The model explains why a delay helps: the problem can be fixed before more customers leave.',
      references: 'In the original, "they" (who?), "the release" (which?) and "it" (the delay or the problem?) are unclear. The model names the product team, the app update and the delay.',
      register: '"but whatever" sounds careless about the reader\'s campaign, which is not suitable when asking a senior colleague for a decision. The model is polite and takes the effect on the campaign seriously.',
    }),
];

export const practice = [
  rewrite('CM-T3-P01', 'academic',
    'A lecturer you have not met. They teach your Monday marketing class.',
    'Ask the lecturer whether your essay can be longer than the word limit.',
    'I am in your monday class. I was wondering about the essay and I know it said 2,000 words but mine is around 2,600 because the case study needed loads of background and I didnt want to cut it. is that a problem or do i need to cut it?',
    'Dear Dr [lecturer\'s name], Is it acceptable to hand in my essay for the Monday marketing class at about 2,600 words? The brief gives a limit of 2,000 words, but my case study needs a lot of background, and cutting it would leave out information that the argument depends on. If I need to keep to 2,000 words, I will shorten it. Kind regards, [your name]',
    {
      mainPoint: 'The original asks its question only at the end. The model starts with the question, so the lecturer can answer it quickly.',
      words: '"loads of" is informal. The model uses "a lot of" and names "the brief", the document that sets the word limit.',
      reasons: 'The original says the background is needed but not why cutting it matters. The model adds that the argument depends on it.',
      references: 'In the original, "it said" (what said?) and "cut it" (the essay or the background?) are unclear. The model names the brief and the essay.',
      register: 'An email to a lecturer you have not met needs a greeting, capital letters and a polite closing. The original has none of these.',
    }),
  rewrite('CM-T3-P02', 'business',
    'Customers of an online shop, reading a notice on the shop\'s website.',
    'Tell customers whether their order may be late, and why.',
    'Due to unforeseen circumstances pertaining to the ongoing optimisation of our logistics infrastructure, it is possible that it may not arrive within the originally communicated timeframe. Customers who ordered before 3 May could be affected. We apologise.',
    'If you ordered before 3 May, your order may arrive later than we said. We are moving to a new warehouse, and this is taking longer than we planned. We are sorry for the delay.',
    {
      mainPoint: 'The original does not say who is affected until the second sentence. The model starts with it, so each customer knows at once whether the notice is about them.',
      words: '"pertaining to", "optimisation of our logistics infrastructure" and "originally communicated timeframe" are hard words for most customers. The model uses everyday words.',
      reasons: '"Unforeseen circumstances" does not tell customers anything. The model gives a reason. (The reason in the model is made up for this example: in a real notice, give the real reason.)',
      references: '"it is possible that it may not arrive": the second "it" has nothing to refer to. The model says "your order".',
      register: 'The original is stiff and formal for a short notice to customers, and "We apologise" sounds cold. The model is direct and polite.',
    }),
];
