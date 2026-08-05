/**
 * Decide whether another Netlify production deploy is affordable.
 *
 * Netlify's free plan is 300 credits a month and a production deploy costs 15
 * of them — flat, whatever the build takes. That is 20 deploys a month, total,
 * out of a pool also drawn on by bandwidth (20/GB) and web requests (2/10k).
 * Exhaust it and Netlify pauses every project on the team: visitors get "Site
 * not available" until the next billing cycle. The site goes dark.
 *
 * So this is a second line of defence behind the workflow's "only rebuild when
 * events actually arrived" rule. It counts production deploys in the trailing
 * 30 days and refuses once they reach the cap.
 *
 * Usage: node scripts/check-deploy-budget.js
 *
 * Env: NETLIFY_AUTH_TOKEN  (optional — without it the check is skipped)
 *      NETLIFY_SITE_ID     (defaults to the naas-today site)
 *      REBUILD_CAP         (defaults to 15)
 */

const { loadEnv, setOutput } = require('./lib');

loadEnv();

// Not a secret — it is in the public Netlify URL for the project.
const SITE_ID = process.env.NETLIFY_SITE_ID || '8d9f013d-ee69-4793-a8e2-e6d3bcd6eaae';
const TOKEN   = process.env.NETLIFY_AUTH_TOKEN;

// 15 of the 20 affordable deploys, leaving five plus room for the bandwidth and
// web requests that draw on the same 300 credits.
const CAP = Number(process.env.REBUILD_CAP || 15);

const WINDOW_DAYS = 30;
const MS_PER_DAY  = 24 * 60 * 60 * 1000;

/**
 * Is there room for one more production deploy?
 *
 * A trailing 30-day window rather than the billing month on purpose: this team
 * was created on the 14th, so the real cycle boundary is probably the 14th and
 * not the 1st. Guessing that boundary optimistically is exactly what pauses the
 * site, and a trailing window is conservative wherever the truth sits.
 *
 * `now` is a parameter rather than a call to the clock so the window is testable.
 */
function withinBudget(deploys, cap, now) {
  const cutoff = now.getTime() - WINDOW_DAYS * MS_PER_DAY;
  const recent = deploys.filter(d =>
    d.context === 'production' && new Date(d.created_at).getTime() >= cutoff
  );
  // `<` not `<=`: at the cap, the next deploy is the one that breaches it.
  return recent.length < cap;
}

async function fetchDeploys() {
  const res = await fetch(
    `https://api.netlify.com/api/v1/sites/${SITE_ID}/deploys?per_page=100`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  if (!res.ok) {
    throw new Error(`Netlify API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // No token means the cap cannot be evaluated. Allow the deploy and say so
  // loudly rather than blocking forever: the workflow's "only when events
  // arrived" gate is the primary control, and this is the backstop. Missing
  // setup should degrade to "no cap", not to "rebuilds silently stop".
  if (!TOKEN) {
    console.log('::warning::NETLIFY_AUTH_TOKEN is not set — skipping the deploy budget check. Rebuilds are still gated on new events arriving, but nothing is enforcing a monthly ceiling.');
    setOutput('allowed', 'true');
    setOutput('deploy_count', 'unknown');
    return;
  }

  const deploys = await fetchDeploys();

  // Errored and skipped builds are not charged, so counting them would block
  // rebuilds that were affordable all along.
  const charged = deploys.filter(d => d.state !== 'error' && d.state !== 'skipped');

  const now     = new Date();
  const cutoff  = now.getTime() - WINDOW_DAYS * MS_PER_DAY;
  const count   = charged.filter(d =>
    d.context === 'production' && new Date(d.created_at).getTime() >= cutoff
  ).length;

  const allowed = withinBudget(charged, CAP, now);

  console.log(`Production deploys in the last ${WINDOW_DAYS} days: ${count} of ${CAP} allowed.`);
  console.log(`Roughly ${count * 15} of 300 monthly credits spent on deploys.`);

  if (!allowed) {
    console.log(`::warning::Deploy budget reached — ${count} production deploys in the last ${WINDOW_DAYS} days, cap is ${CAP}. Skipping the rebuild. New events are still live for visitors; only the pre-rendered HTML will lag. Raise REBUILD_CAP only if the credit usage page says there is room.`);
  }

  setOutput('allowed', allowed ? 'true' : 'false');
  setOutput('deploy_count', count);
}

// Only run when invoked directly, so tests can require the pure helper below
// without calling the Netlify API.
if (require.main === module) {
  main().catch(err => {
    // A failed budget check must not block the pipeline, but it must be visible.
    // Erring toward allowing matches the no-token case: the primary gate still
    // holds, and a silently disabled rebuild is harder to notice than a warning.
    console.log(`::warning::Deploy budget check failed (${err.message}) — allowing the rebuild.`);
    setOutput('allowed', 'true');
    setOutput('deploy_count', 'unknown');
  });
}

// Exported for tests only — the CLI path above is what actually runs.
module.exports = { withinBudget };
