// Critical thinking skill module. S6: self-report only (content/critical/self-report.js); tasks are added later.

import { skillManifest } from '../common/manifest.js';

export default skillManifest('critical', {
  loadSelfReport: () => import('../../../content/critical/self-report.js'),
});
