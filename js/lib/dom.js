// Small DOM helpers shared by every view.
export const $ = (selector, root = document) => root.querySelector(selector);

// Escape any user-written text before placing it in HTML.
export const esc = value => String(value ?? '').replace(/[&<>"']/g, ch =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
