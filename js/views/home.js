// The main screen, in three columns: your bodies, upcoming meetings, and one agenda item.
// On narrow screens the columns stack in the same order.
import { state } from '../state.js';
import { esc } from '../lib/dom.js';
import { LEVELS, LEVEL_ORDER, STAGES, STAGE_LABEL } from '../config.js';
import { skeleton, empty } from '../components/ui.js';
import { listAllBodies, listUpcomingMeetings, getItem } from '../services/bodies.js';

const fmt = iso => new Date(iso).toLocaleString('en-US', {
  weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

function stageSteps(stage) {
  if (stage === 'information_only' || stage === 'continued') {
    return `<p><span class="badge">${esc(STAGE_LABEL[stage])}</span></p>`;
  }
  const idx = STAGES.indexOf(stage);
  const decided = stage === 'decided';
  return `
    <ol class="stages" aria-label="Where this item stands">
      ${STAGES.map((s, i) => {
        const done = decided || i < idx;
        const current = !decided && i === idx;
        const cls = done ? 'done' : current ? 'current' : '';
        const prefix = done ? '<span class="sr-only">Done: </span>' : current ? '<span class="sr-only">Current: </span>' : '';
        return `<li class="${cls}"${current ? ' aria-current="step"' : ''}>${prefix}${esc(STAGE_LABEL[s])}</li>`;
      }).join('')}
    </ol>`;
}

function bodyCard(body, next) {
  return `
    <a class="card body-card" href="#/body/${esc(body.id)}">
      <span class="meta">${esc(LEVELS[body.level])}${body.districtLabel ? ` · ${esc(body.districtLabel)}` : ''}</span>
      <strong>${esc(body.name)}</strong>
      <span class="muted">${next ? `Next meeting: ${esc(fmt(next.startsAt))}` : 'No upcoming meeting loaded'}</span>
    </a>`;
}

function meetingCard(m) {
  return `
    <article class="card meeting">
      <p class="meta">${esc(fmt(m.startsAt))} · ${esc(m.bodyName)}</p>
      <h3>${esc(m.title)}</h3>
      ${m.items.length
        ? `<ul class="plain">${m.items.map(i => `
            <li>
              <a href="#/item/${esc(i.id)}">${esc(i.title)}</a>
              <span class="tag">${esc(STAGE_LABEL[i.stage])}</span>
            </li>`).join('')}</ul>`
        : '<p class="empty">No agenda items posted yet.</p>'}
    </article>`;
}

function itemDetail(item) {
  const m = item.meeting;
  return `
    <p class="meta">${esc(m.bodyName)} · ${esc(fmt(m.startsAt))}${m.location ? ` · ${esc(m.location)}` : ''}</p>
    <h3 class="item-title">${esc(item.title)}</h3>
    ${stageSteps(item.stage)}
    ${item.stageBasis !== 'official'
      ? '<p class="note">The stage comes from the agenda. It hasn\'t been checked against the official record yet.</p>'
      : ''}
    <dl class="facts">
      ${item.summary ? `<dt>Summary</dt><dd>${esc(item.summary)}</dd>` : ''}
      ${item.whatItDecides ? `<dt>What this decides</dt><dd>${esc(item.whatItDecides)}</dd>` : ''}
      ${item.whoItAffects ? `<dt>Who it affects</dt><dd>${esc(item.whoItAffects)}</dd>` : ''}
      ${item.commentDeadline ? `<dt>Public comment deadline</dt><dd>${esc(fmt(item.commentDeadline))}</dd>` : ''}
      ${item.outcome ? `<dt>Outcome</dt><dd>${esc(item.outcome)}</dd>` : ''}
    </dl>
    ${item.sourceUrl
      ? `<p><a href="${esc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">Read the official agenda item</a></p>`
      : ''}
    <section class="discussion-note">
      <h4>Neighbor discussion</h4>
      <p class="note">Discussion for each item opens in a later wave.</p>
    </section>`;
}

export async function renderHome(root, itemId) {
  root.innerHTML = skeleton(3);
  const all = await listAllBodies();
  const mine = LEVEL_ORDER.flatMap(level => all.filter(b => b.level === level && state.me.bodyIds.includes(b.id)));
  const meetings = await listUpcomingMeetings(state.me.bodyIds);

  const selectedId = itemId || meetings.find(m => m.items.length)?.items[0]?.id || null;
  const item = selectedId ? await getItem(selectedId) : null;

  root.innerHTML = `
    <header class="civic-head">
      <div>
        <p class="eyebrow">Your government</p>
        <h1>What's coming up near you</h1>
      </div>
      <a class="btn btn--ghost" href="#/address">Change my bodies</a>
    </header>
    <div class="civic">
      <section class="col" aria-labelledby="bodies-h">
        <h2 id="bodies-h">Your bodies</h2>
        ${mine.length
          ? mine.map(b => bodyCard(b, meetings.find(m => m.bodyId === b.id))).join('')
          : empty('You haven\'t chosen any bodies yet.')}
      </section>
      <section class="col" aria-labelledby="up-h">
        <h2 id="up-h">Upcoming meetings</h2>
        ${meetings.length
          ? meetings.map(meetingCard).join('')
          : empty('No upcoming meetings are loaded for your bodies yet.')}
      </section>
      <section class="col col--wide" aria-labelledby="item-h">
        <h2 id="item-h">Agenda item</h2>
        ${item
          ? `<article class="card">${itemDetail(item)}</article>`
          : empty('Choose an agenda item to see where it stands.')}
      </section>
    </div>
    <p class="sample-note">Sample data. Replace with official agendas before any public test.</p>`;
}
