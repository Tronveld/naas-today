// Per-address attempt counting, shared by every function that limits callers.
//
// ponytail: in-memory, so a limit is per warm function instance — a cold start
// resets it and parallel instances each count separately. It slows a guesser
// down; it does not stop a determined one. The real protection for the admin
// password is its 12-character minimum and 310k PBKDF2 iterations. Move the
// counts into a Supabase table if a limit ever has to be exact.

function rateLimiter(limit, windowMs) {
  const hits = new Map();
  const entry = (ip, now) => {
    let e = hits.get(ip);
    if (!e || now - e.start > windowMs) {
      e = { start: now, count: 0 };
      hits.set(ip, e);
    }
    return e;
  };
  return {
    // Records one attempt; true when this one is over the limit.
    hit: (ip, now = Date.now()) => ++entry(ip, now).count > limit,
    // True when the limit is used up. Records nothing.
    over: (ip, now = Date.now()) => entry(ip, now).count >= limit,
  };
}

// Netlify's own header cannot be set by the caller; x-forwarded-for can.
function clientIp(event) {
  return event.headers['x-nf-client-connection-ip']
    || event.headers['x-forwarded-for']?.split(',')[0].trim()
    || 'unknown';
}

module.exports = { rateLimiter, clientIp };
