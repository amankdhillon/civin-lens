// Messages that appear at the bottom of the screen.
// Errors stay until the user dismisses them. Other messages fade after 5 seconds.
// Use announce() for updates that should be read aloud without appearing on screen.

export function toast(message, tone = 'info') {
  const host = document.getElementById('toasts');
  const node = document.createElement('div');
  node.className = `toast${tone === 'error' ? ' toast--error' : ''}`;
  node.setAttribute('role', tone === 'error' ? 'alert' : 'status');

  const text = document.createElement('span');
  text.textContent = message;
  node.append(text);

  if (tone === 'error') {
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'toast__close';
    close.textContent = 'Dismiss';
    close.addEventListener('click', () => node.remove());
    node.append(close);
  } else {
    setTimeout(() => node.remove(), 5000);
  }
  host.append(node);
}

// Reads a message to screen-reader users through the hidden live region in index.html.
export function announce(message) {
  const live = document.getElementById('status');
  if (!live) return;
  live.textContent = '';
  setTimeout(() => { live.textContent = message; }, 50);
}
