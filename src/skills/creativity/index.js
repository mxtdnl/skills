// Creativity skill module (docs/CONSTRUCTS.md section 4). S6: self-report
// (content/creativity/self-report.js). S8: two production tasks, CR-T1 Alternate uses and CR-T2
// Problem finding, both 3-minute idea lists scored by src/skills/creativity/ideas-score.js
// (docs/SCORING.md, Creativity tasks). The English word list the scorer needs is loaded with the
// task content, so the hub does not load it.

import { skillManifest } from '../common/manifest.js';
import * as ideas from './ideas.js';
import { score } from './ideas-score.js';
import { loadDictionary } from './text.js';

const withDictionary = (load) => async () => {
  const [content] = await Promise.all([load(), loadDictionary()]);
  return content;
};

export default skillManifest('creativity', {
  loadSelfReport: () => import('../../../content/creativity/self-report.js'),
  // PROVISIONAL: estimated minutes (3 minutes of writing plus instructions), to be replaced by
  // pilot timings (docs/VALIDATION-PLAN.md).
  tasks: [
    {
      id: 'cr-t1', label: 'Alternate uses', type: 'idea-list', estMinutes: 4, facets: ['CR1', 'CR2', 'CR3'],
      loadContent: withDictionary(() => import('../../../content/creativity/cr-t1.js')),
      mount: ideas.mount, score,
    },
    {
      id: 'cr-t2', label: 'Problem finding', type: 'idea-list', estMinutes: 4, facets: ['CR4', 'CR1', 'CR2', 'CR3'],
      loadContent: withDictionary(() => import('../../../content/creativity/cr-t2.js')),
      mount: ideas.mount, score,
    },
  ],
});
