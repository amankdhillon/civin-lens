// Step 2: find the bodies that cover an address, then confirm them.
// The address is used once and cleared from the screen. Only the chosen body ids are saved.
import { state } from '../state.js';
import { esc } from '../lib/dom.js';
import { go } from '../lib/nav.js';
import { LEVELS, LEVEL_ORDER } from '../config.js';
import { listAllBodies } from '../services/bodies.js';
import { saveBodies, loadMe } from '../services/auth.js';
import { geocode, bodiesContaining } from '../lib/geo.js';
import { toast } from '../components/toast.js';

function checklist(bodies, checked) {
  return LEVEL_ORDER.map(level => {
    const group = bodies.filter(b => b.level === level);
    if (!group.length) return '';
    return `
      <fieldset class="level-group">
        <legend>${esc(LEVELS[level])}</legend>
        ${group.map(b => `
          <label class="checkbox body-option">
            <input type="checkbox" name="body" value="${esc(b.id)}" ${checked.has(b.id) ? 'checked' : ''}>
            <span><strong>${esc(b.name)}</strong>${b.districtLabel ? `<span class="muted"> · ${esc(b.districtLabel)}</span>` : ''}</span>
          </label>`).join('')}
      </fieldset>`;
  }).join('');
}

export async function renderAddress(root) {
  const bodies = await listAllBodies();

  root.innerHTML = `
    <section class="card narrow stack">
      <p class="eyebrow">Step 2 of 2</p>
      <h1>Enter your home address</h1>
      <p class="lead">We use it once to find the bodies that cover where you live, then clear it from the screen. The address is sent to the U.S. Census Bureau's lookup. It isn't saved.</p>
      <form id="addr" class="stack">
        <div class="field">
          <label for="address">Home address</label>
          <input id="address" class="input" autocomplete="street-address">
        </div>
        <div class="row">
          <button class="btn btn--primary" type="submit">Find my bodies</button>
          <button class="link" type="button" id="skip">Choose bodies without an address</button>
        </div>
      </form>
    </section>
    <div id="result" class="narrow" role="status" aria-live="polite"></div>`;

  const result = root.querySelector('#result');

  function showChoices(message, checkedIds) {
    result.innerHTML = `
      <section class="card stack">
        ${message ? `<p>${esc(message)}</p>` : ''}
        <form id="choices" class="stack">
          ${checklist(bodies, new Set(checkedIds))}
          <div class="row"><button class="btn btn--primary" type="submit">Save my bodies</button></div>
          <p class="form-error" id="choices-error" role="alert"></p>
        </form>
      </section>`;
    result.querySelector('#choices').addEventListener('submit', async e => {
      e.preventDefault();
      const errorEl = e.target.querySelector('#choices-error');
      const ids = [...e.target.querySelectorAll('input[name="body"]:checked')].map(i => i.value);
      if (!ids.length) { errorEl.textContent = 'Choose at least one body, or enter an address.'; return; }
      try {
        await saveBodies(state.me.id, ids);
        state.me = await loadMe();
        toast('Saved your bodies');
        go('/');
      } catch (err) {
        errorEl.textContent = err.message;
      }
    });
  }

  root.querySelector('#skip').addEventListener('click', () =>
    showChoices('Choose the bodies that govern you.', []));

  root.querySelector('#addr').addEventListener('submit', async e => {
    e.preventDefault();
    const input = root.querySelector('#address');
    const address = input.value.trim();
    input.value = ''; // don't leave the address on screen
    if (!address) { showChoices('Enter an address above, or choose your bodies from the list.', []); return; }

    result.innerHTML = '<p class="note">Looking up your address…</p>';
    try {
      const point = await geocode(address);
      if (!point) {
        showChoices("We couldn't find that address. Check the spelling, or choose your bodies from the list.", []);
        return;
      }
      const ids = await bodiesContaining(point, bodies);
      if (!ids.length) {
        showChoices('We found the address, but no bodies in this pilot cover it yet. Choose the bodies that apply.', []);
        return;
      }
      showChoices("These bodies cover your address. Uncheck any that don't apply, or add others.", ids);
    } catch {
      showChoices('The address lookup is unavailable right now. Choose your bodies from the list.', []);
    }
  });
}
