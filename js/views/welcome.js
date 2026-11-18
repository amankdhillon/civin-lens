// Step 1: a nickname. No password.
import { state } from '../state.js';
import { createProfile, loadMe } from '../services/auth.js';
import { go } from '../lib/nav.js';

export function renderWelcome(root) {
  if (state.me) return go(state.me.bodyIds.length ? '/' : '/address');

  root.innerHTML = `
    <section class="hero">
      <div class="narrow">
        <p class="eyebrow">Local government, made visible</p>
        <h1>See who decides what affects you, and when</h1>
        <p class="lead">Enter your address to see the bodies that govern where you live, their upcoming meetings, and what is on each agenda. Talk with neighbors about the items that matter to you. No password, just a nickname.</p>
      </div>
    </section>
    <section class="card narrow">
      <form id="join" class="stack" novalidate>
        <div class="field">
          <label for="nick">Nickname</label>
          <input id="nick" name="nickname" class="input" maxlength="30" autocomplete="off" required aria-describedby="nick-hint">
          <p id="nick-hint" class="hint">Other people will see this name.</p>
        </div>
        <button class="btn btn--primary btn--block" type="submit">Continue</button>
        <p class="form-error" id="join-error" role="alert"></p>
      </form>
    </section>`;

  const form = root.querySelector('#join');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const errorEl = form.querySelector('#join-error');
    const submit = form.querySelector('button[type="submit"]');
    const nickname = String(new FormData(form).get('nickname') || '').trim();
    errorEl.textContent = '';
    if (!nickname) { errorEl.textContent = 'Enter a nickname to continue.'; form.querySelector('#nick').focus(); return; }

    submit.disabled = true;
    try {
      await createProfile(nickname);
      state.me = await loadMe();
      go('/address');
    } catch (err) {
      errorEl.textContent = err.message;
      submit.disabled = false;
    }
  });
}
