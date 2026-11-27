// "Spot the problem" passages for Communication (CM-T2; docs/CONSTRUCTS.md section 5). DRAFT. New
// items written for this tool. The passages are UNMARKED (audit A-7: the legacy task underlined
// the problems, which removed diagnosis): every passage has exactly one sentence with a problem,
// and the student finds it, then names the kind of problem.
//
// Item fields (src/skills/communication/spot.js; docs/ITEM-BANK.md):
//   problem    the kind of problem (PROBLEMS below)
//   facet      CM1 (ambiguity, buried), CM2 (jargon, register), CM3 (reasoning)
//   genre      'business' or 'academic'
//   context    who is writing to whom
//   sentences  the passage, five sentences, shown in this order as continuous text and then as
//              five numbered options
//   key        index of the sentence with the problem. For a buried main point it is the sentence
//              that holds the main point (the one that should come first); the instructions say so
//   rationale  why that sentence, why that kind of problem, and why the other sentences are fine;
//              stored for review and shown in practice mode
//
// Forms A and B are parallel: two items per facet (ambiguity, buried main point, jargon, register,
// and two missing-reasoning items), three business and three academic. The key sentence is at
// each of the five positions at least once and at no position more than twice, so always choosing
// the same sentence scores at or near chance (1 in 5). The five kinds of problem are always all
// offered, in an order shuffled per item (ctx.rngFor).

export const PROBLEMS = Object.freeze({
  ambiguity: { facet: 'CM1', label: 'Unclear meaning: it can be read in more than one way' },
  buried: { facet: 'CM1', label: 'Main point hidden: the most important point comes too late' },
  jargon: { facet: 'CM2', label: 'Specialist words: terms this reader may not know' },
  register: { facet: 'CM2', label: 'Wrong tone: too casual or too formal for this reader' },
  reasoning: { facet: 'CM3', label: 'Missing reason: a conclusion without the reason for it' },
});

/** The order in which the kinds of problem are stored; each response records the screen order. */
export const PROBLEM_CODES = Object.freeze(Object.keys(PROBLEMS));

export const QUESTION_SENTENCE = 'Which sentence most needs to change?';
export const QUESTION_PROBLEM = 'What is the problem with that sentence?';
export const INSTRUCTION = 'Each passage has one sentence with a problem. Find it, then say what the problem is. If the main point comes too late, choose the sentence that holds the main point.';

const passage = (id, problem, genre, context, sentences, key, rationale) => ({
  id, status: 'draft', problem, facet: PROBLEMS[problem].facet, genre, context, sentences, key, rationale,
});

export const formA = [
  passage('CM-T2-A01', 'ambiguity', 'business', 'An email from the office manager to all staff.',
    ['A cleaning company will start working in our building next week.',
      'When the cleaners meet the team leaders on Monday, they will explain the new rules for the kitchens.',
      'Please remove all food from the kitchen fridges by Friday evening.',
      'Anything left in the fridges after Friday will be thrown away.',
      'If you have any questions, please reply to this email.'],
    1,
    'In sentence 2, "they" could mean the cleaners or the team leaders, so staff do not know who will explain the rules. The other sentences are clear: each says who does what, in plain words and a suitable tone.'),
  passage('CM-T2-A02', 'buried', 'business', 'An email from a project leader to a client.',
    ['Thank you for meeting us last week to discuss the new website.',
      'Our designers have now looked at all the comments from your team.',
      'Some of the changes you asked for were small, and some will take more time.',
      'We have also checked the new plan with our developers.',
      'The website will be ready on 30 June, two weeks later than we agreed, and we need you to approve this new date by Friday.'],
    4,
    'Sentence 5 holds the main point: the website will be late, and the client must approve the new date by Friday. It comes last, after four sentences of background, so a busy reader may miss it. It should come first. The other sentences are useful background, clearly written.'),
  passage('CM-T2-A03', 'jargon', 'academic', 'Part of a study summary written for first-year students on a general business course.',
    ['The researchers wanted to know whether small shops lose sales when a large supermarket opens nearby.',
      'They studied 40 towns over five years.',
      'Using a difference-in-differences estimator with fixed effects, they found a negligible treatment effect on independent retailer revenue.',
      'Shops selling fresh food did slightly better than other small shops.',
      'The researchers suggest that more studies are needed in large cities.'],
    2,
    'Sentence 3 uses terms that first-year business students are unlikely to know ("difference-in-differences estimator", "fixed effects", "treatment effect"), and it holds the main finding, so the reader misses the result. In plain words: the small shops\' sales hardly changed. The other sentences use everyday words.'),
  passage('CM-T2-A04', 'register', 'business', 'An email from a student to a company\'s head of human resources, whom the student has never met.',
    ['Hey there, hope ur good!!',
      'My name is Ravi Shah, and I am a second-year business student.',
      'I am writing to ask whether your company offers summer internships in marketing.',
      'I have attached my CV, which describes my experience of social media work.',
      'Thank you for your time, and I look forward to hearing from you.'],
    0,
    'Sentence 1 is far too casual for a first email to a senior person the student has never met ("Hey there", "ur", "!!"). A formal greeting such as "Dear Ms Novak" would suit. The rest of the email has a polite, formal tone and a clear request.'),
  passage('CM-T2-A05', 'reasoning', 'academic', 'A paragraph from a student\'s essay.',
    ['Many universities now let students take exams at home on a computer.',
      'Home exams save money, because the university does not need to rent large halls.',
      'Students also avoid the cost and time of travelling to campus.',
      'Therefore, home exams are fairer than exams in a hall.',
      'However, universities need to find ways to stop cheating in home exams.'],
    3,
    'Sentence 4 concludes that home exams are "fairer", but the reasons given are about cost and travel time, not fairness. "Therefore" claims a link that the paragraph does not show. Sentences 2 and 3 give their reasons, and "however" in sentence 5 introduces a real contrast.'),
  passage('CM-T2-A06', 'reasoning', 'academic', 'From a student\'s report on a survey.',
    ['We surveyed 200 first-year students online in May.',
      'We asked them how many hours they slept each night during the exam period.',
      'On average, they slept six and a half hours a night.',
      'This means that the university should start morning lectures later.',
      'We plan to repeat the survey next year with more students.'],
    3,
    'Sentence 4 draws a conclusion about lecture times, but the report says nothing about when lectures start or whether early lectures cause the short sleep. The reader cannot see why the finding leads to the recommendation. The other sentences report facts or plans clearly.'),
];

export const formB = [
  passage('CM-T2-B01', 'ambiguity', 'academic', 'From a student\'s summary of a research article.',
    ['The article compares nurses who work night shifts with doctors who work day shifts, and it says that they report more stress.',
      'The data come from a survey of 1,500 hospital staff in three countries.',
      'The authors also measured how many hours each person slept.',
      'Staff who slept less than six hours a night reported more mistakes at work.',
      'The authors say that more research is needed on staff who work both day and night shifts.'],
    0,
    'In sentence 1, "they" could mean the nurses on night shifts or the doctors on day shifts, so the reader cannot tell which group reports more stress. That is the article\'s main comparison. The other sentences say clearly who or what they describe.'),
  passage('CM-T2-B02', 'buried', 'academic', 'A message from a tutor to a class.',
    ['Several of you have asked me about the group presentations.',
      'I have spoken to the other tutors on the module.',
      'We looked at the timetable and at the rooms that are free.',
      'We also thought about the feedback from last year\'s students.',
      'The presentations will now take place on 12 May instead of 5 May, and each group will have 15 minutes instead of 10.'],
    4,
    'Sentence 5 is the news the class needs: a new date and a new time limit. It comes last, after three sentences about how the decision was made, so students may stop reading before they reach it. It should come first. The other sentences are clear background.'),
  passage('CM-T2-B03', 'jargon', 'business', 'A message from a bank to its customers.',
    ['From 1 June, we are changing the way your savings account works.',
      'The AER will move from a fixed to a tracker basis, with a margin of 0.5% over base.',
      'You do not need to do anything, and your account number will stay the same.',
      'If you would like to move your money to a different account, you can do this online or in any branch.',
      'Please call us if you have any questions.'],
    1,
    'Sentence 2 is the important change, but most customers will not know "AER", "tracker basis", "margin" or "base". In plain words: the interest rate will no longer be fixed, and will go up and down with the national bank rate. The other sentences use everyday words.'),
  passage('CM-T2-B04', 'register', 'academic', 'An email from a student to a lecturer whom the student has not met before.',
    ['Dear Dr Mensah, I am a first-year student on your Economics module.',
      'I missed the lecture on Tuesday because I was ill.',
      'I have read the slides, but I did not understand the section on interest rates.',
      'Can u explain that bit to me sometime this week? thx',
      'Thank you for your help. Kind regards, Amira Haddad'],
    3,
    'Sentence 4 makes the request in a tone that is too casual for a lecturer the student has never met ("u", "that bit", "thx"). A more suitable version: "Could you explain this section to me this week, if you have time?" The rest of the email is polite and formal.'),
  passage('CM-T2-B05', 'reasoning', 'business', 'A note from a manager to the team.',
    ['Last month, our team answered 1,200 customer emails.',
      'The average reply took two days.',
      'So we will stop answering emails on Fridays.',
      'Customers can still phone us from Monday to Friday.',
      'The new rule will start on 1 September.'],
    2,
    'Sentence 3 announces a decision with "so", but nothing before it explains why. If replies are already slow, the reader would expect the team to answer more emails, not fewer. The reason for the decision is missing. The other sentences state facts or arrangements clearly.'),
  passage('CM-T2-B06', 'reasoning', 'business', 'From a report to a company\'s board.',
    ['We opened our first shop in Lisbon in January.',
      'In the first six months, it had 20,000 visitors.',
      'Sales were 15% below our plan.',
      'As a result, we recommend opening two more shops in Lisbon next year.',
      'The full sales figures are in the attached table.'],
    3,
    'Sentence 4 says "as a result", but the facts before it (sales below plan) point the other way, and no reason is given for opening more shops. The board cannot see how the recommendation follows. In sentence 2, "it" clearly means the shop.'),
];

export const practice = [
  passage('CM-T2-P01', 'ambiguity', 'business', 'A message from a team leader to the team.',
    ['Our team has two new members, Chen and Daniel.',
      'Both will work on the customer project from Monday.',
      'Chen will sit next to Daniel until his desk is ready.',
      'Please show them where the meeting rooms are.',
      'Thank you for helping them to settle in.'],
    2,
    'In sentence 3, "his" could mean Chen\'s desk or Daniel\'s desk. In sentences 4 and 5, "them" clearly means both new members, so those are fine. A clearer version: "Chen will sit next to Daniel until Chen\'s desk is ready."'),
  passage('CM-T2-P02', 'buried', 'academic', 'An email from the library to students.',
    ['As you know, the library has been very busy this term.',
      'Many students have told us that it is hard to find a quiet place to study.',
      'We have listened to your comments.',
      'We have also looked at how other universities run their libraries.',
      'From next Monday, the second floor will be a silent study area, open 24 hours a day.'],
    4,
    'The news is in sentence 5: a new silent study area, open all day and night. Everything before it is background. Choose the sentence that holds the main point when it comes too late: it should be the first sentence the reader sees.'),
  passage('CM-T2-P03', 'jargon', 'business', 'A message from the IT team to all staff.',
    ['Please enable MFA on your SSO account before Friday.',
      'This will help to protect your email and files.',
      'It takes about five minutes.',
      'Instructions are on the staff website.',
      'If you need help, the IT team can set it up with you in person.'],
    0,
    'Sentence 1 is the instruction, but many staff will not know "MFA" or "SSO". In plain words: "Please turn on the extra login check (a code sent to your phone) for your work account before Friday." The other sentences use everyday words.'),
  passage('CM-T2-P04', 'register', 'academic', 'An email from a student to a classmate the student knows well.',
    ['Hi Leo, are you free to study together tomorrow?',
      'I would be most grateful if you would kindly inform me at your earliest convenience whether the library would be a suitable venue.',
      'I can bring my notes from last week.',
      'Let me know what time works for you.',
      'See you soon, Mia'],
    1,
    'Tone can be wrong in both directions. Sentence 2 is far too formal for a friend, and it does not match the rest of the email. Something like "Is the library OK for you?" would suit. The other sentences have a friendly, relaxed tone that fits.'),
  passage('CM-T2-P05', 'reasoning', 'business', 'A note from a café owner to the staff.',
    ['Last month we started selling sandwiches at lunchtime.',
      'We sold about 30 sandwiches a day.',
      'Customers said they liked them.',
      'So we will stop selling sandwiches from next week.',
      'We will sell more cakes instead.'],
    3,
    'Sentence 4 says "so", but everything before it is good news. The reason for stopping (for example, that sandwiches cost more to make than they earn) is missing, so the staff cannot understand the decision.'),
];
