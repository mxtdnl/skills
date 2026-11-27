// Skill-level summary for Creativity (docs/SCORING.md, Creativity tasks, Skill summary).
//
// Each facet is reported through its own indicators, one task at a time. Nothing is added,
// averaged or weighted across indicators or tasks: in particular, originality is never combined
// with fluency (audit A-6, B-2, E-1), because the number of ideas depends on typing speed and
// English vocabulary, and originality as scored here does not. Results pages (S11) decide how to
// show these values; no change claim is made (CLAUDE.md, global rules).

/**
 * @param {{ uses?: object | null, problems?: object | null }} scores
 *   score objects of a completed CR-T1 (uses) and CR-T2 (problems) attempt, or null if not taken
 * @returns {{ CR1: object, CR2: object, CR3: object, CR4: object }}
 */
export function creativitySummary({ uses = null, problems = null } = {}) {
  const pick = (s, key) => (s && s[key] !== undefined ? s[key] : null);
  return {
    // Fluency: valid, unique ideas. CR-T1 is the primary measure; CR-T2 is shown beside it.
    CR1: { uses: pick(uses, 'fluency'), problems: pick(problems, 'fluency') },
    // Flexibility: distinct categories, out of the item's categoriesAvailable.
    CR2: {
      uses: pick(uses, 'flexibility'), usesOf: pick(uses, 'categoriesAvailable'),
      problems: pick(problems, 'flexibility'), problemsOf: pick(problems, 'categoriesAvailable'),
    },
    // Originality: mean points per valid idea, 0 to 2 (null when fewer than 3 valid ideas).
    CR3: { uses: pick(uses, 'originality'), problems: pick(problems, 'originality') },
    // Problem finding: CR-T2 alone, its three indicators side by side.
    CR4: {
      problems: pick(problems, 'fluency'),
      kinds: pick(problems, 'flexibility'), kindsOf: pick(problems, 'categoriesAvailable'),
      originality: pick(problems, 'originality'),
    },
  };
}
