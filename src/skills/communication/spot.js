// CM-T2 "Spot the problem" (content/communication/cm-t2.js). One passage per screen: who is
// writing to whom, the passage as continuous text with nothing marked (audit A-7), then "Which
// sentence most needs to change?" (the five sentences, numbered, in passage order) and "What is
// the problem with that sentence?" (the five kinds of problem, in an order shuffled per item by
// ctx.rngFor).
//
// Response: { sentence, problem, problemPosition, problemOrder }: the sentence index, the problem
// code, its screen position and the codes in screen order. Scoring: src/skills/communication/
// score.js scoreSpot, all-or-nothing per part. Practice shows the key and the item's rationale.

import { twoPartTask, contextCard } from './two-part.js';
import { scoreSpot } from './score.js';
import { PROBLEMS, PROBLEM_CODES, QUESTION_SENTENCE, QUESTION_PROBLEM, INSTRUCTION } from '../../../content/communication/cm-t2.js';
import { KEYS } from '../common/ui.js';

export const mount = twoPartTask({
  className: 'task-spot',
  noun: 'Passage',
  instruction: INSTRUCTION,
  screen(item, make, ctx) {
    const order = ctx.rngFor(item.id).shuffle(PROBLEM_CODES.slice());
    const text = make('div', 'card task-passage');
    text.append(make('p', null, item.sentences.join(' ')));
    return {
      material: [contextCard(make, 'The situation', item.context), text],
      parts: [
        {
          name: 'sentence',
          legend: QUESTION_SENTENCE,
          options: item.sentences.map((s, i) => ({ value: i, key: String(i + 1), text: s })),
          answer: item.key,
          missing: 'Please choose a sentence.',
        },
        {
          name: 'problem',
          legend: QUESTION_PROBLEM,
          options: order.map((code, position) => ({ value: code, key: KEYS[position], text: PROBLEMS[code].label })),
          answer: item.problem,
          missing: 'Please choose the kind of problem.',
          order,
        },
      ],
    };
  },
  response(item, chosen, parts) {
    return {
      sentence: chosen.sentence.value,
      problem: chosen.problem.value,
      problemPosition: chosen.problem.position,
      problemOrder: parts[1].order,
    };
  },
  explain(item, chosen) {
    return [
      chosen.sentence.value === item.key ? null : `The sentence that most needs to change is sentence ${item.key + 1}.`,
      chosen.problem.value === item.problem ? null : `The problem: ${PROBLEMS[item.problem].label}.`,
      item.rationale,
    ];
  },
});

export const score = scoreSpot;
