// Entry point. Connects, loads the signed-in profile, routes each hash change to a view, and shows the account corner.
import { state } from './state.js';
import { routes } from './routes.js';
import { ensureSession, loadMe, signOut } from './services/auth.js';
import { toast } from './components/toast.js';
import { card } from './components/ui.js';
import { currentPath, go } from './lib/nav.js';
import { esc } from './lib/dom.js';
import { friendly } from './lib/supabase.js';
import { SUPABASE_URL } from './config.js';

const app = document.getElementById('app');
const corner = document.getElementById('me');
let stopLive = null;
let renderId = 0;

function findRoute(path) {
  for (const route of routes) {
    const match = route.pattern.exec(path);
    if (match) return { route, params: match.slice(1) };
  }
  return { route: routes.find(r => r.name === 'home'), params: [] };
}

// Returns true if the route may open. Otherwise it redirects to the next step.
function allowed(route) {
  if (route.need === 'none') return true;
  if (!state.me) { go('/welcome'); return false; }
  if (route.need === 'profile') return true;
  if (!state.me.bodyIds.length) { go('/address'); return false; }
  return true;
}

function paintCorner() {
  corner.innerHTML = state.me
    ? `<span class="me__name">${esc(state.me.nickname)}</span>
       <button class="link" type="button" id="signout">Sign out</button>`
    : '';
}

async function render() {
  const token = ++renderId;
  if (stopLive) { stopLive(); stopLive = null; }
  paintCorner();

  const { route, params } = findRoute(currentPath());
  const container = document.createElement('div');
  container.className = 'view';
  app.replaceChildren(container);

  if (state.bootError) {
    container.innerHTML = card({
      title: 'Civic Lens could not connect',
      body: `<p>${esc(friendly(state.bootError.message))}</p>
             <p class="note">Check the project URL and key in js/config.js. The connection check is in the BallotBridge project's debug page.</p>`,
    });
    return;
  }

  if (!allowed(route)) return;

  try {
    const stop = await route.view(params, container);
    if (token !== renderId) { if (typeof stop === 'function') stop(); return; }
    if (typeof stop === 'function') stopLive = stop;
  } catch (e) {
    container.innerHTML = card({
      title: 'Something went wrong',
      body: `<p>${esc(friendly(e.message))}</p>
             <a class="btn btn--ghost" href="#/">Back to home</a>`,
    });
  }
}

corner.addEventListener('click', async e => {
  if (!e.target.closest('#signout')) return;
  try {
    await signOut();
    await ensureSession();
    state.me = null;
    toast('Signed out');
    go('/welcome');
  } catch (err) {
    toast(err.message, 'error');
  }
});

async function boot() {
  window.addEventListener('hashchange', render);
  window.addEventListener('route:refresh', render);
  if (!location.hash) history.replaceState(null, '', '#/');

  if (SUPABASE_URL.includes('YOUR-')) {
    state.bootError = new Error('The project URL is still a placeholder.');
  } else {
    try {
      await ensureSession();
      state.me = await loadMe();
    } catch (e) {
      state.bootError = e;
    }
  }
  render();
}

boot();
