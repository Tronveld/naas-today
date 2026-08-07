// The modal system and the submit-event form, shared by every page that ships them.
//
// `index.astro` and `AppModals.astro` (which `/terms` uses) each carried a full
// copy of this — the second a TypeScript retype of the first, right down to the
// comments. CLAUDE.md documented the hazard rather than fixing it: "a fix to the
// modal system in one file does not fix the other". Two copies of a form that
// takes a 2000-character description is two chances to lose someone's typing.
//
// `src/scripts/draft.js` already had to be shared, because a draft written on
// `/` is read on `/terms`. This is the rest of it.

import { apply as applyDraft, saveDraft, hasDraft, clearDraft, readDraft } from './draft.js';
import { localDateStr } from './date.js';

// The address the site actually commits to, in ContactModal, /terms and
// PRODUCT.md. The relay address that used to be quoted here read like a scam
// to exactly the older resident this is built for — and it was only ever seen
// inside an OS dialog that said "naastoday.com says".
const CONTACT_EMAIL = 'hello@naastoday.com';

// ── Focus trap ───────────────────────────────────────────────────────────────
let previouslyFocused = null;

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Read at Tab time, not once at open. The submit sheet hides #recurringSection,
// #timeRangeSep and #eventTimeEnd behind display:none and reveals them as the
// visitor answers, so a list captured at open both includes controls that cannot
// take focus — last.focus() on one silently fails and Tab-wrap breaks — and misses
// the ones that appeared since. offsetParent is null for a display:none subtree.
function focusableIn(modal) {
  return [...modal.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null && !el.disabled);
}

function trapFocus(modal) {
  // Remove first: openModal on an already-open modal would otherwise stack a
  // second listener that closeModal's single remove can never reach.
  if (modal._trapHandler) modal.removeEventListener('keydown', modal._trapHandler);
  modal._trapHandler = function (e) {
    if (e.key !== 'Tab') return;
    const focusable = focusableIn(modal);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  modal.addEventListener('keydown', modal._trapHandler);
}

export function openModal(id) {
  previouslyFocused = document.activeElement;
  const modal = document.getElementById(id);
  modal.classList.add('active');
  document.body.classList.add('modal-open');
  // Skip the ✕: it matches the selector first in all four modals, so opening the
  // submit sheet used to land on Close rather than Event Title. About and Contact
  // have nothing else, and correctly fall back to it.
  const focusable = focusableIn(modal);
  const target = focusable.find(el => !el.classList.contains('modal-close')) || focusable[0];
  if (target) target.focus();
  trapFocus(modal);
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove('active');
  document.body.classList.remove('modal-open');
  if (modal._trapHandler) {
    modal.removeEventListener('keydown', modal._trapHandler);
    delete modal._trapHandler;
  }
  if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
}

/**
 * Wires the About and Contact modals, plus dismissal for every `.modal` on the page.
 *
 * Dismissing deliberately does NOT reset the submit form. A mistap outside the
 * sheet or a stray Escape used to wipe a submission with no confirm and no undo,
 * on a form that takes a description of up to 2000 characters. The modal only
 * hides, so leaving the fields alone is what lets a half-written event survive an
 * interruption. Cancel and a successful submit still reset it.
 */
export function initModals() {
  document.getElementById('aboutBtn')?.addEventListener('click', () => openModal('aboutModal'));
  document.getElementById('closeAboutModal')?.addEventListener('click', () => closeModal('aboutModal'));
  document.getElementById('contactBtn')?.addEventListener('click', () => openModal('contactModal'));
  document.getElementById('closeContactModal')?.addEventListener('click', () => closeModal('contactModal'));

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) closeModal(activeModal.id);
  });
}

// ── Submit form ──────────────────────────────────────────────────────────────

// Validation messaging.
//
// This replaced four alert() calls. They rendered as "naastoday.com says" on
// iOS, in a voice that is not the site's, and — worse for a form this long —
// they put the complaint in a box in the middle of the screen rather than next
// to the field that caused it. You dismissed the box and were left to find the
// offending input yourself.
//
// Each guarded field owns a <p class="field-error" id="<inputId>Error">.
function setFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  const slot  = document.getElementById(inputId + 'Error');
  if (!input || !slot) return;
  slot.textContent = message || '';
  slot.hidden = !message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (message) input.focus();
}

function clearErrors(form) {
  form.querySelectorAll('.field-error').forEach(slot => {
    slot.textContent = '';
    slot.hidden = true;
  });
  form.querySelectorAll('[aria-invalid="true"]').forEach(el => el.setAttribute('aria-invalid', 'false'));
  const formError = document.getElementById('formError');
  if (formError) { formError.textContent = ''; formError.hidden = true; }
}

function setFormError(message) {
  const slot = document.getElementById('formError');
  if (!slot) return;
  slot.textContent = message || '';
  slot.hidden = !message;
}

function updateRecurrenceHint() {
  const startDate = document.getElementById('eventDate').value;
  const endDate   = document.getElementById('recurrenceEndDate').value;
  const freq      = document.getElementById('recurrenceFrequency').value;
  const hint      = document.getElementById('recurrenceHint');
  if (!startDate || !endDate || endDate <= startDate) { hint.textContent = ''; return; }
  let count = 0, cur = new Date(startDate + 'T00:00:00');
  while (count < 104) {
    // localDateStr, not toISOString: cur is local midnight, so UTC conversion
    // hands back the previous day west of Greenwich and the count comes out one
    // short across the Irish summer-time boundary.
    const s = localDateStr(cur);
    if (s > endDate) break;
    count++;
    if (freq === 'weekly')           cur.setDate(cur.getDate() + 7);
    else if (freq === 'fortnightly') cur.setDate(cur.getDate() + 14);
    else                             cur.setMonth(cur.getMonth() + 1);
  }
  hint.textContent = count > 0 ? `~${count} occurrence${count !== 1 ? 's' : ''}` : '';
}

function readForm() {
  const val = (id) => document.getElementById(id).value;
  const checked = (id) => document.getElementById(id).checked;
  const timeMode = document.querySelector('input[name="timeMode"]:checked').value;

  return {
    title:       val('eventTitle').trim(),
    date:        val('eventDate'),
    endDate:     val('eventEndDate') || null,
    isAllDay:    timeMode === 'allday',
    time:        timeMode !== 'allday' ? val('eventTimeStart') : null,
    timeEnd:     timeMode === 'range'  ? val('eventTimeEnd')   : null,
    location:    val('eventLocation').trim(),
    description: val('eventDescription').trim(),
    isFree:      checked('isFree'),
    isForKids:   checked('isForKids'),
    isMusic:     checked('isMusic'),
    isSport:     checked('isSport'),
    isMarket:    checked('isMarket'),
    isTheatre:   checked('isTheatre'),
    url:         val('eventUrl').trim() || null,
  };
}

/**
 * Wires the submit-event modal: draft persistence, the time-mode radios, the
 * recurring section and the form submission.
 *
 * `defaultDate` returns the YYYY-MM-DD to prefill when the modal opens with no
 * draft waiting. On `/` that is the day being viewed; on `/terms`, today.
 */
export function initSubmitForm({ defaultDate }) {
  const form = document.getElementById('eventForm');
  if (!form) return;

  const draftFields = () => form.querySelectorAll('input, textarea, select');

  // ── Draft persistence ──────────────────────────────────────────────────────
  //
  // Not wiping the form on dismiss stopped a stray Escape losing it, but only
  // within one page load. A reload, a crash, or a tab the phone evicted still
  // lost everything. The draft is written on every keystroke and lives until the
  // submission lands or the visitor explicitly cancels.
  function restoreDraft() {
    const draft = readDraft();
    if (!draft) return;
    applyDraft(draftFields(), draft);
    // Values alone leave the dependent UI wrong — the recurring section stays
    // hidden, the end-time input stays collapsed, the counter reads 0. Re-fire
    // the events those handlers already listen for rather than repeating them.
    document.getElementById('isRecurring').dispatchEvent(new Event('change'));
    document.querySelector('input[name="timeMode"]:checked').dispatchEvent(new Event('change'));
    document.getElementById('eventDescription').dispatchEvent(new Event('input'));
    updateRecurrenceHint();
  }

  form.addEventListener('input', (e) => {
    saveDraft(draftFields());
    // A complaint about a field stops being true the moment they edit it.
    if (e.target.getAttribute('aria-invalid') === 'true') setFieldError(e.target.id, '');
  });
  form.addEventListener('reset', clearDraft);

  // ── Success panel ──────────────────────────────────────────────────────────
  const successPanel = document.getElementById('submitSuccess');
  // The wrapper, not the form: the intro copy above it has to go too, or the
  // thank-you sits under an invitation to submit the thing just submitted.
  const formPanel = document.getElementById('submitFormPanel');

  function showSuccess(on) {
    if (!successPanel || !formPanel) return;
    successPanel.hidden = !on;
    formPanel.hidden = on;
    if (on) successPanel.querySelector('button')?.focus();
  }

  document.getElementById('submitSuccessDone')?.addEventListener('click', () => closeModal('submitModal'));

  // ── Opening ────────────────────────────────────────────────────────────────
  // Every entry point opens on the default day — unless a draft is waiting, in
  // which case the date the visitor typed outranks it.
  function openSubmitModal() {
    // Always open on the form, never on last time's confirmation — covers the ✕
    // and Escape paths out of the success panel as well as the Done button.
    showSuccess(false);
    clearErrors(form);
    if (!hasDraft()) document.getElementById('eventDate').value = defaultDate();
    openModal('submitModal');
  }

  // `/` has all three; `/terms` only the footer button.
  document.getElementById('submitEventBtn')?.addEventListener('click', openSubmitModal);
  document.getElementById('submitEventFooterBtn')?.addEventListener('click', openSubmitModal);
  document.getElementById('emptySubmitBtn')?.addEventListener('click', openSubmitModal);

  document.getElementById('closeSubmitModal')?.addEventListener('click', () => closeModal('submitModal'));

  // Cancel is the one deliberate discard, so it is the one place that asks.
  // A native confirm() rather than a styled panel: this is a destructive action,
  // which is what the platform dialog is actually for.
  document.getElementById('cancelSubmit')?.addEventListener('click', () => {
    if (hasDraft() && !confirm('Discard this event? What you have typed will be lost.')) return;
    closeModal('submitModal');
    form.reset();
  });

  // ── Time mode ──────────────────────────────────────────────────────────────
  document.querySelectorAll('input[name="timeMode"]').forEach(radio => {
    radio.addEventListener('change', function () {
      const isAllDay = this.value === 'allday';
      const isRange  = this.value === 'range';
      document.getElementById('timeInputs').style.display    = isAllDay ? 'none' : 'flex';
      document.getElementById('eventTimeEnd').style.display  = isRange ? '' : 'none';
      document.getElementById('timeRangeSep').style.display  = isRange ? '' : 'none';
      document.getElementById('eventTimeStart').required     = !isAllDay;
    });
  });

  // ── Recurring ──────────────────────────────────────────────────────────────
  document.getElementById('isRecurring').addEventListener('change', function () {
    document.getElementById('recurringSection').style.display = this.checked ? '' : 'none';
    document.getElementById('recurrenceEndDate').required = this.checked;
  });

  document.getElementById('recurrenceFrequency').addEventListener('change', updateRecurrenceHint);
  document.getElementById('recurrenceEndDate').addEventListener('change', updateRecurrenceHint);
  document.getElementById('eventDate').addEventListener('change', updateRecurrenceHint);

  // ── Character counter ──────────────────────────────────────────────────────
  const descTextarea = document.getElementById('eventDescription');
  const charCounter  = document.getElementById('descCharCounter');
  if (descTextarea && charCounter) {
    descTextarea.addEventListener('input', () => {
      const n = descTextarea.value.length;
      charCounter.textContent = n === 0 ? 'A sentence or two is plenty' : `${n} / 2000`;
    });
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  // Deferred a tick: the browser clears the fields after the reset event fires,
  // so restoring the dependent UI synchronously would be undone by the reset.
  form.addEventListener('reset', () => {
    setTimeout(() => {
      document.getElementById('timeInputs').style.display   = 'flex';
      document.getElementById('eventTimeEnd').style.display = 'none';
      document.getElementById('timeRangeSep').style.display = 'none';
      document.getElementById('eventTimeStart').required    = true;
      document.getElementById('recurringSection').style.display = 'none';
      document.getElementById('recurrenceEndDate').required = false;
      document.getElementById('recurrenceHint').textContent = '';
    }, 0);
  });

  // ── Submission ─────────────────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    clearErrors(form);
    const baseEvent = readForm();

    if (baseEvent.endDate && baseEvent.endDate < baseEvent.date) {
      setFieldError('eventEndDate', 'This is before the start date.');
      return;
    }

    const isRecurring = document.getElementById('isRecurring').checked;
    const recEndDate  = document.getElementById('recurrenceEndDate').value;
    const frequency   = document.getElementById('recurrenceFrequency').value;

    if (isRecurring && (!recEndDate || recEndDate <= baseEvent.date)) {
      setFieldError('recurrenceEndDate', recEndDate
        ? 'This needs to be after the first date.'
        : 'Pick a date to repeat until.');
      return;
    }

    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    const endpoint = isRecurring ? 'submit-recurring' : 'submit-event';
    const payload  = isRecurring
      ? { baseEvent, recurrence: { frequency, endDate: recEndDate } }
      : baseEvent;

    try {
      const response = await fetch(`/.netlify/functions/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Submit failed: ${response.status}`);

      // The modal stays open and swaps to a panel rather than closing behind an
      // OS dialog. Closing first meant the confirmation arrived over a page that
      // had already moved on, with no sign the event had gone anywhere.
      form.reset();
      document.getElementById('submitSuccessBody').textContent = isRecurring
        ? `All ${result.count} dates are in. I'll read them and they should be on the site within a day or two.`
        : `I'll read it and it should be on the site within a day or two.`;
      showSuccess(true);
    } catch (error) {
      console.error(`Error submitting to ${endpoint}:`, error);
      setFormError(`That didn't send — the connection may have dropped. Try again, or email ${CONTACT_EMAIL} and I'll add it by hand.`);
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  // Last: it re-fires the change/input handlers registered above.
  restoreDraft();
}
