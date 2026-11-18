// Comments on one agenda item. Residents of the body can post. The database checks membership.
import { sb, unwrap } from '../lib/supabase.js';

export async function listComments(itemId) {
  return unwrap(await sb().from('item_comment_view').select('*')
    .eq('item_id', itemId)
    .order('created_at'))
    .map(r => ({
      id: r.id,
      kind: r.kind,
      body: r.body,
      sourceUrl: r.source_url,
      authorName: r.author_name,
      createdAt: r.created_at,
    }));
}

export async function addComment({ userId, itemId, kind, body, sourceUrl = '' }) {
  unwrap(await sb().from('item_comments').insert({
    author_id: userId,
    item_id: itemId,
    kind,
    body: body.trim(),
    source_url: sourceUrl.trim(),
  }));
}
