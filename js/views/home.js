// The main screen, in three columns: your bodies, upcoming meetings, and one agenda item with its discussion.
// A banner appears above everything while a meeting is in progress. On narrow screens the columns stack.
import { state } from '../state.js';
import { esc } from '../lib/dom.js';
import { fmtDateTime } from '../lib/format.js';
import { LEVELS, LEVEL_ORDER, STAGE_LABEL, COMMENT_TEMPLATE } from '../config.js';
import { skeleton, empty } from '../components/ui.js';
import { toast } from '../components/toast.js';
import { listAllBodies, listUpcomingMeetings, getItem } from '../services/bodies.js';
import { listComments, addComment } from '../services/comments.js';
import { itemPanel, discussionHtml } from './item.js';

function bodyCard(body, next) {
  return `
    <a class="card body-card" href="#/body/${esc(body.id)}">
      <span class="meta">${esc(LEVELS[body.level])}${body.districtLabel ? ` · ${esc(body.districtLabel)}` : ''}</span>
      <strong>${esc(body.name)}</strong>
      <span class="muted">${next ? `Next meeting: ${esc(fmtDateTime(next.startsAt))}` : 'No upcoming meeting loaded'}</span>
    </a>`;
}

function meetingCard(m) {
  return `
    <article class="card meeting">
      <p class="meta">${esc(fmtDateTime(m.startsAt))} · ${esc(m.bodyName)}${m.status === 'in_progress' ? ' · in progress' : ''}</p>
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

function liveBanner(m) {
  return `
    <section class="live" aria-label="Meeting in progress">
      <p><strong>In progress:</strong> ${esc(m.bodyName)}, ${esc(m.title)}.</p>
      <a class="btn btn--ghost btn--sm" href="#/body/${esc(m.bodyId)}">Open ${esc(m.bodyName)}</a>
    </section>`;
}

export async function renderHome(root, itemId) {
  root.innerHTML = skeleton(3);
  const all = await listAllBodies();
  const mine = LEVEL_ORDER.flatMap(level => all.filter(b => b.level === level && state.me.bodyIds.includes(b.id)));
  const meetings = await listUpcomingMeetings(state.me.bodyIds);
  const live = meetings.find(m => m.status === 'in_progress');

  const selectedId = itemId || meetings.find(m => m.items.length)?.items[0]?.id || null;
  const item = selectedId ? await getItem(selectedId) : null;
  const comments = item ? await listComments(item.id) : [];
  const canComment = Boolean(item) && state.me.bodyIds.includes(item.meeting.bodyId);

  root.innerHTML = `
    ${live ? liveBanner(live) : ''}
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
          ? itemPanel(item, comments, canComment)
          : empty('Choose an agenda item to see where it stands.')}
      </section>
    </div>
    <p class="sample-note">Sample data. Replace with official agendas before any public test.</p>`;

  // One listener per action for this screen. Copy the how-to-comment template.
  root.addEventListener('click', e => {
    const copy = e.target.closest('[data-action="copy-template"]');
    if (!copy) return;
    const text = copy.dataset.text || COMMENT_TEMPLATE;
    navigator.clipboard?.writeText(text)
      .then(() => toast('Template copied'))
      .catch(() => toast('Could not copy. Select the template text instead.', 'error'));
  });

  // Post a comment. Information comments need a source link. The database also checks residency.
  root.addEventListener('submit', async e => {
    if (e.target.id !== 'comment-form' || !item) return;
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const kind = data.get('kind');
    const body = String(data.get('body') || '');
    const source = String(data.get('source') || '').trim();
    const errorEl = form.querySelector('.form-error');
    errorEl.textContent = '';
    if (!body.trim()) { errorEl.textContent = 'Write your comment first.'; return; }
    if (kind === 'information' && !/^https:\/\/\S+$/.test(source)) {
      errorEl.textContent = 'Information comments need a source link that starts with https://';
      return;
    }
    try {
      await addComment({ userId: state.me.id, itemId: item.id, kind, body, sourceUrl: source });
      const fresh = await listComments(item.id);
      root.querySelector('#discussion').innerHTML = discussionHtml(fresh, canComment);
      toast('Comment posted');
      root.querySelector('#discussion-h')?.focus();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}
