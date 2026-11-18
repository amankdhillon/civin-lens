// Presentational helpers that return HTML strings. Text passed in is escaped.
import { esc } from '../lib/dom.js';

export const card = ({ title = '', actions = '', body = '', tone = '' } = {}) => `
  <section class="card ${tone}">
    ${title || actions ? `<header class="card__head">${title ? `<h2>${esc(title)}</h2>` : ''}${actions}</header>` : ''}
    <div class="card__body">${body}</div>
  </section>`;

export const badge = (label, tone = 'neutral') => `<span class="badge badge--${tone}">${esc(label)}</span>`;
export const tag = label => `<span class="tag">${esc(label)}</span>`;

export const button = ({ label, variant = 'primary', attrs = '', type = 'button', disabled = false }) =>
  `<button type="${type}" class="btn btn--${variant}" ${attrs} ${disabled ? 'disabled' : ''}>${esc(label)}</button>`;

export const field = ({ id, label, control, hint = '' }) => `
  <div class="field">
    <label for="${esc(id)}">${esc(label)}</label>
    ${control}
    ${hint ? `<p class="hint">${esc(hint)}</p>` : ''}
  </div>`;

export const select = ({ id, name = id, options, value }) => `
  <select id="${esc(id)}" name="${esc(name)}" class="input">
    ${options.map(o => `<option value="${esc(o)}" ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('')}
  </select>`;

export const empty = message => `<p class="empty">${esc(message)}</p>`;

export const skeleton = (count = 1) => Array.from({ length: count }, () => '<div class="skeleton" aria-hidden="true"></div>').join('');

// Dialog behavior: focus moves in, Tab stays inside, Escape closes, and focus returns to the trigger.
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const modalEl = document.getElementById('modal');
let returnFocus = null;

// Keep the page behind the dialog out of the tab order and out of screen-reader browsing.
function setBackgroundInert(on) {
  ['.topbar', '#app'].forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.inert = on;
  });
}

export function openModal(html) {
  returnFocus = document.activeElement;
  modalEl.innerHTML = `<section class="card" role="dialog" aria-modal="true" aria-labelledby="modal-title">${html}</section>`;
  const heading = modalEl.querySelector('h2');
  if (heading) heading.id = 'modal-title';
  modalEl.hidden = false;
  setBackgroundInert(true);
  modalEl.querySelector(FOCUSABLE)?.focus();
}

export function closeModal() {
  if (modalEl.hidden) return;
  modalEl.hidden = true;
  modalEl.innerHTML = '';
  setBackgroundInert(false);
  if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
  returnFocus = null;
}

// Close on backdrop click or any element with data-close.
modalEl.addEventListener('click', e => {
  if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal();
});

// Keep Tab inside the dialog.
modalEl.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const items = [...modalEl.querySelectorAll(FOCUSABLE)];
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

// Escape closes the dialog from anywhere.
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modalEl.hidden) closeModal();
});

// Contributors get a star with an accessible name. Viewers get a quiet word. No color-only cues.
const STAR_PATH = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z';

export const roleBadge = verified => verified
  ? `<span class="role role--contributor" title="Contributor"><svg class="star" width="14" height="14" viewBox="0 0 24 24" role="img" aria-label="Contributor" focusable="false"><path d="${STAR_PATH}" fill="currentColor"/></svg></span>`
  : '';

export const thumbIcon = () =>
  `<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 10v11H3V10h4zm0 0 4-7a2 2 0 0 1 2 2v3h6.2a2 2 0 0 1 2 2.3l-1.4 7.4A2 2 0 0 1 17.8 21H7" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;

// One letter for the avatar. Anonymous posts get a question mark.
export const initialOf = name => (name === 'Anonymous' ? '?' : (String(name ?? '').trim().charAt(0).toUpperCase() || '?'));
