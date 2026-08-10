// Category filtering is built, tested and reachable — it is just not rendered.
//
// Measured over the 60 days from 2026-08-09: only 1.77 of the six chips were live
// on an average day, the Theatre chip was live on 5 days and Music on 12, and just
// 22 of 60 days had the 3+ events it takes for filtering to narrow anything. The
// row cost ~122px above the fold on all 60. The category tags on each card carry
// the same information for the day you are actually looking at.
//
// Flip this to true and the row comes back whole: the chips, the live counts, the
// ?filters= round-trip and the empty state's "Show all events" escape. Nothing else
// needs changing, which is the point — see index.astro for the guarded call sites.
export const FILTERS_ENABLED = false;

/**
 * How long a description has to be before its tail is folded behind "Read more".
 *
 * This lives here for the same reason FILTERS_ENABLED does: Astro compiles a
 * component's frontmatter and the page's client script separately, so a shared
 * module is the only way one constant governs both the pre-rendered card and
 * the one `createEventCard()` builds on hydration. It was two hardcoded 220s in
 * two files, which is the fifth instance of this codebase's favourite bug.
 *
 * 600, not 220. At 220 the fold caught ordinary descriptions — the OverEaters
 * listing runs about 215 characters and escaped by one sentence — which made
 * "Read more" a routine tax rather than a rare mercy, on a page whose whole
 * promise is that you do not have to tap to find out what something is. At 600
 * only the genuine outliers fold: the scraped festival blurbs that run past
 * 1,500 characters and would otherwise push a six-event Saturday off the screen.
 */
export const DESCRIPTION_CLAMP = 600;
