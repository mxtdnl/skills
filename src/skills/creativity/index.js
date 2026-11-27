// Creativity skill module. S6: self-report only (content/creativity/self-report.js); tasks are added later.

import { skillManifest } from '../common/manifest.js';

export default skillManifest('creativity', {
  loadSelfReport: () => import('../../../content/creativity/self-report.js'),
});
