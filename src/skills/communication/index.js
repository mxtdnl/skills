// Communication skill module. S6: self-report only (content/communication/self-report.js); tasks are added later.

import { skillManifest } from '../common/manifest.js';

export default skillManifest('communication', {
  loadSelfReport: () => import('../../../content/communication/self-report.js'),
});
