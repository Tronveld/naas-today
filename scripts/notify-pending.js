/**
 * Email a reminder while any event submission is waiting for review.
 *
 * Submissions used to sit for weeks. Not because they were hard to judge, but
 * because the admin queue also held ~88 scraped rows a week and nobody opens a
 * list of 88 to find the 1. The scrapers now auto-approve, so `status =
 * 'pending'` means "a person wrote this", and this script makes sure someone
 * hears about it without having to remember to look.
 *
 * It emails every day for as long as something sits. The repetition is the
 * point — a single email is exactly what gets missed.
 *
 * Usage: node scripts/notify-pending.js [--dry-run]
 *   --dry-run   print the email instead of sending it
 *
 * Env: SUPABASE_URL, SUPABASE_SECRET_KEY, RESEND_API_KEY, NOTIFY_EMAIL_TO,
 *      and optionally NOTIFY_EMAIL_FROM (defaults to Resend's shared sender,
 *      which needs no domain verification).
 */

const { loadEnv, createClient, exitCode } = require('./lib');

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SECRET_KEY   = process.env.SUPABASE_SECRET_KEY;
const RESEND_KEY   = process.env.RESEND_API_KEY;
const MAIL_TO      = process.env.NOTIFY_EMAIL_TO;
const MAIL_FROM    = process.env.NOTIFY_EMAIL_FROM || 'Naas Today <onboarding@resend.dev>';

// Matches `site` in astro.config.mjs. If the domain moves, both change.
const ADMIN_URL = 'https://naastoday.com/admin.html';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Whole days between submission and now. Floored, so "waiting 1 day" means at
// least 24 hours have passed rather than "it is a different date now".
function ageInDays(createdAt, now) {
  return Math.max(0, Math.floor((now.getTime() - new Date(createdAt).getTime()) / MS_PER_DAY));
}

function describeAge(days) {
  if (days === 0) return 'waiting since today';
  if (days === 1) return 'waiting 1 day';
  return `waiting ${days} days`;
}

/**
 * Build the reminder, or null when there is nothing to say.
 *
 * Returning null for an empty queue is deliberate: a daily "0 awaiting review"
 * is the fastest way to teach someone to ignore the alert, and then the alert
 * is worth nothing on the day it matters.
 *
 * `now` is a parameter rather than a call to the clock so the age arithmetic —
 * the entire substance of the email — can be tested.
 */
function formatPendingEmail(events, now) {
  if (!events || events.length === 0) return null;

  // Oldest first: the one that has waited longest is the one to act on.
  const sorted = [...events].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  const count   = sorted.length;
  const noun    = count === 1 ? 'event' : 'events';
  const subject = `${count} ${noun} awaiting review — Naas Today`;

  const textLines = sorted.map((e) => {
    const age = describeAge(ageInDays(e.created_at, now));
    return `• ${e.title}\n  ${e.date}${e.location ? ` — ${e.location}` : ''}\n  ${age}`;
  });

  const text = [
    `${count} ${noun} submitted to Naas Today ${count === 1 ? 'is' : 'are'} waiting for review.`,
    '',
    ...textLines,
    '',
    `Review them: ${ADMIN_URL}`,
  ].join('\n');

  const htmlItems = sorted.map((e) => {
    const age = describeAge(ageInDays(e.created_at, now));
    const loc = e.location ? ` — ${escapeHtml(e.location)}` : '';
    return `<li style="margin-bottom:12px">
      <strong>${escapeHtml(e.title)}</strong><br>
      ${escapeHtml(e.date)}${loc}<br>
      <span style="color:#666">${escapeHtml(age)}</span>
    </li>`;
  });

  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.5">
    <p>${count} ${noun} submitted to Naas Today ${count === 1 ? 'is' : 'are'} waiting for review.</p>
    <ul style="padding-left:18px">${htmlItems.join('')}</ul>
    <p><a href="${ADMIN_URL}">Review them in the admin panel</a></p>
  </div>`;

  return { subject, text, html };
}

async function fetchPending(sb) {
  return sb.get('/events?status=eq.pending&select=id,title,date,location,created_at,source&order=created_at.asc');
}

async function sendEmail(mail) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [MAIL_TO],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!SUPABASE_URL || !SECRET_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SECRET_KEY must be set (check .env).');
    process.exitCode = 1;
    return;
  }

  const sb     = createClient(SUPABASE_URL, SECRET_KEY);
  const events = await fetchPending(sb);
  const mail   = formatPendingEmail(events, new Date());

  if (!mail) {
    console.log('Nothing awaiting review. No email sent.');
    return;   // exit 0 — silence here is correct, not a failure
  }

  console.log(`${events.length} event(s) awaiting review.\n`);

  if (dryRun) {
    console.log(`Subject: ${mail.subject}`);
    console.log('─'.repeat(62));
    console.log(mail.text);
    console.log('─'.repeat(62));
    console.log('\n[DRY RUN] No email sent.');
    return;
  }

  // Credentials are only required once there is something to send. An
  // unconfigured checkout should not nag on a day with an empty queue — but a
  // reminder that cannot be delivered has to be loud, because a notification
  // failing silently is precisely the bug this script exists to fix.
  if (!RESEND_KEY || !MAIL_TO) {
    console.error(
      'ERROR: events are awaiting review but the mailer is not configured.\n' +
      '       Set RESEND_API_KEY and NOTIFY_EMAIL_TO.'
    );
    process.exitCode = exitCode({ eventErrors: 1 });
    return;
  }

  try {
    await sendEmail(mail);
    console.log(`Reminder sent to ${MAIL_TO}.`);
  } catch (err) {
    console.error(`ERROR: failed to send the reminder — ${err.message}`);
    process.exitCode = exitCode({ eventErrors: 1 });
  }
}

// Only run when invoked directly, so tests can require the pure helpers below
// without hitting the database or sending mail.
if (require.main === module) {
  main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
}

// Exported for tests only — the CLI path above is what actually runs.
module.exports = { formatPendingEmail, ageInDays, describeAge };
