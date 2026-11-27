// Communication skill module (docs/CONSTRUCTS.md section 5). S6: self-report
// (content/communication/self-report.js). S9: three tasks designed to keep the English production
// load low for students writing in a second language (audit E-1): two selection tasks, which carry
// the score, and one rewrite, which is stored for a coach and not scored automatically.
// Scoring: docs/SCORING.md, Communication tasks. No legacy Message Editing formula is used.

import { skillManifest } from '../common/manifest.js';
import * as clearer from './clearer.js';
import * as spot from './spot.js';
import * as rewrite from './rewrite.js';

const FACETS = ['CM1', 'CM2', 'CM3'];

export default skillManifest('communication', {
  loadSelfReport: () => import('../../../content/communication/self-report.js'),
  // PROVISIONAL: estimated minutes, to be replaced by pilot timings (docs/VALIDATION-PLAN.md).
  // No task is timed.
  tasks: [
    {
      id: 'cm-t1', label: 'Which is clearer?', type: 'paired-choice', estMinutes: 6, facets: FACETS,
      loadContent: () => import('../../../content/communication/cm-t1.js'),
      mount: clearer.mount, score: clearer.score,
    },
    {
      id: 'cm-t2', label: 'Spot the problem', type: 'diagnosis', estMinutes: 6, facets: FACETS,
      loadContent: () => import('../../../content/communication/cm-t2.js'),
      mount: spot.mount, score: spot.score,
    },
    {
      id: 'cm-t3', label: 'Rewrite', type: 'rewrite', estMinutes: 8, facets: FACETS, coachScored: true,
      loadContent: () => import('../../../content/communication/cm-t3.js'),
      mount: rewrite.mount, score: rewrite.score,
    },
  ],
});
