// Curiosity skill module. S6: self-report only (content/curiosity/self-report.js); tasks are added later.

import { skillManifest } from '../common/manifest.js';

export default skillManifest('curiosity', {
  loadSelfReport: () => import('../../../content/curiosity/self-report.js'),
});
