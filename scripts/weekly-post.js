#!/usr/bin/env node
'use strict';

/**
 * weekly-post.js
 * Generates a social media post summarising the upcoming week's events in Naas.
 * Prints the post to the terminal and copies it to the clipboard.
 *
 * "Upcoming week" = the Monday–Sunday that contains or follows today.
 * If today is Sunday, it uses the NEXT week (not the current one).
 *
 * Requires Node.js 18+. Reads SUPABASE_URL and SUPABASE_SECRET_KEY from .env.
 */

const fs   = require('fs');
const path = require('path');

// ── Load .env ──────────────────────────────────────────────────────────────────
(function loadEnv() {
  const envFile = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envFile)) return;
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let   v = t.slice(eq + 1).trim();
    if (v.length >= 2 && ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'")))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SECRET_KEY   = process.env.SUPABASE_SECRET_KEY;

// ── Date helpers ───────────────────────────────────────────────────────────────

// Returns the Monday–Sunday window for the upcoming week.
// If today is Sunday (day 0), uses NEXT week.
function getWeekWindow() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, …, 6=Sat

  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);

  if (day === 0) {
    // Sunday — advance to next Monday
    monday.setDate(now.getDate() + 1);
  } else {
    // Mon–Sat — back up to this Monday
    monday.setDate(now.getDate() - (day - 1));
  }

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

function toYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// "YYYY-MM-DD" → "Monday", "Tuesday", etc. (parsed as local date, no timezone shift)
function formatDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IE', { weekday: 'long' });
}

// "HH:MM" or "HH:MM:SS" → "9:30am", "2:00pm"
function formatTime(timeStr) {
  if (!timeStr) return null;
  const [h, min] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour   = h % 12 || 12;
  return `${hour}:${String(min).padStart(2, '0')}${suffix}`;
}

// ── Event classification ───────────────────────────────────────────────────────

// Well-known Naas venues that get a small scoring boost
const KNOWN_VENUES = [
  'naas library', 'moat theatre', 'st david\'s', 'town hall',
  'punchestown', 'osprey', 'abbey house', 'naas courthouse',
];

function isKnownVenue(location) {
  const loc = (location || '').toLowerCase();
  return KNOWN_VENUES.some(v => loc.includes(v));
}

// Pick an emoji that fits the event content
function getEmoji(event) {
  const text = `${event.title} ${event.description || ''}`.toLowerCase();

  if (event.is_for_kids)                                                               return '🧒';
  if (/\b(music|concert|band|sing|choir|jazz|folk|classical|session|gig|open\s*mic)\b/.test(text)) return '🎵';
  if (/\b(theatre|theater|play|drama|perform|show|comedy|improv|stand[\s-]?up)\b/.test(text))      return '🎭';
  if (/\b(art|paint|draw|sketch|craft|potter|ceramic|exhibit|gallery|print)\b/.test(text))         return '🎨';
  if (/\b(book|read|author|literature|poet|poem|stor(y|ies)|storytell)\b/.test(text))              return '📚';
  if (/\b(yoga|fitness|run|walk|swim|sport|gym|dance|pilates|zumba|exercise|5k)\b/.test(text))     return '🏃';
  if (/\b(food|cook|market|taste|wine|beer|coffee|bake|recipe)\b/.test(text))                      return '🍽️';
  if (/\b(film|movie|cinema|screen|documentary|screening)\b/.test(text))                           return '🎬';
  if (/\b(festival|fair|market|carnival|parade|fete)\b/.test(text))                                return '🎪';
  if (/\b(outdoor|nature|garden|park|hike|trail|farm|wildlife|bird)\b/.test(text))                 return '🌿';
  if (/\b(talk|lecture|seminar|workshop|class|learn|education|training|info\s*session)\b/.test(text)) return '💬';
  if (/\b(community|charity|fundrais|volunteer|support\s*group)\b/.test(text))                     return '🤝';

  return '📅';
}

// Higher score = better candidate for the highlight list
function scoreEvent(event) {
  let score = 0;
  if (event.is_free)                  score += 3;
  if (event.is_for_kids)              score += 2;
  if (isKnownVenue(event.location))   score += 2;
  return score;
}

// ── Highlight selection ────────────────────────────────────────────────────────

// Pick up to 5 events with day and type variety, preferring high-scoring ones.
function selectHighlights(events) {
  if (events.length <= 5) return [...events];

  // Sort candidates: high score first, then chronologically
  const pool = [...events].sort((a, b) => {
    const sd = scoreEvent(b) - scoreEvent(a);
    return sd !== 0 ? sd : a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '');
  });

  const selected  = [];
  const usedDays  = new Set();
  const usedTypes = new Set(); // emoji categories already represented

  // Pass 1 — maximise variety
  for (const evt of pool) {
    if (selected.length >= 5) break;
    const emoji = getEmoji(evt);
    const newDay  = !usedDays.has(evt.date);
    const newType = !usedTypes.has(emoji);

    if (newDay || newType) {
      selected.push(evt);
      usedDays.add(evt.date);
      usedTypes.add(emoji);
    }
  }

  // Pass 2 — fill any remaining slots from the top of the sorted pool
  if (selected.length < 5) {
    for (const evt of pool) {
      if (selected.length >= 5) break;
      if (!selected.includes(evt)) selected.push(evt);
    }
  }

  // Return in chronological order
  return selected.sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
}

// ── Post generation ────────────────────────────────────────────────────────────

const OPENINGS = [
  'Plenty going on in Naas this week 👋',
  "Here's what caught my eye on the calendar this week 👀",
  'A few things worth knowing about this week in Naas 📆',
  "Not a bad week ahead in Naas — here are some highlights ✨",
  "This week's looking busy in Naas — worth a look 👇",
  'A few things on in Naas this week that are worth your time 📌',
  "Things to do in Naas this week — picked out a few that stood out 🗓️",
];

function buildPost(highlights, totalCount) {
  const opening   = OPENINGS[Math.floor(Math.random() * OPENINGS.length)];
  const remaining = totalCount - highlights.length;
  const lines     = [opening, ''];

  for (const evt of highlights) {
    const emoji = getEmoji(evt);
    const day   = formatDay(evt.date);
    const time  = (!evt.is_all_day && evt.time) ? ` at ${formatTime(evt.time)}` : '';
    const venue = evt.location ? ` — ${evt.location}` : '';
    const free  = evt.is_free  ? ' (free)'            : '';

    lines.push(`${emoji} ${evt.title}`);
    lines.push(`${day}${time}${venue}${free}`);
    lines.push('');
  }

  if (remaining > 0) {
    lines.push(`There are ${remaining} more on the calendar — have a look at naastoday.com and see what takes your fancy.`);
  } else {
    lines.push("That's everything on the calendar this week — full details at naastoday.com.");
  }

  return lines.join('\n').trimEnd();
}

// ── Clipboard helper ───────────────────────────────────────────────────────────
function copyToClipboard(text) {
  const { execSync } = require('child_process');
  try {
    execSync('pbcopy', { input: text });
    console.log('✓ Copied to clipboard.');
  } catch {
    try {
      execSync('xclip -selection clipboard', { input: text });
      console.log('✓ Copied to clipboard (xclip).');
    } catch {
      console.log('⚠ Could not copy to clipboard automatically — paste from the output above.');
    }
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  if (!SUPABASE_URL || !SECRET_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SECRET_KEY must be set (check .env).');
    process.exit(1);
  }

  const args       = process.argv.slice(2);
  const listMode   = args.includes('--list');
  const selectArg  = args.find(a => a.startsWith('--select='));
  const selectedIds = selectArg
    ? new Set(selectArg.slice('--select='.length).split(',').map(s => s.trim()).filter(Boolean))
    : null;

  const { monday, sunday } = getWeekWindow();
  const mondayStr = toYMD(monday);
  const sundayStr = toYMD(sunday);

  if (!listMode) console.log(`Fetching approved events for ${mondayStr} → ${sundayStr}…\n`);

  let events;
  try {
    const url = `${SUPABASE_URL}/rest/v1/events`
      + `?status=eq.approved`
      + `&date=gte.${mondayStr}`
      + `&date=lte.${sundayStr}`
      + `&order=date.asc,time.asc`;

    const res = await fetch(url, {
      headers: {
        apikey:        SECRET_KEY,
        Authorization: `Bearer ${SECRET_KEY}`,
      },
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
    events = await res.json();
  } catch (err) {
    console.error('Failed to fetch events:', err.message);
    process.exit(1);
  }

  // ── --list mode: output all events as JSON and exit ────────────────────────
  if (listMode) {
    process.stdout.write(JSON.stringify({
      week:   `${mondayStr} to ${sundayStr}`,
      total:  events.length,
      events: events.map(e => ({
        id:          e.id,
        title:       e.title,
        date:        e.date,
        time:        e.time   ? e.time.slice(0, 5)   : null,
        time_end:    e.time_end ? e.time_end.slice(0, 5) : null,
        location:    e.location,
        description: e.description,
        is_free:     e.is_free,
        is_for_kids: e.is_for_kids,
        is_all_day:  e.is_all_day,
        url:         e.url,
      })),
    }, null, 2) + '\n');
    return;
  }

  if (events.length === 0) {
    console.log('No approved events found for that week. Nothing to post yet.');
    process.exit(0);
  }

  // ── --select mode: use only the specified event IDs ────────────────────────
  let highlights;
  if (selectedIds && selectedIds.size > 0) {
    highlights = events
      .filter(e => selectedIds.has(e.id))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
    if (highlights.length === 0) {
      console.error('ERROR: None of the specified IDs matched events in this week.');
      process.exit(1);
    }
    console.log(`Using ${highlights.length} selected event(s) from ${events.length} total.\n`);
  } else {
    console.log(`Found ${events.length} approved event(s). Picking highlights…\n`);
    highlights = selectHighlights(events);
  }

  const post = buildPost(highlights, events.length);

  const bar = '─'.repeat(62);
  console.log(bar);
  console.log('WEEKLY POST');
  console.log(bar);
  console.log('');
  console.log(post);
  console.log('');
  console.log(bar);

  copyToClipboard(post);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
