// Example content for the developer stub skill (src/skills/_example). Not an assessment item
// bank: these items prove the content convention and the skill contract end to end, and are
// never shown to students.
//
// Convention (docs/ITEM-BANK.md): content/<skill>/<task>.js exports formA, formB and practice,
// each an array of items. Every item has a unique id and status "draft" or "reviewed"; other
// fields are defined by the task. Practice and assessment items never share an id.
//
// Item fields for the "pick" task:
//   prompt   question text (plain text; rendered with textContent)
//   options  array of option strings
//   key      index of the correct option

const item = (id, prompt, options, key) => ({ id, status: 'draft', prompt, options, key });

export const formA = [
  item('EX-PICK-A01', 'Which number is largest?', ['12', '21', '9'], 1),
  item('EX-PICK-A02', 'Which word has the most letters?', ['cat', 'garden', 'sun'], 1),
];

export const formB = [
  item('EX-PICK-B01', 'Which number is smallest?', ['14', '41', '7'], 2),
  item('EX-PICK-B02', 'Which word has the fewest letters?', ['window', 'map', 'river'], 1),
];

export const practice = [
  item('EX-PICK-P01', 'Which number is even?', ['3', '8', '5'], 1),
  item('EX-PICK-P02', 'Which of these is a day of the week?', ['April', 'Tuesday', 'Winter'], 1),
];
