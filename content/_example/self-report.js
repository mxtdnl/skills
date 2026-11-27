// Example self-report content for the developer stub skill (src/skills/_example/rate.js). Not
// an assessment item bank: these statements exercise the self-report step of the platform and
// are never shown to students. A self-report has no practice pool (practice sittings skip it).
//
// Item fields for the "rate" self-report:
//   text  statement rated on a five-point agreement scale (plain text; rendered with textContent)

const item = (id, text) => ({ id, status: 'draft', text });

export const formA = [
  item('EX-SR-A01', 'I enjoy trying out example tasks.'),
  item('EX-SR-A02', 'I read instructions before I start.'),
];

export const formB = [
  item('EX-SR-B01', 'I like testing how a tool works.'),
  item('EX-SR-B02', 'I check my answers before moving on.'),
];

export const practice = [];
