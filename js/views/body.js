// One governing body: what it is, its meetings, and where to find it. Who represents you comes in a later wave.
import { esc } from '../lib/dom.js';
import { LEVELS, STAGE_LABEL } from '../config.js';
import { skeleton, empty } from '../components/ui.js';
import { getBody, listMeetingsFor } from '../services/bodies.js';

const fmt = iso => new Date(iso).toLocaleString('en-US', {
  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
});

export async function renderBody(id, root) {
  root.innerHTML = skeleton(2);
  const [body, meetings] = await Promise.all([getBody(id), listMeetingsFor(id)]);

  root.innerHTML = `
    <a class="back" href="#/">← Your bodies</a>
    <header class="civic-head">
      <div>
        <p class="eyebrow">${esc(LEVELS[body.level])}${body.districtLabel ? ` · ${esc(body.districtLabel)}` : ''}</p>
        <h1>${esc(body.name)}</h1>
        <p class="lead">${esc(body.about)}</p>
      </div>
    </header>
    <section class="card stack">
      <h2>Meetings</h2>
      ${meetings.length
        ? `<ul class="plain">${meetings.map(m => `
            <li>
              <p class="meta">${esc(fmt(m.startsAt))}${m.status !== 'scheduled' ? ` · ${esc(m.status)}` : ''}</p>
              <p>${esc(m.title)}</p>
              ${m.items.length
                ? `<ul class="plain">${m.items.map(i => `<li><a href="#/item/${esc(i.id)}">${esc(i.title)}</a> <span class="tag">${esc(STAGE_LABEL[i.stage])}</span></li>`).join('')}</ul>`
                : ''}
            </li>`).join('')}</ul>`
        : empty('No meetings are loaded for this body yet.')}
    </section>
    <section class="card stack">
      <h2>Who represents you</h2>
      <p class="note">Coming in a later wave.</p>
    </section>
    ${body.sourceUrl || body.agendaUrl
      ? `<p class="stack">
           ${body.sourceUrl ? `<a href="${esc(body.sourceUrl)}" target="_blank" rel="noopener noreferrer">Official website for ${esc(body.name)}</a>` : ''}
           ${body.agendaUrl ? `<a href="${esc(body.agendaUrl)}" target="_blank" rel="noopener noreferrer">Official agendas</a>` : ''}
         </p>`
      : ''}`;
}
