// Anonymous sessions and profiles. No passwords. The address is never stored, only the body ids.
import { sb, unwrap, AppError } from '../lib/supabase.js';

export async function ensureSession() {
  const { data } = await sb().auth.getSession();
  if (!data.session) unwrap(await sb().auth.signInAnonymously());
}

export async function loadMe() {
  const { data } = await sb().auth.getUser();
  if (!data?.user) return null;
  const row = unwrap(await sb().from('profiles').select('*').eq('id', data.user.id).maybeSingle());
  if (!row) return null;
  return { id: row.id, nickname: row.nickname, bodyIds: row.body_ids ?? [] };
}

export async function createProfile(nickname) {
  const { data } = await sb().auth.getUser();
  if (!data?.user) throw new AppError('Your session expired. Reload the page and try again.');
  unwrap(await sb().from('profiles').insert({ id: data.user.id, nickname: nickname.slice(0, 30) }));
}

export async function saveBodies(userId, bodyIds) {
  unwrap(await sb().from('profiles').update({ body_ids: bodyIds }).eq('id', userId));
}

export async function signOut() {
  await sb().auth.signOut();
}
