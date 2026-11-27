// Frequency tables for CR-T2 Problem finding (docs/SCORING.md, Creativity tasks). DRAFT.
//
// PROVISIONAL, AUTHOR-ESTIMATED, REPLACE WITH PILOT NORMS. No student has answered these items.
// Each band is the author's estimate of how often students would name the problem; it is not a
// measured frequency. Bands, points and entry fields are as in content/creativity/aut-norms.js.

export const STATUS = 'provisional, author-estimated, replace with pilot norms';

const g = (...groups) => groups.map((alts) => alts.split('|'));
const e = (id, category, freq, match, example) => ({ id, category, freq, match, example });

export const PROBLEM_NORMS = {
  // Form A: sharing a flat with other students for the first time
  'CR-T2-A01': [
    e('flat-bills', 'money', 'common', g('bill|bills|rent|cost|costs|expensive|afford|pay|paying|money'), 'high bills in winter'),
    e('flat-owe', 'money', 'occasional', g('owe|owes|debt|late|forget|refuse', 'pay|money|rent|share|bills'), 'someone forgets to pay their share'),
    e('flat-deposit', 'money', 'rare', g('deposit'), 'losing the deposit because of damage'),
    e('flat-cleaning', 'chores', 'common', g('clean|cleaning|mess|messy|untidy|tidy|chores|chore|housework'), 'flatmates who never clean'),
    e('flat-dishes', 'chores', 'common', g('dishes|washing up|plates'), 'dirty dishes left in the sink'),
    e('flat-rubbish', 'chores', 'occasional', g('rubbish|bin|bins|trash|garbage|recycling'), 'nobody takes the rubbish out'),
    e('flat-noise', 'noise', 'common', g('noise|noisy|loud|music'), 'loud music late at night'),
    e('flat-sleep', 'noise', 'occasional', g('sleep|sleeping|wake|woken', 'different|times|schedule|night|morning|early|late'), 'different sleep times'),
    e('flat-party', 'noise', 'occasional', g('party|parties'), 'flatmates having parties before exams'),
    e('flat-privacy', 'privacy', 'common', g('privacy|private|alone|personal space|space'), 'not enough privacy'),
    e('flat-guests', 'privacy', 'occasional', g('guest|guests|visitor|visitors|boyfriend|girlfriend|partner|friends over|overnight'), 'guests who stay too long'),
    e('flat-bathroom', 'privacy', 'occasional', g('bathroom|shower|toilet', 'queue|wait|waiting|share|sharing|busy|morning'), 'waiting for the bathroom in the morning'),
    e('flat-food', 'food', 'common', g('food|groceries|milk', 'steal|stealing|eat|eating|taken|take|missing'), 'flatmates eating your food'),
    e('flat-fridge', 'food', 'occasional', g('fridge|cupboard|kitchen|space|shelf'), 'not enough space in the fridge'),
    e('flat-diet', 'food', 'rare', g('vegetarian|vegan|halal|kosher|allergy|allergies|diet'), 'different diets sharing one kitchen'),
    e('flat-smell', 'food', 'rare', g('smell|smells|cooking smells'), 'strong cooking smells'),
    e('flat-argue', 'conflict', 'common', g('argue|argument|arguments|conflict|conflicts|fight|fights|disagree|disagreement|tension'), 'arguments between flatmates'),
    e('flat-getalong', 'conflict', 'occasional', g('get along|get on|personality|personalities|annoying|rude|clash'), 'personalities that clash'),
    e('flat-communication', 'conflict', 'rare', g('communicate|communication|talk|say|tell|honest', 'problem|problems|feel|feelings|nobody|afraid|hard|difficult'), 'being afraid to tell a flatmate about a problem'),
    e('flat-landlord', 'rules', 'occasional', g('landlord|agent|agency|owner', 'repair|repairs|fix|slow|problem|problems|ignore|ignores|contact'), 'the landlord is slow to fix repairs'),
    e('flat-contract', 'rules', 'rare', g('contract|lease|tenancy|agreement|sign'), 'not understanding the contract before signing it'),
    e('flat-rules', 'rules', 'occasional', g('rules|rota|agree|agreement', 'house|flat|chores|cleaning|clear|no'), 'no clear house rules'),
    e('flat-keys', 'safety', 'occasional', g('key|keys|lock|locked|door', 'lost|lose|leave|open|unlocked'), 'someone leaves the door unlocked'),
    e('flat-theft', 'safety', 'rare', g('theft|stolen|steal|burglary|burgled|valuables|belongings'), 'belongings being stolen'),
    e('flat-fire', 'safety', 'rare', g('fire|alarm|smoke|cooker|oven|candle|candles'), 'someone leaving the cooker on'),
    e('flat-study', 'study', 'occasional', g('study|studying|concentrate|concentration|focus|exam|exams|work|homework|assignment'), 'hard to concentrate on studying'),
    e('flat-wifi', 'utilities', 'occasional', g('wifi|internet|broadband|connection'), 'slow wifi with everyone online'),
    e('flat-heating', 'utilities', 'occasional', g('heating|heat|temperature|cold|warm|thermostat'), 'disagreeing about the heating'),
    e('flat-laundry', 'utilities', 'rare', g('laundry|washing machine|dryer|clothes'), 'clothes left in the washing machine'),
    e('flat-lonely', 'wellbeing', 'occasional', g('lonely|loneliness|homesick|isolated|left out|excluded'), 'feeling left out by the others'),
    e('flat-ill', 'wellbeing', 'rare', g('ill|illness|sick|germs|cold|flu|virus|health'), 'illness spreading through the flat'),
    e('flat-stress', 'wellbeing', 'rare', g('stress|stressed|anxiety|anxious|mental health|tired'), 'stress from constant small conflicts'),
    e('flat-pests', 'chores', 'rare', g('mice|mouse|pests|pest|cockroach|cockroaches|ants|insects|mould|mold|damp'), 'mould and pests from food left out'),
    e('flat-post', 'safety', 'rare', g('post|mail|parcel|parcels|deliveries|delivery|letters'), 'parcels and letters going missing'),
    e('flat-leaving', 'rules', 'rare', g('leave|leaves|leaving|moves out|move out|replace|replacement', 'early|year|middle|halfway|term'), 'someone moves out in the middle of the year'),
    e('flat-culture', 'culture', 'occasional', g('culture|cultural|cultures|language|languages|religion|religious|customs|background|backgrounds'), 'cultural differences causing misunderstandings'),
    e('flat-habits', 'culture', 'occasional', g('habit|habits|lifestyle|lifestyles|smoking|smoke|routine|routines'), 'very different daily habits'),
  ],

  // Form B: starting a part-time job while studying full time
  'CR-T2-B01': [
    e('job-time', 'time', 'common', g('time|busy|balance|balancing|juggle|juggling|manage|managing'), 'not enough time for everything'),
    e('job-deadline', 'time', 'occasional', g('deadline|deadlines|late|behind|catch up'), 'missing assignment deadlines'),
    e('job-grades', 'study', 'common', g('grade|grades|marks|fail|failing|results|performance'), 'grades getting worse'),
    e('job-classes', 'study', 'common', g('class|classes|lecture|lectures|seminar|seminars|lesson|lessons', 'miss|missing|skip|clash|clashes'), 'missing lectures because of work'),
    e('job-studytime', 'study', 'occasional', g('study|studying|revise|revision|homework|reading|coursework|exam|exams'), 'less time to revise for exams'),
    e('job-tired', 'health', 'common', g('tired|exhausted|exhaustion|fatigue|energy'), 'being exhausted in the mornings'),
    e('job-sleep', 'health', 'occasional', g('sleep|sleeping|rest'), 'not getting enough sleep'),
    e('job-stress', 'health', 'occasional', g('stress|stressed|stressful|burnout|burn out|anxiety|pressure|mental health'), 'stress and burnout'),
    e('job-eat', 'health', 'rare', g('eat|eating|meals|food|diet|exercise|gym'), 'no time to cook or eat properly'),
    e('job-pay', 'money', 'occasional', g('pay|paid|wage|wages|salary|money', 'low|late|unfair|wrong|less|underpaid|enough'), 'low pay for the hours worked'),
    e('job-tax', 'money', 'rare', g('tax|taxes|payslip|national insurance|bank account'), 'not understanding tax on their pay'),
    e('job-benefit', 'money', 'rare', g('scholarship|grant|loan|benefits|allowance'), 'earning too much for a grant or allowance'),
    e('job-visa', 'rights', 'occasional', g('visa|permit|immigration|allowed', 'hours|work|limit|rules|working'), 'visa rules on how many hours they can work'),
    e('job-contract', 'rights', 'occasional', g('contract|rights|legal|law|illegal|unfair|exploit|exploited'), 'an employer ignoring their rights'),
    e('job-break', 'rights', 'rare', g('break|breaks|holiday|holidays|overtime|unpaid'), 'unpaid overtime'),
    e('job-boss', 'people', 'occasional', g('manager|boss|supervisor|employer', 'difficult|strict|unfair|understand|understanding|flexible|demanding'), 'a manager who does not understand exam periods'),
    e('job-colleagues', 'people', 'occasional', g('colleague|colleagues|coworker|coworkers|team|staff'), 'not getting on with colleagues'),
    e('job-harass', 'people', 'rare', g('harass|harassment|bully|bullying|discrimination|discriminate'), 'harassment at work'),
    e('job-customers', 'work', 'occasional', g('customer|customers|client|clients|public', 'rude|difficult|angry|complaints|complain'), 'dealing with rude customers'),
    e('job-boring', 'work', 'occasional', g('boring|repetitive|dull|unrelated|pointless|meaningless'), 'boring and repetitive tasks'),
    e('job-training', 'work', 'rare', g('training|mistake|mistakes|skills|experience|new|learn', 'lack|no|little|without|make|making|first'), 'no training at the start'),
    e('job-language', 'work', 'rare', g('language|english|accent'), 'working in a language they are still learning'),
    e('job-commute', 'travel', 'occasional', g('commute|commuting|travel|travelling|traveling|transport|bus|train|far|distance'), 'a long commute between work and campus'),
    e('job-night', 'travel', 'rare', g('night|dark|late', 'home|travel|safe|safety|walk|walking'), 'travelling home late at night'),
    e('job-friends', 'social', 'common', g('friend|friends|social|socialise|socializing|socialising|fun|party|parties|events|nights out'), 'missing nights out with friends'),
    e('job-societies', 'social', 'rare', g('club|clubs|society|societies|sport|sports|team|volunteer|activities'), 'missing sports club training'),
    e('job-family', 'social', 'rare', g('family|parents|partner|relationship|relationships|home'), 'less time to call family at home'),
    e('job-shifts', 'shifts', 'occasional', g('shift|shifts|rota|roster|schedule|schedules|hours', 'change|changes|changing|unpredictable|last minute|short notice|weekend|weekends|irregular|late'), 'shifts that change at short notice'),
    e('job-weekend', 'shifts', 'occasional', g('weekend|weekends|evening|evenings|night shifts'), 'working every weekend'),
    e('job-injury', 'safety', 'rare', g('injury|injured|accident|accidents|dangerous|hazard|hurt|unsafe|safety'), 'getting hurt in an unsafe workplace'),
    e('job-standing', 'safety', 'rare', g('standing|stand|lifting|heavy|back pain|feet'), 'standing for hours with back pain'),
    e('job-career', 'future', 'occasional', g('career|cv|resume|future|degree|graduate|graduation'), 'a job that does not help their future career'),
    e('job-priorities', 'future', 'rare', g('priority|priorities|quit|drop out|dropout|motivation|give up|choose'), 'losing motivation to finish the course'),
    e('job-holidays', 'future', 'rare', g('internship|internships|placement|placements|summer'), 'no time to apply for internships'),
  ],

  // Practice: organising a weekend trip with friends on a small budget
  'CR-T2-P01': [
    e('trip-money', 'money', 'common', g('money|budget|expensive|cost|costs|afford|price|prices'), 'everything costs more than expected'),
    e('trip-split', 'money', 'occasional', g('split|share|owe|pay|paying', 'cost|costs|bill|bills|money|back|fair|fairly'), 'deciding how to split the costs fairly'),
    e('trip-transport', 'transport', 'common', g('transport|train|trains|bus|buses|car|drive|driving|flight|flights|travel|tickets'), 'finding cheap transport'),
    e('trip-stay', 'stay', 'common', g('accommodation|hostel|hotel|stay|room|rooms|booking|book|camp|camping|sleep'), 'finding somewhere cheap to stay'),
    e('trip-dates', 'planning', 'common', g('date|dates|when|day|days|weekend|free|available|schedule'), 'agreeing on a date everyone is free'),
    e('trip-dropout', 'planning', 'occasional', g('cancel|cancels|cancelled|drop out|drops out|pull out|change|changes', 'last minute|plan|plans|someone|friend|minute'), 'someone cancels at the last minute'),
    e('trip-decide', 'group', 'common', g('agree|decide|decision|choose|disagree|argue|argument', 'where|destination|activities|plan|plans|what'), 'friends cannot agree where to go'),
    e('trip-leader', 'group', 'rare', g('organise|organising|lead|leader|responsible|one person', 'work|alone|stress|unfair|planning|all'), 'one person ends up doing all the planning'),
    e('trip-food', 'food', 'occasional', g('food|eat|eating|meals|restaurant|restaurants|cook|cooking|diet'), 'eating out is too expensive'),
    e('trip-weather', 'weather', 'occasional', g('weather|rain|storm|cold|snow|heat'), 'bad weather spoils the plans'),
    e('trip-safety', 'safety', 'rare', g('lost|safety|safe|danger|dangerous|stolen|theft|phone|passport'), 'someone loses their phone or passport'),
    e('trip-health', 'health', 'rare', g('ill|sick|injury|injured|hurt|medicine|insurance|allergy'), 'nobody has travel insurance if someone is ill'),
    e('trip-docs', 'documents', 'rare', g('passport|visa|id|identity|documents|border'), 'a friend needs a visa for the trip'),
    e('trip-study', 'planning', 'rare', g('study|exam|exams|assignment|deadline|deadlines|work|shift|shifts'), 'the trip clashes with a deadline'),
  ],
};
