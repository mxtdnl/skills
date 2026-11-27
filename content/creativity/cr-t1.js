// Alternate uses items for Creativity (CR-T1, facets CR1 to CR3; docs/CONSTRUCTS.md section 4). DRAFT.
//
// One object per item. Forms A and B each have one fixed object (audit A-6: the prototype drew one
// of seven objects at random, so its forms were not equivalent). The two objects were chosen to
// be similar in familiarity: both are everyday household containers that most students will have
// handled, with a similar range of ordinary and unusual uses. This is the author's judgement, to
// be checked in the pilot (docs/OPEN-DECISIONS.md). The practice pool uses other objects; a
// practice sitting shows one of them, chosen by the sitting's seed.
//
// Item fields (src/skills/creativity/ideas.js, ideas-score.js; docs/ITEM-BANK.md):
//   kind         "uses"
//   object       the object, as shown to the student ("a cardboard box")
//   objectWords  words naming the object; they count towards the two-word minimum but do not by
//                themselves make an idea ("a box" is not a use)
//   categories   the revised taxonomy for this object, written for this tool (not taken from
//                Guilford, 1967, or any published scoring guide). Each category has an id, a
//                label shown in practice feedback, keywords that place an idea not in the
//                frequency table, and (practice items) a hint suggesting the category. There is
//                no "Other" category: an idea in no category earns no flexibility credit
//   norms        the provisional frequency table for this object, from content/creativity/aut-norms.js
//
// Forms A and B are parallel: 12 categories each; tables of similar size and band mix
// (checked by tests/creativity.test.mjs).

import { AUT_NORMS } from './aut-norms.js';

const cat = (id, label, keywords, hint = null) => ({ id, label, keywords: keywords.split('|'), ...(hint ? { hint } : {}) });
const item = (id, object, objectWords, categories) => ({
  id, status: 'draft', kind: 'uses', object, objectWords, categories, norms: AUT_NORMS[id],
});

export const formA = [
  item('CR-T1-A01', 'a cardboard box', ['cardboard', 'box', 'boxes', 'carton'], [
    cat('store', 'Storing and organising', 'store|storage|keep|organise|sort|collect|hold|file|tidy|container|archive|drawer|holder'),
    cat('carry', 'Carrying, sending and giving', 'move|moving|carry|transport|ship|post|send|deliver|parcel|package|pack|gift|wrap|present|tray'),
    cat('play', 'Play and toys', 'play|toy|toys|game|games|fort|castle|playhouse|den|rocket|car|boat|puppet|maze|tunnel|spaceship|child|children|kids'),
    cat('animals', 'Animals and plants', 'cat|dog|pet|pets|bird|nest|hamster|rabbit|plant|plants|seed|seeds|grow|compost|worm|garden|mulch'),
    cat('furniture', 'Furniture and building', 'table|desk|shelf|shelves|stool|chair|seat|stand|platform|raise|wall|partition|divider|cabinet|footrest|furniture'),
    cat('art', 'Art, craft and display', 'art|paint|painting|canvas|collage|sculpture|craft|model|diorama|frame|stencil|decorate|decoration|display|draw'),
    cat('wear', 'Wearing and dressing up', 'wear|hat|helmet|costume|mask|armour|crown|dress|shoes|glasses'),
    cat('protect', 'Covering and protecting', 'protect|cover|shield|shade|umbrella|rain|sun|mat|floor|kneel|pad|padding|cushion|insulate|insulation|draught|window|shelter'),
    cat('signs', 'Signs and messages', 'sign|placard|poster|notice|message|write|label|banner|protest|board|menu|scoreboard'),
    cat('material', 'Cardboard as a material', 'cut|tear|shred|recycle|fuel|burn|fire|kindling|paper|sheet|flatten|strips|oven|template'),
    cat('sport', 'Sport and movement', 'sled|sledge|slide|ramp|target|goal|skate|dance|exercise|throw|throwing|sport'),
    cat('sound', 'Music and sound', 'drum|instrument|guitar|music|speaker|amplifier|sound|noise|echo'),
  ]),
];

export const formB = [
  item('CR-T1-B01', 'an empty glass jar', ['jar', 'jars', 'empty'], [
    cat('store', 'Storing and organising', 'store|storage|keep|organise|sort|collect|hold|container|holder|pens|buttons|screws'),
    cat('food', 'Food and drink', 'drink|glass|cup|mug|pickle|preserve|jam|ferment|sauce|salad|oats|smoothie|lunch|food|cook|kitchen|leftovers|honey|spices'),
    cat('light', 'Light and candles', 'candle|light|lights|lantern|lamp|glow|tealight'),
    cat('plants', 'Plants and animals', 'plant|plants|flower|flowers|vase|terrarium|cutting|grow|seed|herb|herbs|garden|insect|insects|bug|bugs|spider|fish|snail|butterfly'),
    cat('money', 'Money and saving', 'money|coin|coins|piggy|save|savings|tip|tips|donation|charity|bank'),
    cat('decor', 'Decoration and craft', 'decorate|decoration|paint|art|craft|globe|display|ornament|gift|present|glitter|beads|wedding'),
    cat('tool', 'Using it as a tool', 'roll|rolling|crush|smash|pound|cutter|cut|shape|trace|circle|weight|paperweight|doorstop|hammer|press|mould'),
    cat('science', 'Science and measuring', 'rain|measure|measuring|experiment|science|crystal|magnify|lens|sample|specimen|thermometer'),
    cat('sound', 'Music and sound', 'music|instrument|drum|shaker|rattle|sound|xylophone|chime|bell|tune'),
    cat('memories', 'Memories and messages', 'memory|memories|capsule|message|note|notes|letter|wish|gratitude|keepsake|souvenir|shells|tickets'),
    cat('clean', 'Cleaning and the bathroom', 'soap|dispenser|toothbrush|cotton|bathroom|clean|cleaning|soak|makeup|cosmetics'),
    cat('games', 'Games and play', 'game|games|toy|toys|marbles|dice|play|puzzle|bowling|skittles|target'),
  ]),
];

export const practice = [
  item('CR-T1-P01', 'a pencil', ['pencil', 'pencils'], [
    cat('write', 'Writing and drawing', 'write|writing|draw|drawing|sketch|note|notes|list|sign|mark',
      'The obvious one: what could you write or draw, and for whom?'),
    cat('tool', 'A small tool', 'poke|point|pointer|press|button|stir|mix|wind|lever|hook|reach|scratch|tool',
      'Think of it as a thin, stiff stick. What jobs need one?'),
    cat('body', 'Hair, food and the body', 'hair|bun|chopstick|chopsticks|eat|food|back',
      'Could it be used on your body, or for eating?'),
    cat('sound', 'Music and sound', 'drum|drumstick|tap|beat|rhythm|music|instrument|sound',
      'What sound does it make when you tap it on something?'),
    cat('measure', 'Measuring and lines', 'ruler|measure|measuring|straight|line|length|scale',
      'It is straight and has a fixed length. How could that help?'),
    cat('plants', 'Plants and the garden', 'plant|plants|stake|support|seed|seeds|soil|garden|hole',
      'What could it do in a garden or a plant pot?'),
    cat('games', 'Games and play', 'spin|spinner|game|games|toy|play|dice|throw',
      'Could it be part of a game? Think of spinning, rolling or throwing.'),
    cat('build', 'Building and models', 'build|model|raft|cabin|house|bridge|frame|tower',
      'What could you build with many of them?'),
    cat('material', 'What it is made of', 'wood|wooden|graphite|lead|fire|kindling|burn|zip|lubricate|rub|eraser|rubber',
      'Think about what it is made of: wood, graphite and rubber. What else can they do?'),
  ]),
  item('CR-T1-P02', 'an old towel', ['towel', 'towels', 'old'], [
    cat('clean', 'Cleaning and drying', 'clean|cleaning|wipe|dust|polish|mop|spill|spills|dry|drying|wash|dishes|car',
      'The obvious one: what could you clean or dry with it?'),
    cat('wear', 'Wearing and dressing up', 'wear|cape|costume|skirt|turban|headband|scarf|dress|hat',
      'Could someone wear it? Think of costumes and clothes.'),
    cat('comfort', 'Comfort and sleep', 'pillow|cushion|blanket|mat|bed|sleep|pet|dog|cat|puppy',
      'Could it make someone, or an animal, more comfortable?'),
    cat('protect', 'Protecting and insulating', 'wrap|padding|fragile|protect|draught|door|pipes|insulate|cold|knee|knees|kneel|cover',
      'What could it protect from knocks, cold or dirt?'),
    cat('sport', 'Sport and exercise', 'yoga|exercise|stretch|workout|gym|tug|rope|sport|beach',
      'How could it help with exercise or a sport?'),
    cat('signal', 'Signals and first aid', 'flag|wave|signal|surrender|sling|bandage|arm|help|rescue',
      'Could it send a signal, or help someone who is hurt?'),
    cat('craft', 'Craft and new material', 'rug|rags|rag|stuffing|cut|strips|sew|craft|quilt|toy',
      'If you cut it up, what could the pieces become?'),
    cat('play', 'Play and games', 'play|game|games|tent|den|fort|hide|puppet|ball',
      'How might a child play with it?'),
  ]),
];
