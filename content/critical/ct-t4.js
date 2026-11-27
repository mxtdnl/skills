// Statistical and base-rate reasoning items for Critical thinking (CT-T4, facet CT4;
// docs/CONSTRUCTS.md section 3). DRAFT. New items written for this tool.
//
// The numbers in every scenario are stated in the item and invented for it; they are not claims
// about the world. The items use the standard paradigms (base rates, sample size and
// variability, proportions, independent chance events) with new content: none reuses the
// widely circulated versions (the taxicab, Linda, hospital or medical-screening problems).
// Arithmetic is kept to whole numbers per 100 or per 1,000, with no calculator needed.
//
// Item fields (src/skills/critical/choice.js; docs/ITEM-BANK.md):
//   type       "base-rate", "sample-size", "proportion" or "chance"
//   facets     ["CT4"]
//   scenario   the situation, plain English
//   question   the question asked
//   options    four options; one key
//   key        index of the single defensible answer
//   check      the numbers the key follows from, so tests/critical.test.mjs can recompute it:
//                { rule: "posterior", base, hit, falseAlarm }  P(condition | flagged), with
//                    base = P(condition), hit = P(flagged | condition), falseAlarm = P(flagged | not)
//                    and option ranges in `ranges` ([low, high] per option, as proportions)
//                { rule: "compare", groups: [[part, whole], ...], labels }  the key names the group
//                    with the larger share
//                { rule: "likelier", base: [a, b], fit: [a, b], labels }  the key names the group
//                    with the larger base * fit
//                { rule: "independent", p }  the key states that the chance is unchanged ("Exactly")
//                { rule: "smaller-sample", sizes, labels }  the key names the smallest sample (as the
//                    more variable, or as the reason for doubt)
//                { rule: "larger-sample", sizes, labels }  the key names the largest sample as the
//                    more informative
//              labels[i] is how the key option begins when group i is the answer
//   rationale  the worked solution, shown in practice mode
//
// Forms A and B are parallel: two base-rate, two sample-size, one proportion and one chance
// item each, in the same order, with the same arithmetic difficulty.

const item = (id, type, scenario, question, options, key, check, rationale) => ({
  id, status: 'draft', type, facets: ['CT4'], scenario, question, options, key, check, rationale,
});

const POSTERIOR_OPTIONS_A = ['About 90%', 'About 80%', 'About 50%', 'Less than 10%'];
const POSTERIOR_RANGES_A = [[0.85, 0.95], [0.75, 0.85], [0.45, 0.55], [0, 0.1]];

export const formA = [
  item('CT-T4-A01', 'base-rate',
    'A company receives many job applications. 1 in every 100 applicants has worked in the industry before. A computer tool marks 90 out of every 100 experienced applicants as "experienced". It also wrongly marks 10 out of every 100 applicants without experience as "experienced".',
    'An application is marked "experienced". How likely is it that the applicant really has worked in the industry before?',
    POSTERIOR_OPTIONS_A, 3,
    { rule: 'posterior', base: 0.01, hit: 0.9, falseAlarm: 0.1, ranges: POSTERIOR_RANGES_A },
    'Think of 1,000 applicants. 10 are experienced, and the tool marks 9 of them. 990 are not experienced, and the tool wrongly marks 99 of them. So 108 applications are marked, and only 9 of those are really experienced: about 8%. Most marked applications are false alarms, because experienced applicants are so rare.'),
  item('CT-T4-A02', 'base-rate',
    'At a university, 80% of students study business and 20% study engineering. A student is chosen at random. The student is quiet, enjoys puzzles and likes building things. This description fits 30% of business students and 60% of engineering students.',
    'Is the student more likely to study business or engineering?',
    ['Engineering, because the description fits engineering students better.',
      'Business, because there are so many more business students.',
      'Both are equally likely.',
      'It is impossible to say anything about it.'],
    1,
    { rule: 'likelier', base: [0.8, 0.2], fit: [0.3, 0.6], labels: ['Business', 'Engineering'] },
    'Think of 1,000 students: 800 in business and 200 in engineering. The description fits 30% of 800 = 240 business students and 60% of 200 = 120 engineering students. So a student who fits it is twice as likely to study business. The description matters, but the much larger number of business students matters more.'),
  item('CT-T4-A03', 'sample-size',
    'Two shops ask customers to rate their service from 1 to 5 each day. Shop X asks 10 customers a day. Shop Y asks 500 customers a day. Over a whole year, the average rating in both shops is 4.',
    'In which shop is a day with an average rating below 3 more likely?',
    ['Shop X, which asks 10 customers a day.',
      'Shop Y, which asks 500 customers a day.',
      'Both are equally likely.',
      'Neither, because both shops average 4.'],
    0,
    { rule: 'smaller-sample', sizes: [10, 500], labels: ['Shop X', 'Shop Y'] },
    'An average of a few answers varies much more from day to day than an average of many answers. With 10 customers, two or three unhappy customers can pull the day\'s average below 3. With 500 customers, that almost never happens.'),
  item('CT-T4-A04', 'sample-size',
    'A company tested a new energy drink on 8 students. 6 of them said they felt more awake afterwards. The company now says: "75% of people feel more awake after our drink."',
    'Which of these is a sound reason to doubt the company\'s claim?',
    ['8 students is a very small group, and a different 8 people could give a very different result.',
      '75% is not a majority.',
      'Students do not drink energy drinks.',
      'The drink may be expensive.'],
    0,
    { rule: 'smaller-sample', sizes: [8], labels: ['8 students'] },
    'With only 8 people, one or two different answers change the percentage a lot, so 75% is a very uncertain figure. 75% is a majority, many students do drink energy drinks, and the price says nothing about whether the claim is true.'),
  item('CT-T4-A05', 'proportion',
    'Team A has 40 members, and 10 of them speak French. Team B has 25 members, and 8 of them speak French.',
    'Which team has the higher proportion of French speakers?',
    ['Team A, because 10 is more than 8.',
      'Team B.',
      'They are the same.',
      'It cannot be worked out from this information.'],
    1,
    { rule: 'compare', groups: [[10, 40], [8, 25]], labels: ['Team A', 'Team B'] },
    'Team A: 10 out of 40 is 25 out of 100, or 25%. Team B: 8 out of 25 is 32 out of 100, or 32%. Team B has fewer French speakers but a higher proportion of them.'),
  item('CT-T4-A06', 'chance',
    'A fair spinner has four equal parts: red, blue, green and yellow. It has stopped on red 4 times in a row.',
    'What is the chance that it stops on red next time?',
    ['Less than 1 in 4, because red is unlikely to come up again.',
      'More than 1 in 4, because red is on a winning run.',
      'Exactly 1 in 4.',
      'It cannot be worked out from this information.'],
    2,
    { rule: 'independent', p: 0.25 },
    'A fair spinner has no memory. Each spin is a new event, with the same 1 in 4 chance for each colour, whatever happened before.'),
];

export const formB = [
  item('CT-T4-B01', 'base-rate',
    'A company receives many emails. 1 in every 100 emails is a fraud. A filter marks 80 out of every 100 fraud emails as "suspicious". It also wrongly marks 10 out of every 100 genuine emails as "suspicious".',
    'An email is marked "suspicious". How likely is it that it really is a fraud?',
    ['About 80%', 'About 70%', 'About 50%', 'Less than 10%'], 3,
    { rule: 'posterior', base: 0.01, hit: 0.8, falseAlarm: 0.1, ranges: [[0.75, 0.85], [0.65, 0.75], [0.45, 0.55], [0, 0.1]] },
    'Think of 1,000 emails. 10 are frauds, and the filter marks 8 of them. 990 are genuine, and the filter wrongly marks 99 of them. So 107 emails are marked, and only 8 of those are frauds: about 7%. Most marked emails are false alarms, because fraud emails are so rare.'),
  item('CT-T4-B02', 'base-rate',
    'At a business school, 80% of students study finance and 20% study marketing. A student is chosen at random. The student enjoys design and likes talking to customers. This description fits 30% of finance students and 60% of marketing students.',
    'Is the student more likely to study finance or marketing?',
    ['Marketing, because the description fits marketing students better.',
      'Finance, because there are so many more finance students.',
      'Both are equally likely.',
      'It is impossible to say anything about it.'],
    1,
    { rule: 'likelier', base: [0.8, 0.2], fit: [0.3, 0.6], labels: ['Finance', 'Marketing'] },
    'Think of 1,000 students: 800 in finance and 200 in marketing. The description fits 30% of 800 = 240 finance students and 60% of 200 = 120 marketing students. So a student who fits it is twice as likely to study finance. The description matters, but the much larger number of finance students matters more.'),
  item('CT-T4-B03', 'sample-size',
    'Two restaurants record how many customers order a dessert each day. Restaurant X serves 20 customers a day. Restaurant Y serves 400 customers a day. Over a whole year, 30% of customers order a dessert in both restaurants.',
    'In which restaurant is a day when more than half of the customers order a dessert more likely?',
    ['Restaurant X, which serves 20 customers a day.',
      'Restaurant Y, which serves 400 customers a day.',
      'Both are equally likely.',
      'Neither, because both restaurants average 30%.'],
    0,
    { rule: 'smaller-sample', sizes: [20, 400], labels: ['Restaurant X', 'Restaurant Y'] },
    'A percentage from a few customers varies much more from day to day than a percentage from many customers. With 20 customers, 11 desserts on one day is unusual but possible. With 400 customers, more than 200 desserts on one day almost never happens.'),
  item('CT-T4-B04', 'sample-size',
    'A company tried a new office layout with 5 employees. 4 of them said they preferred it. The company now says: "80% of our staff will prefer the new layout."',
    'Which of these is a sound reason to doubt the company\'s claim?',
    ['5 employees is a very small group, and a different 5 people could give a very different result.',
      '80% is not a majority.',
      'Office layouts change often.',
      'Some employees work from home on some days.'],
    0,
    { rule: 'smaller-sample', sizes: [5], labels: ['5 employees'] },
    'With only 5 people, one different answer changes the percentage by 20 points, so 80% is a very uncertain figure. 80% is a majority, and how often layouts change or where people sometimes work says nothing about whether the claim is true.'),
  item('CT-T4-B05', 'proportion',
    'Class A has 30 students, and 12 of them passed an optional exam. Class B has 50 students, and 18 of them passed it.',
    'Which class has the higher pass rate?',
    ['Class B, because 18 is more than 12.',
      'Class A.',
      'They are the same.',
      'It cannot be worked out from this information.'],
    1,
    { rule: 'compare', groups: [[12, 30], [18, 50]], labels: ['Class A', 'Class B'] },
    'Class A: 12 out of 30 is 40 out of 100, or 40%. Class B: 18 out of 50 is 36 out of 100, or 36%. Class B has more passes but a lower pass rate.'),
  item('CT-T4-B06', 'chance',
    'A fair six-sided dice has not shown a 6 in its last 10 rolls.',
    'What is the chance that the next roll shows a 6?',
    ['More than 1 in 6, because a 6 is overdue.',
      'Less than 1 in 6, because the dice seems to avoid 6.',
      'Exactly 1 in 6.',
      'It cannot be worked out from this information.'],
    2,
    { rule: 'independent', p: 1 / 6 },
    'A fair dice has no memory. Each roll is a new event, with the same 1 in 6 chance for each number, whatever happened before.'),
];

export const practice = [
  item('CT-T4-P01', 'base-rate',
    'In a warehouse, 5 in every 100 parcels are damaged. A scanner marks 90 out of every 100 damaged parcels as "damaged". It also wrongly marks 10 out of every 100 undamaged parcels as "damaged".',
    'A parcel is marked "damaged". How likely is it that it really is damaged?',
    ['About 90%', 'About 70%', 'About 30%', 'Less than 5%'], 2,
    { rule: 'posterior', base: 0.05, hit: 0.9, falseAlarm: 0.1, ranges: [[0.85, 0.95], [0.65, 0.75], [0.25, 0.35], [0, 0.05]] },
    'Think of 1,000 parcels. 50 are damaged, and the scanner marks 45 of them. 950 are undamaged, and the scanner wrongly marks 95 of them. So 140 parcels are marked, and 45 of those are damaged: about 32%, or about 1 in 3.'),
  item('CT-T4-P02', 'sample-size',
    'On a shopping website, product X has an average rating of 5 out of 5 from 2 reviews. Product Y has an average rating of 4.6 out of 5 from 900 reviews.',
    'Which rating tells you more about what most buyers think of the product?',
    ['Product X\'s rating, because it is higher.',
      'Product Y\'s rating, because it comes from many more buyers.',
      'Both tell you the same amount.',
      'Neither tells you anything.'],
    1,
    { rule: 'larger-sample', sizes: [2, 900], labels: ['Product X', 'Product Y'] },
    'Two reviews could easily be from the only two happy buyers. An average from 900 buyers changes very little if a few more buyers add a review, so it is a much better guide to what most buyers think.'),
  item('CT-T4-P03', 'proportion',
    'Club A has 60 members, and 15 of them joined this year. Club B has 20 members, and 6 of them joined this year.',
    'Which club has the higher proportion of members who joined this year?',
    ['Club A, because 15 is more than 6.',
      'Club B.',
      'They are the same.',
      'It cannot be worked out from this information.'],
    1,
    { rule: 'compare', groups: [[15, 60], [6, 20]], labels: ['Club A', 'Club B'] },
    'Club A: 15 out of 60 is 25 out of 100, or 25%. Club B: 6 out of 20 is 30 out of 100, or 30%. Club B has fewer new members but a higher proportion of them.'),
];
