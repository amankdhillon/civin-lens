// The single place where the Supabase client is created.
// Views and services import sb() and unwrap() from here.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';

let client = null;
export function sb() {
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}

export class AppError extends Error {}

// Turns database and auth messages into something testers can act on.
const MESSAGES = [
  ['row-level security', "Not allowed here. You can only post in your own jurisdiction, and explanations also need a verified account and a review first."],
  ['reviews_one_per_reviewer', 'You already reviewed this one.'],
  ['reviews_approve_needs_checks', 'Complete every check before approving, or request changes instead.'],
  ['reviews_changes_need_note', 'Say what needs to change in the note.'],
  ['sources_url_https', 'Enter a full link starting with https://'],
  ['posts_body_length', 'Write something first (1500 characters at most).'],
  ['profiles_nickname_length', 'Nicknames must be 1 to 30 characters.'],
  ['anonymous_provider_disabled', 'Anonymous sign-ins are off. Turn them on in Supabase: Authentication > Sign In / Providers.'],
  ['Anonymous sign-ins', 'Anonymous sign-ins are off. Turn them on in Supabase: Authentication > Sign In / Providers.'],
  ['Failed to fetch', 'Cannot reach Supabase. Check your internet connection and the project URL in js/config.js.'],
];

export function friendly(message = '') {
  const hit = MESSAGES.find(([needle]) => message.includes(needle));
  return hit ? hit[1] : message;
}

// Unwraps a Supabase { data, error } response, or throws a readable AppError.
export function unwrap(response) {
  if (response.error) throw new AppError(friendly(response.error.message || ''));
  return response.data;
}
