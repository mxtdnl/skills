// CM-T1 "Which is clearer?" (content/communication/cm-t1.js). One pair per screen: who is writing
// to whom, the two versions (Version 1 and Version 2, in their stored order), then the question
// "What mainly makes it clearer?" with four reasons in an order shuffled per item (ctx.rngFor).
//
// Response: { version, reason, reasonPosition, reasonOrder }, where version is 0 or 1 and reason
// is an index into the item's `reasons`; reasonOrder lists those indices in screen order.
// Scoring: src/skills/communication/score.js scoreClearer. Practice shows the key and the item's
// rationale.

import { twoPartTask, contextCard } from './two-part.js';
import { scoreClearer } from './score.js';
import { REASONS, QUESTION_VERSION, QUESTION_REASON } from '../../../content/communication/cm-t1.js';
import { KEYS } from '../common/ui.js';

export const mount = twoPartTask({
  className: 'task-clearer',
  noun: 'Pair',
  instruction: 'Read both versions of the message. Choose the one that is clearer for the reader, then choose what mainly makes it clearer.',
  screen(item, make, ctx) {
    const order = ctx.rngFor(item.id).shuffle(item.reasons.map((_, i) => i));
    return {
      material: [contextCard(make, 'The situation', item.context)],
      parts: [
        {
          name: 'version',
          legend: QUESTION_VERSION,
          options: item.versions.map((text, i) => ({ value: i, key: String(i + 1), text })),
          answer: item.key,
          missing: 'Please choose the clearer version.',
        },
        {
          name: 'reason',
          legend: QUESTION_REASON,
          options: order.map((i, position) => ({ value: i, key: KEYS[position], text: REASONS[item.reasons[i]] })),
          answer: item.reasonKey,
          missing: 'Please choose what mainly makes it clearer.',
          order,
        },
      ],
    };
  },
  response(item, chosen, parts) {
    return {
      version: chosen.version.value,
      reason: chosen.reason.value,
      reasonPosition: chosen.reason.position,
      reasonOrder: parts[1].order,
    };
  },
  explain(item, chosen) {
    return [
      chosen.version.value === item.key ? null : `The clearer version is Version ${item.key + 1}.`,
      chosen.reason.value === item.reasonKey ? null : `What mainly makes it clearer: ${REASONS[item.reasons[item.reasonKey]]}`,
      item.rationale,
    ];
  },
});

export const score = scoreClearer;
