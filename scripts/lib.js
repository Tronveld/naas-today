#!/usr/bin/env node
'use strict';

/**
 * lib.js — shared utilities for Naas Today scripts.
 */

const fs   = require('fs');
const path = require('path');

// ── Load .env ─────────────────────────────────────────────────────────────────
function loadEnv() {
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
}

// ── Named HTML entities ────────────────────────────────────────────────────────
const HTML_ENT = {
  nbsp: ' ',  rsquo: '\u2019', lsquo: '\u2018', rdquo: '\u201D', ldquo: '\u201C',
  mdash: '\u2014', ndash: '\u2013', hellip: '\u2026', bull: '\u2022',
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  copy: '\u00A9', reg: '\u00AE', trade: '\u2122', euro: '\u20AC', pound: '\u00A3',
  // Latin-1 supplement — accented characters common in European text
  aacute: 'á', Aacute: 'Á', agrave: 'à', Agrave: 'À', acirc: 'â', Acirc: 'Â',
  auml: 'ä', Auml: 'Ä', atilde: 'ã', Atilde: 'Ã', aring: 'å', Aring: 'Å',
  aelig: 'æ', AElig: 'Æ',
  eacute: 'é', Eacute: 'É', egrave: 'è', Egrave: 'È', ecirc: 'ê', Ecirc: 'Ê',
  euml: 'ë', Euml: 'Ë',
  iacute: 'í', Iacute: 'Í', igrave: 'ì', Igrave: 'Ì', icirc: 'î', Icirc: 'Î',
  iuml: 'ï', Iuml: 'Ï',
  oacute: 'ó', Oacute: 'Ó', ograve: 'ò', Ograve: 'Ò', ocirc: 'ô', Ocirc: 'Ô',
  ouml: 'ö', Ouml: 'Ö', otilde: 'õ', Otilde: 'Õ', oslash: 'ø', Oslash: 'Ø',
  uacute: 'ú', Uacute: 'Ú', ugrave: 'ù', Ugrave: 'Ù', ucirc: 'û', Ucirc: 'Û',
  uuml: 'ü', Uuml: 'Ü',
  ntilde: 'ñ', Ntilde: 'Ñ', ccedil: 'ç', Ccedil: 'Ç', szlig: 'ß',
  yacute: 'ý', Yacute: 'Ý', yuml: 'ÿ',
  // Math / misc
  times: '×', divide: '÷', frac12: '½', frac14: '¼', frac34: '¾',
  iexcl: '¡', iquest: '¿', ordf: 'ª', ordm: 'º', deg: '°',
};

// ── HTML → plain text ─────────────────────────────────────────────────────────
function stripHtml(html) {
  return (html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(p|div|li|tr|td|th|h[1-6])[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&([a-zA-Z]+);/g, (m, n) => HTML_ENT[n] ?? m)
    .replace(/&#(\d+);/g,      (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Matches common "for kids" signals ─────────────────────────────────────────
const KIDS_RE = /\b(bab(y|ies)|toddler|children|child\b|kids?|\d+\s*-?\s*year\s*-?\s*olds?|junior|youth|playgroup|storytime for)\b/i;

// ── Title normalisation for duplicate detection ───────────────────────────────
function normaliseTitle(t) {
  return t
    .toLowerCase()
    .replace(/\s*([:\-–—\/|,;])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Supabase client factory ───────────────────────────────────────────────────
// Returns { get, post, isDuplicate, cacheInserted }.
// isDuplicate caches per-date DB queries for the lifetime of the client instance.
// Call cacheInserted after each successful insert so subsequent isDuplicate calls
// within the same run detect just-inserted events as duplicates.
function createClient(url, key) {
  const dateCache = new Map(); // date → { title: string }[]

  async function get(p) {
    const res = await fetch(`${url}/rest/v1${p}`, {
      headers: { apikey: key },
    });
    if (!res.ok) throw new Error(`Supabase GET ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async function post(p, body) {
    const res = await fetch(`${url}/rest/v1${p}`, {
      method:  'POST',
      headers: {
        apikey:         key,
        'Content-Type': 'application/json',
        Prefer:         'return=minimal',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Supabase POST ${res.status}: ${await res.text()}`);
  }

  async function isDuplicate(title, date) {
    let rows;
    if (dateCache.has(date)) {
      rows = dateCache.get(date);
    } else {
      rows = await get(`/events?date=eq.${encodeURIComponent(date)}&select=title`);
      dateCache.set(date, rows);
    }
    const normNew = normaliseTitle(title);
    return rows.some(r => {
      const normEx = normaliseTitle(r.title);
      return normNew === normEx || normNew.startsWith(normEx) || normEx.startsWith(normNew);
    });
  }

  function cacheInserted(title, date) {
    const rows = dateCache.get(date);
    if (rows) rows.push({ title });
  }

  return { get, post, isDuplicate, cacheInserted };
}

module.exports = { loadEnv, HTML_ENT, stripHtml, KIDS_RE, normaliseTitle, createClient };
