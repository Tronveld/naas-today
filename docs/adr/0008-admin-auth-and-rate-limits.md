# 0008 — Stateless admin password; best-effort rate limits

**Status:** accepted; `admin-events` limit added 2026-09-23.

## Decision

- One admin password, PBKDF2-SHA256 at 310,000 iterations, stored in `admin_config` (one row). `admin-auth` handles first-time setup and login; `public/admin.html` keeps the password in `sessionStorage` and sends it as `x-admin-password` on every `admin-events` call, which re-verifies it. No sessions.
- Because every `admin-events` call checks the password, it is a login endpoint too. It limits *failed* checks to 10/IP/15 min — failures only, so a working session never locks itself out. Before this, guessing against `admin-events` sidestepped `admin-auth`'s login limit.
- All limits use `lib/rate-limit.js`: in-memory, per warm function instance. A cold start resets it and parallel instances count separately. It slows a guesser; the real protection is the 12-character minimum and PBKDF2. Move the counts to a Supabase table if a limit has to be exact.
