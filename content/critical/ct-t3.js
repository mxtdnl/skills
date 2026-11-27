// Calibration items for Critical thinking (CT-T3, facet CT3; docs/CONSTRUCTS.md section 3). DRAFT.
//
// Two-choice general-knowledge and estimation items, each answered with a confidence rating
// from 50% (a guess) to 100% (certain). On revision items the student then sees new evidence
// and may change their answer and confidence (docs/CONSTRUCTS.md, CT-T3 revision step).
//
// Every answer, and every piece of evidence shown, was checked on 27 November 2026 against the
// sources in `source.urls`. The check was made through a web search whose results quoted these
// pages; the pages themselves could not be opened from the build environment, so a person must
// confirm each source before the items are used (docs/OPEN-DECISIONS.md). Facts that could not be
// confirmed were left out (for example, the area of Europe). Wording avoids figures on which
// sources disagree: every item is decided by a margin larger than the differences between sources.
//
// Item fields (src/skills/critical/calibration.js; docs/ITEM-BANK.md):
//   kind        "comparison" (which of two is larger, longer, ...) or "estimation" (more or less
//               than a stated value)
//   difficulty  intended difficulty, "easier" or "harder": the author's judgement, to be replaced
//               by pilot facility values. Each form has 4 easier and 6 harder items
//   prompt      the question
//   options     the two answers
//   key         index of the correct answer
//   facts       the figures that decide the answer, as given by the sources
//   source      { urls: [...], checked: "2026-11-27", method }
//   revision    null, or { evidence }: new evidence shown after the first answer. The evidence is
//               true, supported by the same sources, and points to the correct answer
//
// Forms A and B are parallel: 10 items each (7 comparison and 3 estimation; 4 easier and 6
// harder; 3 revision items, all harder; keys 5 and 5). Option order is shuffled per item.

const CHECKED = '2026-11-27';
const METHOD = 'web search; answer confirmed by the quoted text of the listed pages, which were not opened directly';
const src = (...urls) => ({ urls, checked: CHECKED, method: METHOD });
const item = (id, kind, difficulty, prompt, options, key, facts, source, revision = null) => ({
  id, status: 'draft', kind, difficulty, prompt, options, key, facts, source, revision,
});

export const formA = [
  item('CT-T3-A01', 'comparison', 'harder',
    'Which moon has the larger diameter?',
    ['Ganymede, a moon of Jupiter', 'Titan, a moon of Saturn'], 0,
    'Ganymede is about 5,260 km across and is the largest moon in the solar system; Titan is about 5,150 km across.',
    src('https://science.nasa.gov/jupiter/jupiter-moons/ganymede/facts/')),
  item('CT-T3-A02', 'comparison', 'harder',
    'On Venus, which takes longer?',
    ['Spinning once on its axis', 'Going once around the Sun'], 0,
    'Venus takes about 243 Earth days to spin once on its axis and about 225 Earth days to orbit the Sun.',
    src('https://spaceplace.nasa.gov/all-about-venus/', 'https://www.britannica.com/place/Venus-planet'),
    { evidence: 'Venus takes about 225 Earth days to go once around the Sun, and about 243 Earth days to spin once on its axis.' }),
  item('CT-T3-A03', 'comparison', 'harder',
    'Which is larger in area?',
    ['Greenland', 'The Democratic Republic of the Congo'], 1,
    'Democratic Republic of the Congo: 2,344,858 km². Greenland: 2,166,086 km².',
    src('https://www.cia.gov/the-world-factbook/field/area/country-comparison', 'https://npr.org/2026/01/07/nx-s1-5668482/greenland-mercator-map-size-distortion'),
    { evidence: 'Most world maps use the Mercator projection. It makes land far from the equator, such as Greenland, look much larger than it really is.' }),
  item('CT-T3-A04', 'comparison', 'harder',
    'Which city is further north?',
    ['Rome', 'New York'], 0,
    'Rome: about 41.9° N. New York City: about 40.7° N.',
    src('https://en.wikipedia.org/wiki/Rome', 'https://en.wikipedia.org/wiki/New_York_City'),
    { evidence: 'Rome lies about 41.9 degrees north of the equator. New York lies about 40.7 degrees north of the equator.' }),
  item('CT-T3-A05', 'comparison', 'harder',
    'Which element makes up a larger share of the Earth\'s crust, by mass?',
    ['Iron', 'Aluminium'], 1,
    'Aluminium: about 8% of the crust by mass. Iron: about 5% to 5.6%, depending on the compilation.',
    src('https://en.wikipedia.org/wiki/Abundance_of_elements_in_Earth%27s_crust', 'https://www.open.edu/openlearn/science-maths-technology/an-introduction-minerals-and-rocks-under-the-microscope/content-section-3.1')),
  item('CT-T3-A06', 'comparison', 'easier',
    'Which has more mass?',
    ['One litre of water', 'One litre of olive oil'], 0,
    'Olive oil has a specific gravity of about 0.915: it is less dense than water and floats on it.',
    src('https://cameochemicals.noaa.gov/chemical/18013')),
  item('CT-T3-A07', 'comparison', 'easier',
    'Which mountain is higher?',
    ['Mont Blanc', 'Kilimanjaro'], 1,
    'Kilimanjaro: about 5,895 m. Mont Blanc: about 4,806 to 4,810 m, depending on the source.',
    src('https://www.britannica.com/science/mountain-landform/Selected-world-mountains')),
  item('CT-T3-A08', 'estimation', 'easier',
    'Light from the Sun takes how long to reach the Earth?',
    ['More than 5 minutes', 'Less than 5 minutes'], 0,
    'About 8 minutes 20 seconds on average (490 to 507 seconds over the year).',
    src('https://howthingsfly.si.edu/ask-an-explainer/how-long-does-it-take-light-sun-get-earth')),
  item('CT-T3-A09', 'estimation', 'harder',
    'Compared with the Earth\'s diameter, the Moon\'s diameter is...',
    ['less than a quarter of it', 'more than a quarter of it'], 1,
    'The Moon is about 3,474 km across, about 27% of the Earth\'s diameter.',
    src('https://starchild.gsfc.nasa.gov/docs/StarChild/solar_system_level1/earth_satellites.html', 'https://www.esa.int/ESA_Multimedia/Images/2021/09/Moon_facts_Size')),
  item('CT-T3-A10', 'estimation', 'easier',
    'The height of Mount Everest is...',
    ['more than 9,000 m', 'less than 9,000 m'], 1,
    '8,848.86 m, the height announced jointly by Nepal and China in 2020.',
    src('https://www.aljazeera.com/news/2020/12/8/mt-everest-nepal-china-announce-revised-height-at-8848-metres')),
];

export const formB = [
  item('CT-T3-B01', 'comparison', 'harder',
    'Which planet has the larger diameter?',
    ['Uranus', 'Neptune'], 0,
    'Uranus: 51,118 km at the equator. Neptune: 49,528 km.',
    src('https://science.nasa.gov/uranus/facts/', 'https://www.britannica.com/place/Neptune-planet/Basic-astronomical-data')),
  item('CT-T3-B02', 'comparison', 'harder',
    'Which gas makes up a larger share of the air?',
    ['Carbon dioxide', 'Argon'], 1,
    'Argon: about 0.93% of dry air by volume, the third most common gas. Carbon dioxide: about 0.04%.',
    src('https://glossary.ametsoc.org/wiki/Argon'),
    { evidence: 'Argon is the third most common gas in dry air, after nitrogen and oxygen.' }),
  item('CT-T3-B03', 'comparison', 'harder',
    'Which is larger in area?',
    ['The Sahara desert', 'Australia'], 0,
    'Sahara: about 8.6 to 9.4 million km², depending on where its edges are drawn. Australia: 7,741,220 km².',
    src('https://en.wikipedia.org/wiki/List_of_deserts_by_area', 'https://www.cia.gov/the-world-factbook/field/area/country-comparison'),
    { evidence: 'The Sahara covers about 9 million square kilometres. Australia covers about 7.7 million square kilometres.' }),
  item('CT-T3-B04', 'comparison', 'harder',
    'Which lake is deeper?',
    ['Lake Tanganyika', 'Lake Baikal'], 1,
    'Lake Baikal: about 1,642 m, the deepest lake in the world. Lake Tanganyika: about 1,470 m.',
    src('https://www.guinnessworldrecords.com/world-records/deepest-lake', 'https://www.worldatlas.com/lakes/the-10-deepest-lakes-in-the-world.html'),
    { evidence: 'Lake Baikal is about 1,640 metres deep at its deepest point. Lake Tanganyika is about 1,470 metres deep.' }),
  item('CT-T3-B05', 'comparison', 'harder',
    'Which country has more people?',
    ['Brazil', 'Nigeria'], 1,
    'United Nations estimates for 2024 (World Population Prospects 2024): Nigeria about 233 million, Brazil about 212 million.',
    src('https://www.un.org/development/desa/pd/world-population-prospects-2024', 'https://www.populationpyramid.net/nigeria/2024/')),
  item('CT-T3-B06', 'comparison', 'easier',
    'At sea level, which boils at a lower temperature?',
    ['Pure ethanol', 'Pure water'], 0,
    'Ethanol boils at about 78 °C; water at 100 °C.',
    src('https://www.engineeringtoolbox.com/ethanol-ethyl-alcohol-properties-C2H6O-d_2027.html')),
  item('CT-T3-B07', 'comparison', 'easier',
    'Which planet has the higher average surface temperature?',
    ['Mercury', 'Venus'], 1,
    'Venus averages about 460 °C, day and night, because of its thick carbon dioxide atmosphere. Mercury reaches about 430 °C by day but falls to about -170 °C at night.',
    src('https://www.livescience.com/space/venus/why-is-venus-hotter-than-mercury-when-mercury-is-closer-to-the-sun')),
  item('CT-T3-B08', 'estimation', 'easier',
    'The distance around the Earth at the equator is...',
    ['less than 50,000 km', 'more than 50,000 km'], 0,
    'About 40,075 km.',
    src('https://www.space.com/17638-how-big-is-earth.html')),
  item('CT-T3-B09', 'estimation', 'easier',
    'The deepest point of the ocean, in the Mariana Trench, is...',
    ['more than 10,000 m deep', 'less than 10,000 m deep'], 0,
    'The Challenger Deep is about 10,935 m to 10,994 m deep, depending on the survey.',
    src('https://www.guinnessworldrecords.com/world-records/deepest-point-in-the-sea', 'https://www.livescience.com/how-deep-is-the-mariana-trench')),
  item('CT-T3-B10', 'estimation', 'harder',
    'Jupiter spins once on its axis in...',
    ['more than 12 hours', 'less than 12 hours'], 1,
    'About 9.9 hours, the shortest day of any planet.',
    src('https://science.nasa.gov/jupiter/facts/')),
];

export const practice = [
  item('CT-T3-P01', 'comparison', 'harder',
    'Which has more bones?',
    ['One human hand, with its wrist', 'One human foot, with its ankle'], 0,
    'Hand and wrist: 27 bones (8 in the wrist). Foot and ankle: 26 bones (7 in the ankle).',
    src('https://www.britannica.com/science/human-skeleton/Hands-and-feet', 'https://www.informedhealth.org/how-do-hands-work.html'),
    { evidence: 'The wrist has 8 bones and the ankle has 7. The rest of the hand and the rest of the foot have the same number of bones.' }),
  item('CT-T3-P02', 'comparison', 'easier',
    'Which country is larger in area?',
    ['Australia', 'Brazil'], 1,
    'Brazil: 8,515,770 km². Australia: 7,741,220 km².',
    src('https://www.cia.gov/the-world-factbook/field/area/country-comparison')),
  item('CT-T3-P03', 'comparison', 'harder',
    'Which metal melts at a higher temperature?',
    ['Iron', 'Copper'], 0,
    'Iron melts at about 1,538 °C; copper at about 1,085 °C.',
    src('https://www.engineeringtoolbox.com/melting-temperature-metals-d_860.html')),
  item('CT-T3-P04', 'estimation', 'easier',
    'The average distance from the Earth to the Moon is...',
    ['less than 300,000 km', 'more than 300,000 km'], 1,
    'About 384,400 km.',
    src('https://starchild.gsfc.nasa.gov/docs/StarChild/solar_system_level1/earth_satellites.html')),
];
