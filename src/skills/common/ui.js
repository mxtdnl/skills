// Small DOM helpers shared by the task components (critical thinking, S7; communication, S9). Every node is built with
// createElement and textContent (audit K-5); nothing is parsed from a string.

export const KEYS = 'ABCDEFGH';

/** A maker bound to the task's document: make('p', 'lede', 'Text'). */
export function maker(doc) {
  return (tag, className, text) => {
    const n = doc.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  };
}

/** Index of the first item without a response in `done`, or items.length. */
export function firstOpen(items, done) {
  const i = items.findIndex((it) => !done.has(it.id));
  return i === -1 ? items.length : i;
}

/**
 * A choice card (styles/components.css, choice cards), used as a toggle button.
 * @returns {HTMLButtonElement}
 */
export function choiceCard(make, keyLabel, text) {
  const b = make('button', 'choice-card');
  b.type = 'button';
  b.setAttribute('aria-pressed', 'false');
  b.append(make('span', 'choice-key', keyLabel), make('span', 'choice-text', text), make('span', 'choice-flag', 'Selected'));
  return b;
}

export function setPressed(b, on) {
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.querySelector('.choice-flag').textContent = 'Selected';
}

/** Lock every card after an answer (practice feedback). */
export function lockAll(list) {
  for (const c of list.querySelectorAll('.choice-card')) {
    c.classList.add('locked');
    c.setAttribute('aria-disabled', 'true');
  }
}

/** Mark a card as correct or incorrect, with its flag text. */
export function mark(card, state, flag) {
  card.classList.add(state);
  card.querySelector('.choice-flag').textContent = flag;
}

/** A feedback box (styles/components.css, feedback boxes). */
export function feedbackBox(make, right, paragraphs) {
  const box = make('div', `feedback ${right ? 'correct' : 'incorrect'}`);
  box.append(make('p', 'feedback-label', right ? 'Correct' : 'Not quite'));
  for (const p of paragraphs) if (p) box.append(typeof p === 'string' ? make('p', null, p) : p);
  return box;
}

/** A button that moves on: "Next question" or "Finish". */
export function nextButton(make, last, onClick, labels = ['Next question', 'Finish']) {
  const b = make('button', 'btn', last ? labels[1] : labels[0]);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}
