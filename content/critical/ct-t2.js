// Argument and evidence evaluation items for Critical thinking (CT-T2, facet CT2;
// docs/CONSTRUCTS.md section 3). DRAFT. New items written for this tool.
//
// Item fields (src/skills/critical/choice.js; docs/ITEM-BANK.md):
//   type       what the item asks for:
//                flaw        the main weakness in the reasoning
//                assumption  an unstated assumption the argument depends on
//                evidence    the strongest evidence for answering a question
//                weaken      the finding that would most weaken a claim
//                fairest     the fairest statement of someone's view (perspective-taking)
//                objection   the strongest objection to a position (perspective-taking)
//   facets     facet codes the item bears on. Every item is CT2; the evidence items, which turn on
//              how a sample is drawn, are also tagged CT4 (docs/CONSTRUCTS.md coverage table).
//              Only CT2 is scored from this task; CT4 has its own task (CT-T4)
//   scenario   the passage, at most 80 words, plain English (checked in tests/critical.test.mjs)
//   question   the question asked about the scenario
//   options    four options; one key
//   key        index of the single defensible answer
//   rationale  why the key is right and the others are not; stored with the item for review and
//              shown in practice mode
//
// Forms A and B are parallel: each has two flaw, two assumption, one evidence, one weaken, one
// fairest and one objection item, in the same order, with keys at each original position twice.
// Option order on screen is shuffled per item (ctx.rngFor).

const item = (id, type, facets, scenario, question, options, key, rationale) => ({
  id, status: 'draft', type, facets, scenario, question, options, key, rationale,
});

const CT2 = ['CT2'];
const CT2_CT4 = ['CT2', 'CT4'];
const Q_FLAW = 'What is the main weakness in this reasoning?';
const Q_ASSUME = 'Which assumption does this argument depend on?';
const Q_WEAKEN = 'Which finding, if true, would most weaken the claim?';
const Q_OBJECT = 'Which is the strongest objection to this proposal?';

export const formA = [
  item('CT-T2-A01', 'flaw', CT2,
    'Maya runs a small café near a university. Last month she put plants in the window, and sales rose by 15%. She says: "The plants brought in more customers, so we should put plants in all our cafés." Last month was also the first month of the university term, when many students return to the area.',
    Q_FLAW,
    ['She ignores another possible cause of the rise: the start of the university term.',
      'A 15% rise is too small to matter for a café.',
      'Plants cost money to look after.',
      'She does not say what kind of plants she used.'],
    0,
    'Sales rose at the same time as the students returned, so the plants may not be the cause. The other options do not affect whether the plants caused the rise: the size of the rise, the cost of plants and the type of plant leave the causal question open.'),
  item('CT-T2-A02', 'flaw', CT2,
    'A manager says: "Either our team works in the office every day, or we will lose all contact with each other. Nobody wants to lose contact, so everyone must come to the office every day."',
    Q_FLAW,
    ['The manager does not say how big the team is.',
      'The manager offers only two possibilities, when others exist, such as working in the office on some days.',
      'The manager does not explain why contact matters.',
      'Some people prefer to work from home.'],
    1,
    'The argument depends on there being only two choices. Many other arrangements are possible, so the conclusion does not follow. Team size and personal preference do not touch the logic, and the value of contact is accepted by everyone in the argument.'),
  item('CT-T2-A03', 'assumption', CT2,
    'A city council plans to make bus travel free. A councillor argues: "Free buses will reduce traffic in the city centre, because people will leave their cars at home."',
    Q_ASSUME,
    ['Bus drivers will support the plan.',
      'The plan will cost less than building new roads.',
      'Many people who now drive would take the bus if it were free.',
      'Buses produce less pollution than cars.'],
    2,
    'Traffic falls only if drivers switch to the bus. If price is not what keeps drivers off buses, free buses would not reduce traffic. The argument is about traffic, so it does not depend on drivers\' support, the cost compared with roads, or pollution.'),
  item('CT-T2-A04', 'assumption', CT2,
    'An online shop finds that customers who read product reviews spend more money than customers who do not. The marketing team concludes: "If we make every customer read reviews, our sales will increase."',
    Q_ASSUME,
    ['Reviews on the shop\'s website are usually positive.',
      'Customers trust reviews more than they trust advertising.',
      'The shop sells many different products.',
      'Reading reviews makes customers spend more, rather than customers who already plan to spend more choosing to read reviews.'],
    3,
    'The finding shows only that reading reviews and spending go together. The conclusion needs reading to cause the spending. If customers who already plan to spend more are the ones who read reviews, making everyone read them would not change sales. The other options are not needed for the conclusion.'),
  item('CT-T2-A05', 'evidence', CT2_CT4,
    'A company with 2,000 staff wants to know how many of them would use a new gym at work.',
    'Which evidence would best show this?',
    ['A survey of 300 staff chosen at random from every department.',
      'Comments from the 12 staff who asked the manager for a gym.',
      'The number of gyms near the office.',
      'A survey of 300 people at a fitness exhibition.'],
    0,
    'A random sample from every department represents all staff. The 12 staff who asked for a gym chose themselves and are likely to be keen. People at a fitness exhibition are not the company\'s staff and are likely to be keener than average. Nearby gyms say nothing about what staff would do.'),
  item('CT-T2-A06', 'weaken', CT2,
    'A school claims that its new reading app improves students\' reading. Students who used the app for one term scored higher on a reading test at the end of the term than at the start.',
    Q_WEAKEN,
    ['Most students enjoyed using the app.',
      'Students who did not use the app improved by the same amount over the same term.',
      'The app costs less than printed books.',
      'Some teachers did not like the app.'],
    1,
    'Students usually improve over a term anyway. If students without the app improved just as much, the improvement cannot be credited to the app. Enjoyment, cost and teachers\' opinions say nothing about whether the app caused the improvement.'),
  item('CT-T2-A07', 'fairest', CT2,
    'Two students discuss whether exams should be replaced by coursework. Sam prefers exams. Sam says that exams test every student under the same conditions, and that it is harder to get outside help in an exam.',
    'Which is the fairest summary of Sam\'s view?',
    ['Sam thinks coursework is always dishonest.',
      'Sam does not care how students learn.',
      'Sam thinks exams are fairer, because conditions are the same for everyone and outside help is harder to get.',
      'Sam thinks exams are easier for teachers to mark.'],
    2,
    'This summary keeps both of Sam\'s reasons and does not add anything. "Always dishonest" exaggerates Sam\'s point about outside help, "does not care" attacks Sam rather than stating the view, and marking is not a reason Sam gave.'),
  item('CT-T2-A08', 'objection', CT2,
    'Lena argues: "Our university should stop printing course handbooks and publish them only online. This would save paper and money, and students could always find the latest version."',
    Q_OBJECT,
    ['Printed handbooks look more professional.',
      'Lena has not studied at another university.',
      'Some people like reading on paper.',
      'Students without reliable internet access or a suitable device could not use the handbook.'],
    3,
    'The purpose of a handbook is that every student can use it. If some students cannot reach it online, the proposal fails at that purpose, whatever it saves. A preference for paper or a professional look matters less than access, and Lena\'s own experience is not a reason against the proposal.'),
];

export const formB = [
  item('CT-T2-B01', 'flaw', CT2,
    'A gym owner offered free personal training sessions in January. Membership rose by 20% that month. She concludes that the free sessions caused the rise and plans to offer them all year. In January, a large office building with 800 workers also opened next door.',
    Q_FLAW,
    ['She ignores another possible cause of the rise: the new office building next door.',
      'Personal training is not popular with every member.',
      'She does not say how much the sessions cost to run.',
      'She does not say how many members the gym had before.'],
    0,
    'Many new possible members arrived next door in the same month, so the sessions may not be the cause. Popularity, cost and the starting number of members do not affect whether the sessions caused the rise.'),
  item('CT-T2-B02', 'flaw', CT2,
    'A team leader says: "Either we finish the report by Friday, or the client will never work with us again. So we must cancel all our other work this week."',
    Q_FLAW,
    ['The team leader does not say who will write the report.',
      'The team leader offers only two possibilities, when others exist, such as agreeing a short delay with the client.',
      'The client may not read the report carefully.',
      'Some team members work part-time.'],
    1,
    'The argument depends on there being only two outcomes. Other outcomes are possible, so cancelling all other work does not follow. Who writes the report, how the client reads it and part-time working do not touch the logic.'),
  item('CT-T2-B03', 'assumption', CT2,
    'A supermarket plans to put fruit next to the checkouts instead of sweets. The manager says: "This will make our customers eat more healthily."',
    Q_ASSUME,
    ['Fruit costs more than sweets.',
      'Other supermarkets will copy the idea.',
      'Many customers buy what is next to the checkout, and will not simply buy sweets from another shelf instead.',
      'Sweets are bad for people\'s teeth.'],
    2,
    'The plan changes diets only if what is at the checkout affects what people buy, and if they do not just buy the sweets elsewhere. Price, copying by others and dental health are not needed for the manager\'s conclusion.'),
  item('CT-T2-B04', 'assumption', CT2,
    'A university finds that students who go to more lectures get higher marks. A lecturer concludes: "If we make lectures compulsory, marks will rise."',
    Q_ASSUME,
    ['Lectures are recorded and put online.',
      'Students prefer small classes to large lectures.',
      'Most lecturers are good at teaching.',
      'Going to lectures causes higher marks, rather than more motivated students choosing to go to more lectures.'],
    3,
    'The finding shows only that attendance and marks go together. The conclusion needs attendance to cause the marks. If motivated students both attend and do well, forcing everyone to attend may not raise marks. The other options are not needed for the conclusion.'),
  item('CT-T2-B05', 'evidence', CT2_CT4,
    'A city wants to know how its residents travel to work.',
    'Which evidence would best show this?',
    ['A survey of 1,000 residents chosen at random from all parts of the city.',
      'Answers from 1,000 people waiting at the main railway station.',
      'Letters from 25 residents who wrote to the council about traffic.',
      'The number of cars sold in the city last year.'],
    0,
    'A random sample from all areas represents the residents. People at a railway station are mostly travelling by train, and many may not live in the city. Residents who write letters chose themselves. Car sales do not show how people travel to work.'),
  item('CT-T2-B06', 'weaken', CT2,
    'A company claims that its new training course makes sales staff more successful. Staff who took the course sold more in the three months after it than in the three months before it.',
    Q_WEAKEN,
    ['The course was run by an experienced trainer.',
      'Staff who did not take the course also sold more over the same months, by the same amount.',
      'Some staff found the course too long.',
      'The course was cheaper than other courses.'],
    1,
    'Sales can rise for reasons that affect everyone, such as the time of year. If staff without the course improved just as much, the rise cannot be credited to the course. The trainer, the length and the price say nothing about whether the course caused the rise.'),
  item('CT-T2-B07', 'fairest', CT2,
    'Priya and Tom discuss whether their city should build more cycle lanes. Tom is against the plan. He says that the lanes would take road space from buses and delivery vans, and that few people in his area cycle.',
    'Which is the fairest summary of Tom\'s view?',
    ['Tom thinks cycling is dangerous and should be banned.',
      'Tom does not care about the environment.',
      'Tom thinks the lanes would take road space from buses and vans, and would be used by few people in his area.',
      'Tom thinks cycle lanes cost too much to build.'],
    2,
    'This summary keeps both of Tom\'s reasons and adds nothing. Banning cycling exaggerates his view, "does not care" attacks Tom rather than stating his view, and cost is not a reason he gave.'),
  item('CT-T2-B08', 'objection', CT2,
    'Omar argues: "Our company should replace all meetings with written updates. Writing takes less time than meeting, and everyone can read the updates when it suits them."',
    Q_OBJECT,
    ['Some meetings are held in large rooms.',
      'Omar has only worked at the company for a year.',
      'Some staff write slowly.',
      'Some decisions need a quick discussion between several people, which written updates do not allow.'],
    3,
    'Meetings exist partly so that people can discuss and decide together. If some decisions need that, replacing all meetings would harm the company\'s work. Slow writers weaken one of Omar\'s reasons only a little, the size of rooms is irrelevant, and Omar\'s time at the company is not a reason against his proposal.'),
];

export const practice = [
  item('CT-T2-P01', 'flaw', CT2,
    'A friend says: "I read three online reviews of this phone, and all of them said the battery was poor. So this phone has the worst battery of any phone on the market."',
    Q_FLAW,
    ['She draws a conclusion about every phone on the market from three reviews of one phone.',
      'She does not say which website the reviews came from.',
      'Battery life is not the most important feature of a phone.',
      'Reviews are written by customers, not by experts.'],
    0,
    'Three reviews of one phone say nothing about how other phones compare, and three is a very small number. The website, the importance of batteries and who wrote the reviews do not repair that gap.'),
  item('CT-T2-P02', 'assumption', CT2,
    'A restaurant owner says: "If we open on Mondays, we will earn more money, because we will have one more day of customers."',
    Q_ASSUME,
    ['Other restaurants are closed on Mondays.',
      'Enough customers will come on Mondays to cover the extra costs of opening, such as staff wages.',
      'Customers prefer to eat out at weekends.',
      'The restaurant has a good reputation.'],
    1,
    'Opening costs money. The owner earns more only if Monday customers bring in more than the extra costs. The other options might matter, but the argument does not depend on any of them.'),
  item('CT-T2-P03', 'fairest', CT2,
    'Ana wants her company to let staff choose their own working hours. She says that people work better when they can fit work around their lives, and that the company would keep its staff for longer.',
    'Which is the fairest summary of Ana\'s view?',
    ['Ana thinks staff should be able to work as little as they like.',
      'Ana thinks managers are not needed.',
      'Ana thinks choosing their own hours would help staff work better and help the company keep its staff.',
      'Ana wants to work fewer hours herself.'],
    2,
    'This summary keeps both of Ana\'s reasons and adds nothing. Choosing when to work is not the same as working as little as one likes, she says nothing about managers, and guessing her personal motive does not state her view.'),
];
