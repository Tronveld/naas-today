# 0005 — Fetchers run on a schedule, fail loudly, retry per source

**Status:** accepted 2026-08; library moved to launchd 2026-08-15.

## Context

Both fetchers were manual. The library went five and a half weeks without a pull and the site quietly showed nothing on most weekdays. Later, `Errors: 1` in a run summary still exited 0 and the run went green — the same silent failure one level down. Then the workflow retried the whole run three times, which needed all five sources healthy in the same attempt: on 2026-08-23 every source succeeded at some point and the job still went red.

## Decision

- `.github/workflows/scrape-events.yml` runs daily at 05:10 UTC: scrape, maybe rebuild (ADR 0004), email pending submissions (ADR 0002).
- `exitCode()` in `scripts/lib.js` returns 1 when any source or event errors. Finding nothing is not an error — an all-duplicates run is a healthy second pull.
- `fetchWithRetry` in `scrape-sources.js` retries each source three times with 5s/10s backoff. whatsontonight.ie drops datacenter connections and intokildare.ie returns 429; a blip should not read as a breakage. The script runs once.
- The notify step runs even when the scrape failed (`!cancelled()`), and is not `continue-on-error`: an undeliverable reminder goes red.
- The library pull runs from a local launchd job (`~/Library/LaunchAgents/com.naastoday.pull-library-events.plist`, log `~/Library/Logs/naas-pull-library.log`) because Spydus returns 405 to GitHub Actions' IPs.
- Eventbrite was removed 2026-08-05: it blocks scrapers and its terms prohibit automated collection. `event-sources.md` lists removed and evaluated-but-unused sources.
