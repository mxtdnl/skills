// Frequency tables for CR-T1 Alternate uses (docs/SCORING.md, Creativity tasks). DRAFT.
//
// PROVISIONAL, AUTHOR-ESTIMATED, REPLACE WITH PILOT NORMS. No student has answered these items.
// Each band is the author's estimate of how often students would give the use; it is not a
// measured frequency. The pilot replaces every band with the observed proportion of students
// giving the use (docs/VALIDATION-PLAN.md; docs/OPEN-DECISIONS.md).
//
// Bands and originality points (src/skills/creativity/ideas-score.js, BAND_POINTS):
//   common      expected from at least 1 student in 10           0 points
//   occasional  expected from about 1 to 10 students in 100      1 point
//   rare        expected from fewer than 1 student in 50         2 points
// A valid use that matches no entry scores 2 if it falls in one of the object's categories and 1
// if it does not (docs/SCORING.md).
//
// Entry fields:
//   id        stable entry ID (never reused; stored scores refer to it only through re-scoring)
//   category  category ID from the item's taxonomy (content/creativity/cr-t1.js)
//   freq      "common", "occasional" or "rare"
//   match     word groups: a use matches the entry if it contains at least one alternative from
//             every group, as whole words after normalising and stemming ("storing" matches
//             "store"; "colour" matches "color"). Never matched by substring
//   example   a use that matches the entry (checked by tests/creativity.test.mjs)

export const STATUS = 'provisional, author-estimated, replace with pilot norms';

const g = (...groups) => groups.map((alts) => alts.split('|'));
const e = (id, category, freq, match, example) => ({ id, category, freq, match, example });

export const AUT_NORMS = {
  // Form A: a cardboard box
  'CR-T1-A01': [
    e('box-store', 'store', 'common', g('store|storage|keep|organise'), 'store old clothes'),
    e('box-files', 'store', 'occasional', g('file|files|documents|paperwork|papers|receipts'), 'file old papers and receipts'),
    e('box-move', 'carry', 'common', g('move|moving|pack|packing|relocate', 'house|home|flat|belongings|room'), 'pack your things when moving house'),
    e('box-post', 'carry', 'common', g('post|send|ship|mail|parcel|package|deliver|delivery'), 'send a parcel by post'),
    e('box-gift', 'carry', 'common', g('gift|present|wrap|wrapping'), 'wrap a birthday present'),
    e('box-carry', 'carry', 'occasional', g('carry|transport|tray|trolley'), 'carry shopping home'),
    e('box-fort', 'play', 'common', g('fort|castle|den|playhouse|play house|hideout'), 'build a fort for children'),
    e('box-vehicle', 'play', 'occasional', g('car|rocket|spaceship|boat|train|plane|ship'), 'make a toy car for a child'),
    e('box-puppet', 'play', 'rare', g('puppet|puppets|theatre|theater|stage'), 'make a puppet theatre'),
    e('box-maze', 'play', 'rare', g('maze|tunnel|marble run|marble'), 'build a marble run'),
    e('box-pet', 'animals', 'common', g('cat|kitten|dog|puppy|pet|hamster|rabbit', 'bed|house|home|sleep|shelter|hide'), 'make a bed for a cat'),
    e('box-compost', 'animals', 'rare', g('compost|mulch|worm|worms|weeds'), 'add it to the compost heap'),
    e('box-seedlings', 'animals', 'rare', g('seed|seeds|seedling|seedlings|sprout'), 'grow seedlings in it'),
    e('box-table', 'furniture', 'common', g('table|desk'), 'a small table in a bedroom'),
    e('box-shelf', 'furniture', 'occasional', g('shelf|shelves|bookcase|bookshelf'), 'stack them as a bookshelf'),
    e('box-seat', 'furniture', 'occasional', g('stool|chair|seat|sit'), 'sit on it as a stool'),
    e('box-laptop', 'furniture', 'occasional', g('laptop|computer|monitor', 'stand|raise|lift|higher|level'), 'raise a laptop to eye level'),
    e('box-divider', 'furniture', 'rare', g('divider|partition|wall|separate'), 'make a wall to divide a room'),
    e('box-paint', 'art', 'occasional', g('paint|painting|canvas|draw|drawing|picture'), 'paint a picture on it'),
    e('box-model', 'art', 'occasional', g('model|sculpture|diorama|miniature'), 'build a model city'),
    e('box-stencil', 'art', 'rare', g('stencil|template'), 'cut out a stencil for painting'),
    e('box-hat', 'wear', 'occasional', g('hat|helmet|crown|mask'), 'wear it as a hat'),
    e('box-costume', 'wear', 'occasional', g('costume|dress up|dressing up|robot|armour|armor'), 'make a robot costume'),
    e('box-floor', 'protect', 'occasional', g('floor|carpet|table|surface', 'protect|cover|mat|spill|spills'), 'protect the floor while painting'),
    e('box-rain', 'protect', 'occasional', g('rain|sun|shade|umbrella'), 'hold it over your head in the rain'),
    e('box-kneel', 'protect', 'rare', g('kneel|knees|kneeling|knee'), 'kneel on it while gardening'),
    e('box-insulate', 'protect', 'rare', g('insulate|insulation|draught|draft|cold'), 'insulate a window against the cold'),
    e('box-sign', 'signs', 'occasional', g('sign|placard|poster|banner'), 'write a protest sign'),
    e('box-board', 'signs', 'rare', g('scoreboard|menu|noticeboard|calendar|whiteboard|chart'), 'make a scoreboard for a game'),
    e('box-recycle', 'material', 'common', g('recycle|recycling|recycled'), 'recycle the cardboard'),
    e('box-fire', 'material', 'occasional', g('fire|burn|kindling|fuel|barbecue|bonfire'), 'help to start a fire'),
    e('box-padding', 'material', 'rare', g('shred|shredded|padding|packing material|stuffing'), 'shred it as padding for parcels'),
    e('box-oven', 'material', 'rare', g('oven|solar|cooker'), 'make a solar oven'),
    e('box-sled', 'sport', 'occasional', g('sled|sledge|toboggan|slide|sliding'), 'slide down a hill on it'),
    e('box-target', 'sport', 'rare', g('target|goal|dartboard|archery'), 'a target for throwing practice'),
    e('box-drum', 'sound', 'occasional', g('drum|drums|percussion|instrument'), 'play it like a drum'),
    e('box-speaker', 'sound', 'rare', g('speaker|amplifier|amplify|louder|echo'), 'make phone music sound louder'),
  ],

  // Form B: an empty glass jar
  'CR-T1-B01': [
    e('jar-store', 'store', 'common', g('store|storage|keep|organise'), 'store dry pasta'),
    e('jar-pens', 'store', 'common', g('pen|pens|pencil|pencils|brush|brushes|toothbrush'), 'hold pens on a desk'),
    e('jar-small', 'store', 'occasional', g('button|buttons|screw|screws|nail|nails|bead|beads|hairpin|hairpins'), 'sort screws and nails'),
    e('jar-drink', 'food', 'common', g('drink|drinking|glass|cup|mug'), 'drink water from it'),
    e('jar-preserve', 'food', 'common', g('jam|pickle|pickles|preserve|preserves|ferment|chutney|sauerkraut|kimchi'), 'make homemade jam'),
    e('jar-lunch', 'food', 'occasional', g('lunch|leftovers|salad|oats|soup|smoothie'), 'carry salad for lunch'),
    e('jar-shake', 'food', 'rare', g('dressing|whisk|cream|butter|mix'), 'shake salad dressing in it'),
    e('jar-candle', 'light', 'common', g('candle|candles|tealight|tea light|lantern'), 'hold a candle'),
    e('jar-lamp', 'light', 'occasional', g('fairy lights|light|lights|lamp|night light|glow'), 'make a lamp with fairy lights'),
    e('jar-vase', 'plants', 'common', g('vase|flower|flowers'), 'use it as a flower vase'),
    e('jar-terrarium', 'plants', 'occasional', g('terrarium|moss|succulent|succulents|mini garden'), 'build a small terrarium'),
    e('jar-grow', 'plants', 'occasional', g('cutting|cuttings|herb|herbs|propagate|roots|sprout'), 'grow herbs on a windowsill'),
    e('jar-insects', 'plants', 'occasional', g('insect|insects|bug|bugs|spider|butterfly|caterpillar|firefly|fireflies|tadpole|snail'), 'catch insects to look at'),
    e('jar-fish', 'plants', 'rare', g('fish|goldfish|shrimp|aquarium'), 'keep a small fish'),
    e('jar-money', 'money', 'common', g('money|coin|coins|savings|save|saving|piggy bank|tip|tips|change'), 'save coins in it'),
    e('jar-donate', 'money', 'occasional', g('donation|donations|charity|collection|fundraising|swear'), 'collect money for a charity'),
    e('jar-paint', 'decor', 'occasional', g('paint|painted|decorate|decorated|glitter'), 'paint it as a decoration'),
    e('jar-globe', 'decor', 'occasional', g('snow globe|snowglobe|globe'), 'make a snow globe'),
    e('jar-gift', 'decor', 'occasional', g('gift|present'), 'fill it with sweets as a gift'),
    e('jar-sand', 'decor', 'rare', g('sand art|layered|layers'), 'make layered sand art'),
    e('jar-roll', 'tool', 'occasional', g('rolling pin|roll out|dough|pastry'), 'roll out pastry'),
    e('jar-cutter', 'tool', 'rare', g('cutter|cookie|cookies|biscuit|biscuits|circles'), 'cut out biscuits with the rim'),
    e('jar-crush', 'tool', 'rare', g('crush|smash|pound|grind|garlic|nuts'), 'crush garlic'),
    e('jar-weight', 'tool', 'occasional', g('paperweight|weight|doorstop|weigh down'), 'weigh down papers on a windy day'),
    e('jar-rain', 'science', 'rare', g('rain|rainfall|rain gauge'), 'measure how much rain falls'),
    e('jar-experiment', 'science', 'occasional', g('experiment|experiments|science|crystal|crystals|volcano'), 'grow crystals for a science experiment'),
    e('jar-magnify', 'science', 'rare', g('magnify|magnifying|lens|magnifier'), 'fill it with water to magnify small print'),
    e('jar-capsule', 'memories', 'occasional', g('time capsule|capsule|bury'), 'bury a time capsule'),
    e('jar-notes', 'memories', 'occasional', g('memory|memories|gratitude|wish|wishes|note|notes|message|messages|letter|letters'), 'collect happy memories written on notes'),
    e('jar-souvenir', 'memories', 'occasional', g('shell|shells|souvenir|souvenirs|beach|pebbles|tickets'), 'keep shells from a holiday'),
    e('jar-shaker', 'sound', 'occasional', g('shaker|rattle|maraca|instrument|drum|musical'), 'fill with rice to make a shaker'),
    e('jar-tune', 'sound', 'rare', g('xylophone|chime|chimes|tune|tunes|melody'), 'fill jars with water to play a tune'),
    e('jar-soap', 'clean', 'occasional', g('soap|dispenser|shampoo|lotion|cotton|makeup|cosmetics'), 'make a soap dispenser'),
    e('jar-soak', 'clean', 'rare', g('clean|cleaning|soak|detergent|bleach'), 'soak paintbrushes to clean them'),
    e('jar-marbles', 'games', 'occasional', g('marble|marbles|dice|game|games|toy|toys|counters'), 'keep marbles for a game'),
    e('jar-target', 'games', 'rare', g('bowling|skittle|skittles|ring toss|target'), 'line them up as skittles for bowling'),
  ],

  // Practice: a pencil
  'CR-T1-P01': [
    e('pencil-write', 'write', 'common', g('write|writing|draw|drawing|sketch|note|notes'), 'write a shopping list'),
    e('pencil-hair', 'body', 'common', g('hair|bun'), 'hold your hair in a bun'),
    e('pencil-chopstick', 'body', 'occasional', g('chopstick|chopsticks|eat'), 'eat noodles with two of them'),
    e('pencil-poke', 'tool', 'common', g('poke|point|pointer|press|button|buttons'), 'press small buttons'),
    e('pencil-stir', 'tool', 'occasional', g('stir|mix|stirring'), 'stir paint'),
    e('pencil-tape', 'tool', 'rare', g('cassette|tape|rewind|wind'), 'wind an old cassette tape'),
    e('pencil-drum', 'sound', 'occasional', g('drum|drumstick|drumsticks|tap|beat|rhythm'), 'tap out a rhythm like a drumstick'),
    e('pencil-ruler', 'measure', 'occasional', g('ruler|measure|measuring|straight line|straight edge'), 'measure small things'),
    e('pencil-stake', 'plants', 'occasional', g('plant|plants', 'stake|support|prop|hold|stick'), 'a stake to support a small plant'),
    e('pencil-seed', 'plants', 'rare', g('hole|holes', 'seed|seeds|soil'), 'make holes in soil for seeds'),
    e('pencil-spin', 'games', 'occasional', g('spin|spinner|game|games|spinning'), 'spin it to choose who goes first'),
    e('pencil-build', 'build', 'occasional', g('build|model|raft|cabin|house|bridge'), 'build a model raft'),
    e('pencil-fire', 'material', 'rare', g('fire|kindling|burn'), 'kindling for a fire'),
    e('pencil-zip', 'material', 'rare', g('zip|zipper|lock|lubricate'), 'rub the lead on a stuck zip to free it'),
  ],

  // Practice: an old towel
  'CR-T1-P02': [
    e('towel-clean', 'clean', 'common', g('clean|cleaning|wipe|dust|polish|mop|spill|spills'), 'wipe up spills'),
    e('towel-car', 'clean', 'occasional', g('car|bike|bicycle|windows|window'), 'wash the car'),
    e('towel-dry', 'clean', 'common', g('dry|drying|dishes|hands'), 'dry the dishes'),
    e('towel-cape', 'wear', 'occasional', g('cape|costume|skirt|turban|headband|scarf|dress up'), 'a superhero cape for a child'),
    e('towel-pillow', 'comfort', 'occasional', g('pillow|cushion|blanket'), 'roll it up as a pillow'),
    e('towel-pet', 'comfort', 'occasional', g('pet|cat|dog|puppy|kitten|animal'), 'a bed for a new puppy'),
    e('towel-wrap', 'protect', 'occasional', g('wrap|padding|fragile|glass|plates|protect'), 'wrap fragile plates when moving'),
    e('towel-draught', 'protect', 'rare', g('draught|draft|door|pipes|insulate|cold'), 'stop a draught under a door'),
    e('towel-knee', 'protect', 'rare', g('knee|knees|kneel|kneeling'), 'kneel on it while cleaning the floor'),
    e('towel-yoga', 'sport', 'occasional', g('yoga|exercise|stretch|stretching|workout'), 'a mat for yoga'),
    e('towel-tug', 'sport', 'rare', g('tug|rope|tug of war'), 'play tug of war'),
    e('towel-flag', 'signal', 'occasional', g('flag|wave|waving|signal|surrender'), 'wave it as a flag'),
    e('towel-sling', 'signal', 'rare', g('sling|arm|bandage'), 'make a sling for an injured arm'),
    e('towel-rag', 'craft', 'rare', g('rag rug|rug|rags|stuffing|cut up|strips'), 'cut it into strips for a rag rug'),
  ],
};
