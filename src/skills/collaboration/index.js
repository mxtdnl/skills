// Collaboration skill module. S6: self-report only (content/collaboration/self-report.js); tasks are added later.

import { skillManifest } from '../common/manifest.js';

export default skillManifest('collaboration', {
  loadSelfReport: () => import('../../../content/collaboration/self-report.js'),
});
