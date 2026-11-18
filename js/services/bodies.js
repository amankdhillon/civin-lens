// Governing bodies, their meetings, and agenda items. Read-only for visitors.
import { sb, unwrap, AppError } from '../lib/supabase.js';

const safe = u => (/^https:\/\/\S+$/.test(u || '') ? u : '');

const toBody = r => ({
  id: r.id,
  name: r.name,
  level: r.level,
  districtLabel: r.district_label,
  about: r.about,
  sourceUrl: safe(r.source_url),
  agendaUrl: safe(r.agenda_url),
});

const toMeeting = r => ({
  id: r.id,
  bodyId: r.body_id,
  bodyName: r.bodies?.name ?? '',
  level: r.bodies?.level ?? '',
  startsAt: r.starts_at,
  title: r.title,
  location: r.location,
  agendaUrl: safe(r.agenda_url),
  status: r.status,
  items: (r.items ?? []).map(i => ({ id: i.id, title: i.title, stage: i.stage })),
});

export async function listAllBodies() {
  return unwrap(await sb().from('bodies').select('*').order('name')).map(toBody);
}

export async function getBody(id) {
  const row = unwrap(await sb().from('bodies').select('*').eq('id', id).maybeSingle());
  if (!row) throw new AppError('That body could not be found.');
  return toBody(row);
}

// Upcoming meetings for the given bodies, soonest first.
export async function listUpcomingMeetings(bodyIds) {
  if (!bodyIds.length) return [];
  const rows = unwrap(await sb().from('meetings')
    .select('*, bodies(name, level), items(id, title, stage)')
    .in('body_id', bodyIds)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at')
    .limit(60));
  return rows.map(toMeeting);
}

// Every meeting for one body, past and upcoming, newest first.
export async function listMeetingsFor(bodyId) {
  const rows = unwrap(await sb().from('meetings')
    .select('*, bodies(name, level), items(id, title, stage)')
    .eq('body_id', bodyId)
    .order('starts_at', { ascending: false })
    .limit(100));
  return rows.map(toMeeting);
}

export async function getItem(id) {
  const row = unwrap(await sb().from('items')
    .select('*, meetings(id, starts_at, title, location, agenda_url, body_id, bodies(id, name, level, district_label))')
    .eq('id', id)
    .maybeSingle());
  if (!row) return null;
  const m = row.meetings;
  const b = m?.bodies;
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    whatItDecides: row.what_it_decides,
    whoItAffects: row.who_it_affects,
    stage: row.stage,
    outcome: row.outcome,
    stageBasis: row.stage_basis,
    commentDeadline: row.comment_deadline,
    sourceUrl: safe(row.source_url),
    meeting: {
      id: m.id,
      startsAt: m.starts_at,
      title: m.title,
      location: m.location,
      bodyId: b.id,
      bodyName: b.name,
      level: b.level,
      districtLabel: b.district_label,
    },
  };
}
