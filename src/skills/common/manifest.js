// Builds a skill manifest from its SKILL_CATALOGUE entry, so the facets and accent are defined in
// one place (src/skills/registry.js). Tasks are added by S7 to S10.

import { SKILL_CATALOGUE } from '../registry.js';
import { mount } from './self-report.js';
import { selfReportScorer } from './self-report-score.js';

/**
 * @param {string} id  skill id in SKILL_CATALOGUE
 * @param {{ loadSelfReport: () => Promise<object>, tasks?: object[] }} parts
 */
export function skillManifest(id, { loadSelfReport, tasks = [] }) {
  const entry = SKILL_CATALOGUE.find((s) => s.id === id);
  if (!entry) throw new RangeError(`skillManifest: unknown skill "${id}"`);
  const facets = entry.facets.map((f) => ({ ...f }));
  return {
    id: entry.id,
    label: entry.label,
    accentToken: entry.accentToken,
    facets,
    selfReport: {
      label: 'About you',
      // PROVISIONAL: 8 or 9 statements on 3 or 4 screens; to be replaced by pilot timings.
      estMinutes: 3,
      loadContent: loadSelfReport,
      mount,
      score: selfReportScorer(facets.map((f) => f.code)),
    },
    tasks,
  };
}
