// Date formatting, in one place. US English for now. Add locale support here when translations arrive.
export const fmtDateTime = (iso, withYear = false) => new Date(iso).toLocaleString('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  ...(withYear ? { year: 'numeric' } : {}),
  hour: 'numeric',
  minute: '2-digit',
});
