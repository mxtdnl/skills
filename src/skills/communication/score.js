// Scoring for the communication tasks (docs/SCORING.md, Communication tasks; scoringVersion
// 1.3.0-draft). Pure functions of the attempt's raw responses and the form's items.
//
// The legacy Message Editing formulas (keyword matching, "concision", "specificity", "novelty";
// audit A-7, B-1, E-1) are not used and nothing is ported from them. The receptive tasks (CM-T1,
// CM-T2) are scored only from which options were chosen, so English spelling, grammar and word
// choice never enter a score. The rewrite (CM-T3) has no automated score at all.
//
//   CM-T1 Which is clearer?  Two parts per pair, each scored right or wrong: the clearer version
//                            (chance 1/2) and the reason (four options, chance 1/4).
//   CM-T2 Spot the problem   Two parts per passage, each all-or-nothing: the sentence (five, chance
//                            1/5) and the kind of problem (five, chance 1/5). The kind is credited
//                            whether or not the sentence is right (parts are independent).
//   CM-T3 Rewrite            Text and self-check stored; score null; coachScorable flag.
//
// For CM-T1 and CM-T2 each facet score is the proportion of points gained on that facet's items
// (two points per item), from 0 to 1. Unanswered items count as wrong (the denominator is the
// number of items on the form); the latest response to an item counts. Each part's proportion
// correct over the whole form is reported beside the facet scores; nothing is weighted.

export const FACETS = Object.freeze(['CM1', 'CM2', 'CM3']);

/** Latest response per item ID. */
function latestById(itemResponses) {
  const latest = new Map();
  for (const r of itemResponses || []) if (r && typeof r.itemId === 'string') latest.set(r.itemId, r.response);
  return latest;
}

/**
 * Shared two-part scorer.
 * @param {object[]} form
 * @param {Map<string, any>} latest
 * @param {[string, (item: object, r: any) => boolean][]} parts  [name, isCorrect]
 */
function twoPart(form, latest, parts) {
  const points = Object.fromEntries(FACETS.map((f) => [f, 0]));
  const counts = Object.fromEntries(FACETS.map((f) => [f, 0]));
  const partRight = Object.fromEntries(parts.map(([name]) => [name, 0]));
  for (const item of form) {
    const r = latest.get(item.id);
    if (counts[item.facet] === undefined) throw new RangeError(`communication score: unknown facet ${item.facet} on ${item.id}`);
    counts[item.facet] += 1;
    for (const [name, isCorrect] of parts) {
      if (r && typeof r === 'object' && isCorrect(item, r)) {
        partRight[name] += 1;
        points[item.facet] += 1;
      }
    }
  }
  const n = form.length;
  const score = {};
  for (const f of FACETS) score[f] = counts[f] ? points[f] / (parts.length * counts[f]) : null;
  for (const [name] of parts) score[name] = n ? partRight[name] / n : null;
  const rawScore = Object.values(points).reduce((a, b) => a + b, 0);
  return { rawScore, score };
}

/**
 * CM-T1. Response: { version, reason, reasonPosition, reasonOrder } (original indices).
 * @param {{ itemResponses: { itemId: string, response: any }[] }} attempt
 * @param {{ id: string, facet: string, key: number, reasonKey: number }[]} form
 * @returns {{ rawScore: number, score: Object<string, number | null> }}
 */
export function scoreClearer(attempt, form) {
  return twoPart(form, latestById(attempt.itemResponses), [
    ['version', (item, r) => Number.isInteger(r.version) && r.version === item.key],
    ['reason', (item, r) => Number.isInteger(r.reason) && r.reason === item.reasonKey],
  ]);
}

/**
 * CM-T2. Response: { sentence, problem, problemPosition, problemOrder } (sentence index; problem
 * code from PROBLEM_CODES in content/communication/cm-t2.js).
 * @param {{ itemResponses: { itemId: string, response: any }[] }} attempt
 * @param {{ id: string, facet: string, key: number, problem: string }[]} form
 * @returns {{ rawScore: number, score: Object<string, number | null> }}
 */
export function scoreSpot(attempt, form) {
  return twoPart(form, latestById(attempt.itemResponses), [
    ['sentence', (item, r) => Number.isInteger(r.sentence) && r.sentence === item.key],
    ['problem', (item, r) => typeof r.problem === 'string' && r.problem === item.problem],
  ]);
}

/**
 * The rewrite of an attempt: the latest response to one of the form's items.
 * @returns {{ itemId: string | null, text: string, final: boolean, selfCheck: Object<string, string> | null }}
 */
export function latestRewrite(attempt, form) {
  const ids = new Set(form.map((it) => it.id));
  const last = [...(attempt.itemResponses || [])].reverse().find((r) => r && ids.has(r.itemId));
  const r = last && last.response && typeof last.response === 'object' ? last.response : null;
  return {
    itemId: last ? last.itemId : null,
    text: r && typeof r.text === 'string' ? r.text : '',
    final: Boolean(r && r.final === true),
    selfCheck: r && r.selfCheck && typeof r.selfCheck === 'object' ? r.selfCheck : null,
  };
}

/**
 * CM-T3. No automated quality score (audit/BUILD-PLAN.md S9): rawScore and score are null. The
 * attempt is coach-scorable when it holds a finished, non-empty rewrite.
 * @returns {{ rawScore: null, score: null, coachScorable: boolean }}
 */
export function scoreRewrite(attempt, form) {
  const r = latestRewrite(attempt, form);
  return { rawScore: null, score: null, coachScorable: r.final && r.text.trim().length > 0 };
}
