// One agenda item: who decides, where it stands, what it means, how to comment, and the discussion under it.
import { esc } from '../lib/dom.js';
import { fmtDateTime } from '../lib/format.js';
import { STAGES, STAGE_LABEL, COMMENT_KINDS, COMMENT_TEMPLATE } from '../config.js';

const KIND_LABEL = Object.fromEntries(COMMENT_KINDS.map(k => [k.value, k.label]));

export function stageSteps(stage) {
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

function commentFormHtml() {
  return `
    <form id="comment-form" class="stack comment-form">
      <div class="field">
        <label for="c-kind">Type</label>
        <select id="c-kind" name="kind" class="input">
          ${COMMENT_KINDS.map(k => `<option value="${esc(k.value)}">${esc(k.label)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="c-text">Your comment</label>
        <textarea id="c-text" name="body" class="input" rows="3" required></textarea>
      </div>
      <div class="field">
        <label for="c-source">Source link <span class="muted">(required for information)</span></label>
        <input id="c-source" name="source" class="input" type="url" placeholder="https://">
      </div>
      <div class="row"><button class="btn btn--primary btn--sm" type="submit">Post comment</button></div>
      <p class="form-error" role="alert"></p>
    </form>`;
}

// The list of comments, plus the form for residents or a note for everyone else.
export function discussionHtml(comments, canComment) {
  const list = comments.length
    ? `<ol class="comments">${comments.map(c => `
        <li class="comment">
          <p class="meta"><strong>${esc(c.authorName)}</strong> <span class="tag">${esc(KIND_LABEL[c.kind])}</span> ${esc(fmtDateTime(c.createdAt))}</p>
          <p class="comment__body">${esc(c.body)}</p>
          ${c.sourceUrl ? `<p><a href="${esc(c.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source</a></p>` : ''}
        </li>`).join('')}</ol>`
    : '<p class="empty">No comments yet. A question helps neighbors too.</p>';
  const form = canComment
    ? commentFormHtml()
    : '<p class="note">Residents of this body can comment. You can read everything.</p>';
  return list + form;
}

function howToComment(item) {
  const m = item.meeting;
  const deadline = item.commentDeadline
    ? `Deadline: ${esc(fmtDateTime(item.commentDeadline, true))}.`
    : 'Check the agenda for the comment deadline.';
  return `
    <details class="how-to">
      <summary>How to comment on this item</summary>
      <p>${deadline} Public comment goes through the body's own channel. The agenda lists the link and the time limit.</p>
      ${m.commentGuide ? `<p>${esc(m.commentGuide)}</p>` : ''}
      <pre class="template">${esc(COMMENT_TEMPLATE)}</pre>
      <button type="button" class="btn btn--ghost btn--sm" data-action="copy-template" data-text="${esc(COMMENT_TEMPLATE)}">Copy template</button>
    </details>`;
}

export function itemPanel(item, comments, canComment) {
  const m = item.meeting;
  const path = item.approvalPath.length
    ? `<p class="path">Path: ${item.approvalPath.map(esc).join(' → ')}</p>`
    : '';
  const links = [
    item.sourceUrl ? `<a href="${esc(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">Read the official agenda item</a>` : '',
    m.watchUrl ? `<a href="${esc(m.watchUrl)}" target="_blank" rel="noopener noreferrer">Watch the meeting</a>` : '',
  ].filter(Boolean).join(' · ');

  return `
    <article class="card item-panel" aria-labelledby="item-title">
      <p class="meta">${esc(m.bodyName)} · ${esc(fmtDateTime(m.startsAt))}${m.location ? ` · ${esc(m.location)}` : ''}</p>
      <h3 id="item-title" class="item-title">${esc(item.title)}</h3>
      <p class="decider"><strong>Who decides:</strong> ${item.decidedBy ? esc(item.decidedBy) : 'not yet confirmed'}</p>
      ${path}
      ${stageSteps(item.stage)}
      ${item.stageBasis !== 'official'
        ? '<p class="note">The stage comes from the agenda. It hasn\'t been checked against the official record yet.</p>'
        : ''}
      <dl class="facts">
        ${item.summary ? `<dt>Summary</dt><dd>${esc(item.summary)}</dd>` : ''}
        ${item.whatItDecides ? `<dt>What this decides</dt><dd>${esc(item.whatItDecides)}</dd>` : ''}
        ${item.whoItAffects ? `<dt>Who it affects</dt><dd>${esc(item.whoItAffects)}</dd>` : ''}
        ${item.outcome ? `<dt>Outcome</dt><dd>${esc(item.outcome)}</dd>` : ''}
      </dl>
      <p class="note">${item.verifiedAt
        ? `Source checked ${esc(fmtDateTime(item.verifiedAt, true))}.`
        : 'Not yet checked against the official record.'}</p>
      ${links ? `<p class="links">${links}</p>` : ''}
      ${howToComment(item)}
      <section class="discussion-block" aria-labelledby="discussion-h">
        <h4 id="discussion-h" tabindex="-1">Discussion on this item</h4>
        <div id="discussion">${discussionHtml(comments, canComment)}</div>
      </section>
    </article>`;
}
