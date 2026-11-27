// Optional language-model rubric scorer for the communication rewrite (CM-T3). DISABLED. It makes
// no network call. Same pattern as src/skills/creativity/llm-scorer.js (S8).
//
// Why it exists: CM-T3 is stored without an automated quality score (audit/BUILD-PLAN.md S9). A
// coach can score it with the five-point checklist (content/communication/cm-t3.js RUBRIC). A
// language model could one day rate the same five points, but only within the technical
// conventions (CLAUDE.md: no network calls; audit F-5; docs/OPEN-DECISIONS.md D-8).
//
// Before this can be switched on, all of the following are needed, and none exists:
//   1. A backend proxy run by Hult. The browser must never hold a provider key or call a provider
//      directly; the tool has no server, and CLAUDE.md forbids network calls from the page.
//      Switching on therefore needs a change to those conventions, recorded by the owner.
//   2. Data protection sign-off by Hult (a data processing agreement with the provider, and
//      disclosure to students). The consent wording (docs/CONSENT.md) would need a new version.
//   3. A pilot comparison with coach ratings on the same checklist, including checks that the
//      model does not rate students writing in a second language lower for the same content
//      (audit E-1). Until then the attempt stays coach-scorable with a null score, and any model
//      rating would be stored beside the text, never as the score.
//
// The interface below is what a future adapter must implement. In this build, isEnabled() is
// always false and score() always resolves to { status: "disabled" } without sending anything.

/**
 * @typedef {{ itemId: string, reader: string, goal: string, passage: string, text: string,
 *   rubric: { id: string, text: string }[] }} RubricRequest
 */
/**
 * @typedef {{ status: 'disabled' } | { status: 'ok', ratings: Object<string, 'yes' | 'partly' | 'no' | null>,
 *   model: string, version: string }} RubricResult
 */

export const LLM_RUBRIC_SCORER = Object.freeze({
  id: 'llm-rewrite-rubric',
  enabled: false,
  requires: Object.freeze(['backend proxy run by Hult', 'Hult data protection sign-off', 'pilot comparison with coach ratings']),
});

/** Always false in this build. */
export function isEnabled() {
  return false;
}

/**
 * Would rate a rewrite on each checklist point. Disabled: resolves without any request.
 * @param {RubricRequest} _request
 * @returns {Promise<RubricResult>}
 */
export async function score(_request) {
  return { status: 'disabled' };
}

/** Configuration is refused in this build, so the scorer cannot be switched on by accident. */
export function configure() {
  throw new Error('The language-model rubric scorer is disabled: it needs a backend proxy and data protection sign-off (docs/OPEN-DECISIONS.md D-8).');
}
