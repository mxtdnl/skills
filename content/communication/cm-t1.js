// "Which is clearer?" paired comparisons for Communication (CM-T1; docs/CONSTRUCTS.md section 5).
// DRAFT. New items written for this tool; none is taken from a published test.
//
// Each pair shows two versions of the same short message. The versions differ on ONE clarity
// dimension only, so that a single version is defensibly clearer and a single reason explains why.
// The student chooses the clearer version, then the reason (from four).
//
// Item fields (src/skills/communication/clearer.js; docs/ITEM-BANK.md):
//   dimension  the one way the versions differ (DIMENSIONS below)
//   facet      CM1 (ambiguity, buried, structure), CM2 (jargon, register), CM3 (reasoning)
//   genre      'business' or 'academic' (owner decision 2026-11-26: both, in roughly equal numbers)
//   context    who is writing to whom; the reader decides what counts as clear
//   versions   two versions of the message
//   key        index in `versions` of the clearer version
//   reasons    four reason codes (REASONS below), shown as options; one is the item's dimension
//   reasonKey  index in `reasons` of the item's dimension
//   rationale  why the key is right and the other reasons do not apply; stored for review and
//              shown in practice mode
//
// Forms A and B are parallel: the same dimension, facet and genre in the same position (ambiguity
// 2, buried key point 1, structure 1, jargon 2, register 1, missing reasoning 3; 5 business and
// 5 academic). On each form the clearer version is version 0 five times and version 1 five times,
// and the reason key sits at each position two or three times. On screen the versions keep their
// order (labelled Version 1 and Version 2, which the rationales refer to as "first" and "second");
// because the keys are balanced, always choosing Version 1 scores exactly at chance. The reasons are
// shuffled per item (ctx.rngFor), so always choosing the same reason position scores at chance.
// "It is shorter" is a distractor only where the clearer version is the longer one (audit A-7:
// the legacy task rewarded shortening even when the fix was to add the missing reasoning).

export const DIMENSIONS = Object.freeze({
  ambiguity: { facet: 'CM1', label: 'Ambiguity' },
  buried: { facet: 'CM1', label: 'Buried main point' },
  structure: { facet: 'CM1', label: 'Structure' },
  jargon: { facet: 'CM2', label: 'Jargon' },
  register: { facet: 'CM2', label: 'Register' },
  reasoning: { facet: 'CM3', label: 'Missing reasoning' },
});

/** Reason options. Every dimension has one; "shorter" is a distractor only. */
export const REASONS = Object.freeze({
  ambiguity: 'It leaves no doubt about who or what each word refers to.',
  buried: 'It puts the main point first.',
  structure: 'It puts the information in a clear order, one step at a time.',
  jargon: 'It uses plain words instead of specialist terms.',
  register: 'Its tone suits the reader and the situation.',
  reasoning: 'It gives the reasons that lead to the conclusion.',
  shorter: 'It is shorter.',
});

export const QUESTION_VERSION = 'Which version is clearer for this reader?';
export const QUESTION_REASON = 'What mainly makes it clearer?';

const pair = (id, dimension, genre, context, versions, key, reasons, rationale) => ({
  id, status: 'draft', dimension, facet: DIMENSIONS[dimension].facet, genre, context, versions, key,
  reasons, reasonKey: reasons.indexOf(dimension), rationale,
});

export const formA = [
  pair('CM-T1-A01', 'ambiguity', 'business', 'A message from a team leader to the team.',
    ['Sara told Priya that her report needs more detail. Please help her to finish it before Friday.',
      'Sara told Priya that Priya\'s report needs more detail. Please help Priya to finish the report before Friday.'],
    1, ['ambiguity', 'buried', 'jargon', 'register'],
    'In the first version, "her" could mean Sara or Priya, so the reader does not know whose report needs work or whom to help. The second version names Priya each time. Both versions put the request in the same place, use the same everyday words and have the same polite tone.'),
  pair('CM-T1-A02', 'ambiguity', 'academic', 'A sentence from a student\'s summary of a study.',
    ['The researchers compared the students who used the app with the students who did not. The students who used the app scored higher on the final test.',
      'The researchers compared the students who used the app with the students who did not. They scored higher on the final test.'],
    0, ['register', 'ambiguity', 'reasoning', 'structure'],
    'In the second version, "they" could mean the researchers, the students who used the app or the students who did not, so the main finding is unclear. The first version says which group scored higher. The order, tone and reasoning are the same in both.'),
  pair('CM-T1-A03', 'buried', 'business', 'An email from a manager to the team.',
    ['As you know, we have been reviewing our office costs for several months. Many of you answered the survey about how often you use the office, and we thank you for that. After looking at the results, we have decided that the office will be closed on Fridays from 1 March.',
      'From 1 March, the office will be closed on Fridays. We decided this after reviewing our office costs for several months and looking at the results of the survey about how often you use the office. Thank you to everyone who answered it.'],
    1, ['jargon', 'ambiguity', 'buried', 'register'],
    'The news the team needs is that the office will be closed on Fridays. The second version says this first; the first version makes the reader wait until the last sentence. Both give the same background, use plain words, refer clearly and have the same tone.'),
  pair('CM-T1-A04', 'structure', 'academic', 'Instructions from a lecturer to students about handing in coursework.',
    ['Upload your essay to the course page by 5 pm on Monday, but before that save it as a PDF, and remember that the file name must include your student number, which you should add before you save it, and after uploading check that you receive a confirmation email.',
      'To hand in your essay: 1. Add your student number to the file name. 2. Save the file as a PDF. 3. Upload it to the course page by 5 pm on Monday. 4. Check that you receive a confirmation email.'],
    1, ['ambiguity', 'register', 'jargon', 'structure'],
    'The first version gives the steps out of order in one long sentence, so the reader must work out what to do first. The second gives the same steps, numbered, in the order they are done. The words, the tone and what each "it" refers to are the same in both.'),
  pair('CM-T1-A05', 'jargon', 'business', 'A message from the IT team to all staff. Most staff are not IT specialists.',
    ['On Saturday we will move the customer database to a new online service, so between 9:00 and 12:00 it may be slow and may sometimes not open at all.',
      'On Saturday we will migrate the CRM to a new SaaS instance, so expect latency and intermittent 503 errors between 9:00 and 12:00.'],
    0, ['jargon', 'buried', 'register', 'reasoning'],
    'Most staff will not know "CRM", "SaaS instance", "latency" or "503 errors". The first version says the same thing in plain words. Both versions give the main point first, explain the cause with "so", and are equally polite.'),
  pair('CM-T1-A06', 'jargon', 'academic', 'A summary of a study, written for first-year students who have not studied statistics.',
    ['The intervention group\'s mean score was higher, but the difference was not statistically significant (p = 0.31), so the null hypothesis could not be rejected.',
      'On average, the students who had the extra lessons scored higher, but the difference was small enough that it could easily have happened by chance.'],
    1, ['ambiguity', 'structure', 'jargon', 'register'],
    'Students who have not studied statistics will not know "intervention group", "statistically significant", "p = 0.31" or "null hypothesis". The second version gives the same result in everyday words. The order of ideas and the neutral tone are the same, and neither version has an unclear reference.'),
  pair('CM-T1-A07', 'register', 'business', 'An email from a graduate applicant to a company\'s head of recruitment, whom the applicant has never met.',
    ['Dear Ms Okafor, I am writing to check that you received my application for the graduate role. I would be grateful to hear from you soon. Kind regards, Lee Chen',
      'Hey! Just checking you got my application for the graduate role lol. Would be awesome to hear back soon. Cheers, Lee'],
    0, ['jargon', 'register', 'ambiguity', 'reasoning'],
    'A first email to a senior person the writer has never met needs a polite, formal tone. "Hey", "lol" and "awesome" are too casual and may make the reader take the applicant less seriously. Both versions ask the same question in plain words, and nothing is unclear.'),
  pair('CM-T1-A08', 'reasoning', 'business', 'A note from a shop manager to the owner.',
    ['Sales of umbrellas fell by 40% this month because it hardly rained. Umbrellas take up space at the front of the shop, where new products sell best, so we should move them to the back until the rainy season.',
      'Sales of umbrellas fell by 40% this month. We should move the umbrellas to the back of the shop.'],
    0, ['register', 'shorter', 'reasoning', 'jargon'],
    'The second version gives a fact and a decision but not the link between them, so the owner cannot judge the idea. The first version explains why sales fell and why the space at the front matters. It is longer, and that is the point: adding the missing reason makes it clearer. The tone and the words are the same.'),
  pair('CM-T1-A09', 'reasoning', 'academic', 'A paragraph from a student\'s essay.',
    ['Many students work part-time while they study. Therefore, universities should offer more evening classes.',
      'Many students work part-time while they study, and most of their jobs are during the day. Evening classes would let these students attend without missing work. Therefore, universities should offer more evening classes.'],
    1, ['shorter', 'ambiguity', 'structure', 'reasoning'],
    'The first version jumps from "students work part-time" to "more evening classes" without saying why one leads to the other. The second adds the missing steps: the jobs are in the day, and evening classes avoid the clash. Shorter is not clearer here. Both versions have the same order and clear references.'),
  pair('CM-T1-A10', 'reasoning', 'academic', 'A student\'s conclusion from a small survey, written for a class report.',
    ['We asked 20 students about the library. Most said it was too noisy, but none said the opening hours were a problem. So the library should keep its current opening hours.',
      'We asked 20 students about the library. Most said it was too noisy. However, the library should keep its current opening hours.'],
    0, ['jargon', 'register', 'ambiguity', 'reasoning'],
    'In the second version, "however" suggests a contrast that is not there, and no finding supports the conclusion about opening hours. The first version gives the finding that does (no student had a problem with the hours) and links it with "so". The words and tone are the same, and "it" clearly means the library in both.'),
];

export const formB = [
  pair('CM-T1-B01', 'ambiguity', 'business', 'A message from a project leader to a colleague.',
    ['When Marta met the new client, she said she would need the contract by Monday.',
      'When Marta met the new client, the client asked for the contract by Monday.'],
    1, ['ambiguity', 'register', 'buried', 'jargon'],
    'In the first version, "she" could mean Marta or the client, so the colleague cannot tell who needs the contract. The second version says it is the client. Both have the same tone and order, and the same plain words.'),
  pair('CM-T1-B02', 'ambiguity', 'academic', 'A sentence from a student\'s summary of a study.',
    ['The study compared online and printed textbooks. It found that they were cheaper, but that students read them less carefully.',
      'The study compared online and printed textbooks. It found that online textbooks were cheaper, but that students read them less carefully than printed ones.'],
    1, ['structure', 'ambiguity', 'register', 'reasoning'],
    'In the first version, "they" and "them" could mean the online or the printed textbooks, so the reader cannot tell which kind was cheaper. The second version says. The order of ideas and the tone are the same, and neither version draws a conclusion that needs a reason.'),
  pair('CM-T1-B03', 'buried', 'business', 'An email from a supplier to a customer.',
    ['Your order of 12 March will arrive on 2 April, not on 20 March as planned. We have had a very busy month, and one of our delivery vans has been out of service for repairs. Our team has been working hard to catch up. Thank you for your patience.',
      'Thank you for your order of 12 March. We have had a very busy month, and one of our delivery vans has been out of service for repairs. Our team has been working hard to catch up. Your order will arrive on 2 April, not on 20 March as planned.'],
    0, ['jargon', 'ambiguity', 'buried', 'register'],
    'The customer most needs to know the new delivery date. The first version gives it first; the second hides it at the end, after the background. Both versions use the same plain words, the same polite tone and clear references.'),
  pair('CM-T1-B04', 'structure', 'academic', 'Information from a university office about how to apply for a study-abroad place.',
    ['You need a reference from a tutor, which you should ask for early, and the form must be signed by your programme leader, but first check that you meet the grade requirement, and the deadline for the whole application is 15 January.',
      'To apply: 1. Check that you meet the grade requirement. 2. Ask a tutor for a reference, early. 3. Have the form signed by your programme leader. 4. Send the whole application by 15 January.'],
    1, ['ambiguity', 'register', 'jargon', 'structure'],
    'The first version mixes the steps in one long sentence: the step to do first comes in the middle. The second puts the same steps in order and numbers them. The words, the tone and the references are the same in both.'),
  pair('CM-T1-B05', 'jargon', 'business', 'A message from the finance team to new project managers who have no finance training.',
    ['Please make sure all opex is accrued in the correct period, and flag any capex over the threshold to FP&A before month-end close.',
      'Please record every running cost in the month it belongs to, and tell the planning team about any equipment purchase over the limit before the end of the month.'],
    1, ['jargon', 'buried', 'register', 'reasoning'],
    'Managers with no finance training are unlikely to know "opex", "accrued", "capex", "FP&A" or "month-end close". The second version gives the same two instructions in plain words. Both versions start with the instruction, give no conclusion that needs a reason, and are equally polite.'),
  pair('CM-T1-B06', 'jargon', 'academic', 'A summary of a research article, written for students in their first week at university.',
    ['The authors followed the same group of students for several years, choosing them so that every type of student was included. Students who were very involved at the start were less likely to leave the study.',
      'The authors used a longitudinal cohort design with stratified sampling and found lower attrition among participants with high baseline engagement.'],
    0, ['ambiguity', 'structure', 'jargon', 'register'],
    'New students will not know "longitudinal cohort design", "stratified sampling", "attrition" or "baseline engagement". The first version explains the same method and finding in everyday words. The order of ideas and the neutral tone are the same in both.'),
  pair('CM-T1-B07', 'register', 'business', 'An email from a new employee to the company\'s chief executive, asking for a meeting.',
    ['Dear Dr Rossi, could we meet for ten minutes next week? I have some ideas that I think you may find useful. Best regards, Sam Patel',
      'yo, can we grab 10 mins next week? got some ideas u might like. sam'],
    0, ['jargon', 'register', 'ambiguity', 'reasoning'],
    'A first message to the head of the company needs a polite, formal tone. "yo", "grab 10 mins" and "u" are too casual for this reader. Both versions make the same request with the same information, and nothing in either is unclear.'),
  pair('CM-T1-B08', 'reasoning', 'business', 'A note from a team member to a manager about choosing a supplier.',
    ['Supplier A costs 10% more than Supplier B. We should choose Supplier A.',
      'Supplier A costs 10% more than Supplier B, but last year Supplier B delivered late on 6 of our 12 orders, and each late order stopped our production line for a day. Supplier A has never delivered late. So we should choose Supplier A.'],
    1, ['register', 'shorter', 'reasoning', 'jargon'],
    'The first version recommends the more expensive supplier but gives no reason, so the manager cannot judge it. The second explains why the higher price is worth paying. It is longer because it adds the missing reason, which is what makes it clearer. The words and tone are the same.'),
  pair('CM-T1-B09', 'reasoning', 'academic', 'Part of a student\'s essay about recorded lectures.',
    ['Some students live far from campus, and on days when trains are cancelled they cannot attend. If lectures are recorded, these students can still follow the course. Therefore, all lectures should be recorded.',
      'Some students live far from campus. Therefore, all lectures should be recorded.'],
    0, ['shorter', 'ambiguity', 'structure', 'reasoning'],
    'The second version jumps from "some students live far away" to "record all lectures" without the steps between. The first adds them: those students sometimes cannot attend, and recordings let them keep up. Shorter is not clearer here. Both have the same order and clear references.'),
  pair('CM-T1-B10', 'reasoning', 'academic', 'A student\'s conclusion from a class experiment.',
    ['We tested two ways of studying with 30 students. The group that tested themselves remembered more than the group that read their notes again. So students should be advised to test themselves.',
      'We tested two ways of studying with 30 students. The group that tested themselves remembered more. Similarly, students should be advised to test themselves.'],
    0, ['jargon', 'register', 'ambiguity', 'reasoning'],
    'In the second version, "similarly" is the wrong link: the advice is not similar to the finding, it follows from it. The second version also does not say what the other group did, so "remembered more" has no comparison. The first version gives the comparison and uses "so". The words and tone are the same.'),
];

export const practice = [
  pair('CM-T1-P01', 'buried', 'academic', 'A message from a student to a partner in a group project.',
    ['I have been looking at the notes from our last meeting and at the tutor\'s feedback, and thinking about how much time we have left. I think we should change our topic to renewable energy.',
      'I think we should change our topic to renewable energy. I have been looking at the notes from our last meeting, the tutor\'s feedback and how much time we have left.'],
    1, ['buried', 'jargon', 'ambiguity', 'register'],
    'The main point is the proposal to change topic. The second version says it first, so the partner knows at once what the message is about; the first makes them read the background before they find out. Both versions give the same background in the same words and tone.'),
  pair('CM-T1-P02', 'jargon', 'academic', 'A note for students on a first-year psychology course.',
    ['Participants showed a robust primacy effect in free recall.',
      'When people could recall the words in any order, they remembered the first words on the list much better than the others.'],
    1, ['register', 'jargon', 'structure', 'ambiguity'],
    'First-year students may not know "primacy effect" or "free recall". The second version explains the same finding in everyday words. The tone is neutral in both, and neither version has an unclear reference.'),
  pair('CM-T1-P03', 'register', 'business', 'A message in a team chat to a close colleague.',
    ['Hi Jun, sorry, I can\'t make lunch today. Ana',
      'Dear Mr Kim, I hereby wish to inform you that I shall be unable to attend lunch today. Yours sincerely, Ana Lopes'],
    0, ['jargon', 'reasoning', 'register', 'buried'],
    'Register can be wrong in both directions. In a team chat with a close colleague, the second version is so formal that it sounds cold or even annoyed. The first suits the reader and the situation. Both give the same news, first, with no reason needed.'),
  pair('CM-T1-P04', 'reasoning', 'academic', 'From a student\'s essay about city transport.',
    ['Bus fares in the city went up last year. So the city should build more bike lanes.',
      'Bus fares in the city went up last year, and a survey found that many people who stopped taking the bus now cycle instead, often on busy roads with no bike lane. So the city should build more bike lanes.'],
    1, ['shorter', 'reasoning', 'ambiguity', 'register'],
    'The first version links bus fares to bike lanes with "so", but does not say why one leads to the other. The second adds the missing step: people now cycle on roads without bike lanes. It is longer, but the extra words are the reason the reader needs.'),
  pair('CM-T1-P05', 'ambiguity', 'business', 'A note left for a colleague.',
    ['Mark spoke to the client this morning. The client wants the price list updated before meeting the board.',
      'Mark spoke to the client this morning. He wants the price list updated before he meets the board.'],
    0, ['ambiguity', 'buried', 'jargon', 'register'],
    'In the second version, "he" could mean Mark or the client, so the colleague does not know who wants the update or who is meeting the board. The first version names the client. Order, words and tone are the same.'),
];
