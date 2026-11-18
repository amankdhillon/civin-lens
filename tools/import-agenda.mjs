// Loads agenda files from data/agendas into Supabase.
// Checks every file first. If anything is wrong, nothing is written.
// Run from this folder with the SECRET key in the environment. Never put the secret key in the website.
//   SUPABASE_URL=https://your-project.supabase.co SUPABASE_SECRET_KEY=... node import-agenda.mjs

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const agendaDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'agendas');
const STAGES = ['introduced', 'committee', 'vote', 'decided', 'continued', 'information_only'];
const BASIS = ['agenda', 'official'];
const isHttps = v => v === undefined || v === '' || /^https:\/\/\S+$/.test(v);

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SECRET_KEY;
if (!URL || !KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SECRET_KEY first.');
  process.exit(1);
}
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const { data: bodyRows, error: bodyError } = await sb.from('bodies').select('id');
if (bodyError) { console.error(bodyError.message); process.exit(1); }
const bodyIds = new Set(bodyRows.map(b => b.id));

const files = readdirSync(agendaDir).filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json');
const meetings = [];
const items = [];
const errors = [];

for (const file of files) {
  const data = JSON.parse(readFileSync(join(agendaDir, file), 'utf8'));
  for (const m of data.meetings ?? []) {
    const where = `${file} > ${m.id}`;
    if (!m.id || !bodyIds.has(m.body)) errors.push(`${where}: unknown body "${m.body}"`);
    if (Number.isNaN(Date.parse(m.starts_at))) errors.push(`${where}: starts_at needs an ISO date with an offset`);
    if (!isHttps(m.agenda_url)) errors.push(`${where}: agenda_url must start with https://`);
    meetings.push({
      id: m.id, body_id: m.body, starts_at: m.starts_at, title: m.title ?? 'Regular meeting',
      location: m.location ?? '', agenda_url: m.agenda_url ?? '', status: m.status ?? 'scheduled',
      source_checked_at: new Date().toISOString(),
    });
    for (const it of m.items ?? []) {
      const iw = `${where} > ${it.id}`;
      if (!it.id || !it.title) errors.push(`${iw}: id and title are required`);
      if (!STAGES.includes(it.stage)) errors.push(`${iw}: stage must be one of ${STAGES.join(', ')}`);
      if (it.outcome && it.stage !== 'decided') errors.push(`${iw}: outcome is only allowed when stage is decided`);
      if (it.stage_basis && !BASIS.includes(it.stage_basis)) errors.push(`${iw}: stage_basis must be agenda or official`);
      if (!isHttps(it.source_url)) errors.push(`${iw}: source_url must start with https://`);
      if (it.decided_by && !bodyIds.has(it.decided_by)) errors.push(`${iw}: decided_by "${it.decided_by}" is not a known body`);
      items.push({
        id: it.id, meeting_id: m.id, title: it.title, summary: it.summary ?? '',
        what_it_decides: it.what_it_decides ?? '', who_it_affects: it.who_it_affects ?? '',
        stage: it.stage, outcome: it.outcome ?? '', stage_basis: it.stage_basis ?? 'agenda',
        comment_deadline: it.comment_deadline ?? null, source_url: it.source_url ?? '',
        decided_by_body_id: it.decided_by ?? null, approval_path: it.approval_path ?? [],
        verified_at: it.verified_at ?? null,
        updated_at: new Date().toISOString(),
      });
    }
  }
}

if (errors.length) {
  console.error('Nothing imported. Fix these first:');
  errors.forEach(e => console.error('  ' + e));
  process.exit(1);
}

const m1 = await sb.from('meetings').upsert(meetings, { onConflict: 'id' });
if (m1.error) { console.error('Meetings failed: ' + m1.error.message); process.exit(1); }
const i1 = await sb.from('items').upsert(items, { onConflict: 'id' });
if (i1.error) { console.error('Items failed: ' + i1.error.message); process.exit(1); }

console.log(`Imported ${meetings.length} meetings and ${items.length} items from ${files.length} file(s).`);
