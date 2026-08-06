// Draft persistence for the submit-event form.
//
// Shared by `src/pages/index.astro` and `src/components/AppModals.astro`, the
// two independent copies of the modal system. Everything else in those files is
// duplicated and has to be fixed twice; this is the one piece that must not be,
// because a draft written by one copy is read by the other — start an event on
// `/`, follow the terms link, and the form there has to understand the shape.
//
// `sessionStorage`, not `localStorage`: a draft should not outlive the tab it
// was typed in, or a stale half-event greets the next visit. Every access is
// guarded — Safari's private mode throws on write rather than no-opping.

export const DRAFT_KEY = 'naas-event-draft';

// Fields with no value are omitted rather than stored as ''. `apply` then skips
// them, which is what lets a restore leave untouched controls alone.
export function serialise(fields) {
    const draft = {};
    fields.forEach(el => {
        if (el.type === 'radio') { if (el.checked) draft[el.name] = el.value; }
        else if (el.type === 'checkbox') draft[el.id] = el.checked;
        else if (el.value) draft[el.id] = el.value;
    });
    return draft;
}

export function apply(fields, draft) {
    fields.forEach(el => {
        if (el.type === 'radio') { if (draft[el.name] !== undefined) el.checked = draft[el.name] === el.value; }
        else if (el.type === 'checkbox') { if (draft[el.id] !== undefined) el.checked = draft[el.id]; }
        else if (draft[el.id] !== undefined) el.value = draft[el.id];
    });
}

export function saveDraft(fields) {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(serialise(fields))); } catch (e) { /* private mode / quota */ }
}

export function hasDraft() {
    try { return sessionStorage.getItem(DRAFT_KEY) !== null; } catch (e) { return false; }
}

export function clearDraft() {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) { /* nothing to lose */ }
}

export function readDraft() {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null'); } catch (e) { clearDraft(); return null; }
}
