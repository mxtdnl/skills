// Developer stub skill. It exists to prove the skill module contract (docs/ARCHITECTURE.md) end
// to end: manifest, content loading, mounting, response recording, scoring and storage. It
// measures nothing, is listed only in EXAMPLE_MODULES, and is never shown to students.

import { mount, score } from './pick.js';
import * as rate from './rate.js';

export default {
  id: '_example',
  label: 'Example skill (developer stub)',
  // Brown is not mapped to any of the five skills, so the stub never borrows a skill's hue.
  accentToken: '--accent-5',
  facets: [{ code: 'EX1', label: 'Example facet (not a construct)' }],
  selfReport: {
    label: 'About you (example)',
    estMinutes: 1,
    loadContent: () => import('../../../content/_example/self-report.js'),
    mount: rate.mount,
    score: rate.score,
  },
  tasks: [
    {
      id: 'pick',
      label: 'Pick the answer',
      type: 'choice',
      estMinutes: 1,
      facets: ['EX1'],
      loadContent: () => import('../../../content/_example/pick.js'),
      mount,
      score,
    },
  ],
};
