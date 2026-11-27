// Self-report scoring shared by the five skills (scoringVersion 1.0.0-draft; docs/SCORING.md,
// "Self-report"). Pure functions: the same record and items always give the same result, so any
// stored self-report can be re-scored.
//
// Scores are on the response scale, 1 to 5, never 0 to 100 (audit A-8). Negatively keyed items
// are reversed (6 - response). There is no within-person "consistency" statistic (audit C-2) and
// no faking item (audit A-9). Response-quality indicators are recorded for the coach view only;
// they never change a score and are never shown to the student.

/** Points on the agreement scale, in order. Every point is labelled. */
export const AGREEMENT_SCALE = Object.freeze([
  'Strongly disagree',
  'Disagree',
  'Neither agree nor disagree',
  'Agree',
  'Strongly agree',
]);

/** Median time per item below which `fastResponding` is set (build plan S6). */
export const FAST_MEDIAN_MS = 1000;

/**
 * PROVISIONAL: a run of this many identical answers in a row, in the order shown, sets
 * `longRun`. Chosen for 8- and 9-item forms before any pilot data; to be reviewed against pilot
 * data (docs/VALIDATION-PLAN.md).
 */
export const LONG_RUN_MIN = 6;

/** Minimum number of identical valid answers for `straightLining` (fewer cannot show a pattern). */
export const STRAIGHT_LINE_MIN = 3;

const isValid = (v) => Number.isInteger(v) && v >= 1 && v <= 5;
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/**
 * The item score of one valid response: the response itself for a positively keyed item, and
 * 6 minus the response for a negatively keyed item.
 * @param {number} response  integer 1 to 5
 * @param {'+' | '-'} keying
 * @returns {number}
 */
export function keyed(response, keying) {
  if (!isValid(response)) throw new RangeError(`keyed: response must be an integer from 1 to 5, not ${response}`);
  if (keying === '+') return response;
  if (keying === '-') return 6 - response;
  throw new RangeError(`keyed: keying must be "+" or "-", not ${keying}`);
}

/**
 * The screens of a self-report, in the order shown: one screen per facet, facets in order of
 * first appearance in the item list, items in list order; then one screen of retrospective
 * items, if any. Used by the component and by the quality indicators, so both see the same
 * order.
 * @param {{ id: string, facet: string, retrospective?: boolean }[]} items
 * @returns {{ facet: string | null, retrospective: boolean, items: object[] }[]}
 */
export function screensOf(items) {
  const main = new Map();
  const retro = [];
  for (const it of items) {
    if (it.retrospective) { retro.push(it); continue; }
    if (!main.has(it.facet)) main.set(it.facet, []);
    main.get(it.facet).push(it);
  }
  const screens = [...main].map(([facet, list]) => ({ facet, retrospective: false, items: list }));
  if (retro.length) screens.push({ facet: null, retrospective: true, items: retro });
  return screens;
}

/**
 * The latest response to each item, keyed by item ID. A student may change an answer; every
 * change is recorded, and the last one counts.
 * @param {{ itemId: string }[]} responses
 * @returns {Map<string, object>}
 */
export function latestResponses(responses) {
  const latest = new Map();
  for (const r of responses || []) if (r && typeof r.itemId === 'string') latest.set(r.itemId, r);
  return latest;
}

/**
 * Response-quality indicators over the main (not retrospective) items, in the order shown.
 * They describe the pattern of answers; they say nothing about the student's honesty and are
 * never shown to the student.
 * @param {object[]} ordered  main items in the order shown
 * @param {Map<string, object>} latest
 */
export function qualityIndicators(ordered, latest) {
  const values = ordered.map((it) => {
    const r = latest.get(it.id);
    return r && isValid(r.response) ? r.response : null;
  });
  const answered = values.filter((v) => v !== null);

  let longestRun = 0;
  let run = 0;
  let prev = null;
  for (const v of values) {
    if (v === null) { run = 0; prev = null; continue; }
    run = v === prev ? run + 1 : 1;
    prev = v;
    if (run > longestRun) longestRun = run;
  }

  // Time per item. Items on one screen share a shownAt; within a screen, an item's time is
  // the gap from the previous answer on that screen (or from the screen appearing).
  const screens = new Map();
  for (const it of ordered) {
    const r = latest.get(it.id);
    if (!r || !isValid(r.response) || typeof r.rtMs !== 'number' || typeof r.shownAt !== 'string') continue;
    const shown = Date.parse(r.shownAt);
    if (!Number.isFinite(shown)) continue;
    if (!screens.has(r.shownAt)) screens.set(r.shownAt, []);
    screens.get(r.shownAt).push(r.rtMs);
  }
  const perItem = [];
  for (const rts of screens.values()) {
    rts.sort((a, b) => a - b);
    rts.forEach((t, i) => perItem.push(t - (i === 0 ? 0 : rts[i - 1])));
  }
  perItem.sort((a, b) => a - b);
  const n = perItem.length;
  const medianItemMs = n === 0 ? null : n % 2 ? perItem[(n - 1) / 2] : (perItem[n / 2 - 1] + perItem[n / 2]) / 2;

  return {
    items: ordered.length,
    answered: answered.length,
    missing: ordered.length - answered.length,
    straightLining: answered.length >= STRAIGHT_LINE_MIN && answered.every((v) => v === answered[0]),
    medianItemMs,
    fastResponding: medianItemMs !== null && medianItemMs < FAST_MEDIAN_MS,
    longestRun,
    longRun: longestRun >= LONG_RUN_MIN,
  };
}

/**
 * Score a self-report.
 *
 *   facet mean  mean item score of the facet's answered items; null if fewer than half of the
 *               facet's items on the form have a valid answer
 *   skill       mean of the facet means; null if any facet mean is null
 *   retrospective  per facet, the mean of its answered retrospective items (end-of-programme
 *               sittings only); null if none answered. Never part of the skill score
 *
 * @param {{ responses: object[] }} selfReport
 * @param {object[]} items  the items of the form taken (with retrospective items, if shown)
 * @param {string[]} facetCodes  the skill's facets, in manifest order
 * @returns {{ score: Object<string, number | null>, quality: object, retrospective?: Object<string, number | null> }}
 */
export function scoreSelfReport(selfReport, items, facetCodes) {
  const latest = latestResponses(selfReport.responses);
  const main = items.filter((it) => !it.retrospective);
  const retro = items.filter((it) => it.retrospective);
  const score = {};
  for (const code of facetCodes) {
    const facetItems = main.filter((it) => it.facet === code);
    const values = [];
    for (const it of facetItems) {
      const r = latest.get(it.id);
      if (r && isValid(r.response)) values.push(keyed(r.response, it.keying));
    }
    score[code] = facetItems.length > 0 && values.length * 2 >= facetItems.length ? mean(values) : null;
  }
  const facetMeans = facetCodes.map((c) => score[c]);
  score.skill = facetMeans.length && facetMeans.every((v) => v !== null) ? mean(facetMeans) : null;

  const ordered = screensOf(main).flatMap((s) => s.items);
  const result = { score, quality: qualityIndicators(ordered, latest) };
  if (retro.length) {
    result.retrospective = {};
    for (const code of facetCodes) {
      const values = [];
      for (const it of retro.filter((x) => x.facet === code)) {
        const r = latest.get(it.id);
        if (r && isValid(r.response)) values.push(keyed(r.response, it.keying));
      }
      result.retrospective[code] = mean(values);
    }
  }
  return result;
}

/**
 * A skill's self-report score() for its manifest: score(selfReport, items).
 * @param {string[]} facetCodes
 */
export const selfReportScorer = (facetCodes) => (selfReport, items) => scoreSelfReport(selfReport, items, facetCodes);
