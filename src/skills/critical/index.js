// Critical thinking skill module (docs/CONSTRUCTS.md section 3). S6: self-report
// (content/critical/self-report.js). S7: four tasks, one per facet (owner decision of
// 2026-11-26; audit/BUILD-PLAN.md decisions log). Scoring: docs/SCORING.md, Critical thinking.

import { skillManifest } from '../common/manifest.js';
import * as selection from './selection.js';
import * as calibration from './calibration.js';
import { choiceTask } from './choice.js';

const argument = choiceTask({ facet: 'CT2' });
const statistical = choiceTask({ facet: 'CT4' });

export default skillManifest('critical', {
  loadSelfReport: () => import('../../../content/critical/self-report.js'),
  // PROVISIONAL: estimated minutes, to be replaced by pilot timings (docs/VALIDATION-PLAN.md).
  // No task is timed (docs/SCORING.md, Critical thinking).
  tasks: [
    {
      id: 'ct-t1', label: 'Conditional reasoning', type: 'selection', estMinutes: 5, facets: ['CT1'],
      loadContent: () => import('../../../content/critical/ct-t1.js'),
      mount: selection.mount, score: selection.score,
    },
    {
      id: 'ct-t2', label: 'Arguments and evidence', type: 'choice', estMinutes: 7, facets: ['CT2'],
      loadContent: () => import('../../../content/critical/ct-t2.js'),
      mount: argument.mount, score: argument.score,
    },
    {
      id: 'ct-t3', label: 'How sure are you?', type: 'calibration', estMinutes: 5, facets: ['CT3'],
      loadContent: () => import('../../../content/critical/ct-t3.js'),
      mount: calibration.mount, score: calibration.score,
    },
    {
      id: 'ct-t4', label: 'Numbers and chance', type: 'choice', estMinutes: 5, facets: ['CT4'],
      loadContent: () => import('../../../content/critical/ct-t4.js'),
      mount: statistical.mount, score: statistical.score,
    },
  ],
});
