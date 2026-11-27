// Optional language-model scorer for creativity responses. DISABLED. It makes no network call.
//
// Why it exists: established originality scoring includes rating responses with a fine-tuned or
// general language model (audit A-6). The owner decided that originality should be scored
// automatically where possible, but only within the technical conventions (docs/CONSTRUCTS.md,
// section 4, Decisions; audit F-5; docs/OPEN-DECISIONS.md D-8).
//
// Before this can be switched on, all of the following are needed, and none exists:
//   1. A backend proxy run by Hult. The browser must never hold a provider key or call a provider
//      directly; the tool has no server, and CLAUDE.md forbids network calls from the page.
//      Switching on therefore needs a change to those conventions, recorded by the owner.
//   2. Data protection sign-off by Hult (a data processing agreement with the provider, and
//      disclosure to students). The consent wording (docs/CONSENT.md) would need a new version.
//   3. A pilot comparison with human ratings. Until then the frequency-table score stays the
//      reported score, and any model score is stored beside it, never in its place.
//
// The interface below is what a future adapter must implement. In this build, isEnabled() is
// always false and score() always resolves to { status: "disabled" } without sending anything.

/** @typedef {{ itemId: string, prompt: string, lines: string[] }} LlmRequest */
/** @typedef {{ status: 'disabled' } | { status: 'ok', ratings: (number | null)[], model: string, version: string }} LlmResult */

export const LLM_SCORER = Object.freeze({
  id: 'llm-originality',
  enabled: false,
  requires: Object.freeze(['backend proxy run by Hult', 'Hult data protection sign-off', 'pilot comparison with human ratings']),
});

/** Always false in this build. */
export function isEnabled() {
  return false;
}

/**
 * Would rate each line for originality. Disabled: resolves without any request.
 * @param {LlmRequest} _request
 * @returns {Promise<LlmResult>}
 */
export async function score(_request) {
  return { status: 'disabled' };
}

/** Configuration is refused in this build, so the scorer cannot be switched on by accident. */
export function configure() {
  throw new Error('The language-model scorer is disabled: it needs a backend proxy and data protection sign-off (docs/OPEN-DECISIONS.md D-8).');
}
