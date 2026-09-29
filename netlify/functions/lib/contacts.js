// The optional submitter email lives in `submission_contacts`, never on `events`:
// the anon key can read every approved event row, so a column there is public.
// RLS lets anon insert here and nothing else; only the service-role key reads it.

// The event is already saved by the time this runs, so a failure is logged and
// swallowed — losing the way to contact them beats losing the submission.
async function saveContact(supabaseUrl, anonKey, eventId, email) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/submission_contacts`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ event_id: eventId, email }),
    });
    if (!res.ok) console.error('Saving submission contact failed:', await res.text());
  } catch (err) {
    console.error('Saving submission contact failed:', err);
  }
}

// Retention: nothing is kept after moderation. Deleting the event cascades;
// approving it calls this.
async function deleteContacts(supabaseUrl, secretKey, eventIds) {
  if (!eventIds.length) return;
  const list = eventIds.map(encodeURIComponent).join(',');
  const res = await fetch(`${supabaseUrl}/rest/v1/submission_contacts?event_id=in.(${list})`, {
    method: 'DELETE',
    headers: { 'apikey': secretKey, 'Prefer': 'return=minimal' },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
}

module.exports = { saveContact, deleteContacts };
