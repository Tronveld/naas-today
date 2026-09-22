# 0004 — Rebuild only when events arrive, under a deploy cap

**Status:** accepted 2026-08.

## Context

The Netlify free plan is 300 credits a month. A production deploy costs 15 flat, so the ceiling is 20 deploys a month, from a pool bandwidth (20/GB) and requests (2 per 10k) also draw on. Exhaust it and Netlify pauses every project on the team — the site goes dark until the next cycle. A daily unconditional rebuild is 450 credits.

## Decision

The workflow's rebuild runs only when both hold:

1. **Events arrived.** Fetchers report `setOutput('inserted', n)`; the step needs `n > 0`. Historically 2–7 days a month.
2. **Under the cap.** `check-deploy-budget.js` counts production deploys in the trailing 30 days (pushes to `main` included) and blocks past `REBUILD_CAP` (default 15). Trailing 30 days rather than the billing month, whose cycle starts on the 14th — guessing that boundary optimistically is what pauses the site. It fails open: the arrival gate is the primary control, and a silently disabled rebuild is harder to notice than a warning.

`main` is production (15 credits per push); `dev` is a branch deploy at `dev--naas-today.netlify.app` and costs nothing. That branch setting lives in the Netlify dashboard, not `netlify.toml`.

## Consequences

An event approved by hand inserts nothing through the fetchers, so no rebuild fires. It is live for visitors immediately — `get-events` is read on every page load — and reaches the static HTML at the next rebuild. The failure is toward fewer deploys, the safe direction.

Bandwidth counts too. Until 2026-09-23 every visit shipped every approved event ever (887 rows, 450 past) twice; see ADR 0006.
