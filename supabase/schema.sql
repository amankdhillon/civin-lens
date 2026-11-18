-- Civic Lens schema. Use a SEPARATE Supabase project from BallotBridge.
-- Run once in the SQL Editor. Safe to re-run.

-- Governing bodies: the places that make decisions for an address.
create table if not exists bodies (
  id text primary key,
  name text not null,
  level text not null check (level in ('federal', 'state', 'county', 'city', 'school', 'special')),
  district_label text not null default '',
  about text not null default '',
  source_url text not null default '' check (source_url = '' or source_url ~ '^https://\S+$'),
  agenda_url text not null default '' check (agenda_url = '' or agenda_url ~ '^https://\S+$'),
  checked_at date
);

-- Meetings, loaded from each body's agenda source by the import tool.
create table if not exists meetings (
  id text primary key,
  body_id text not null references bodies(id) on delete cascade,
  starts_at timestamptz not null,
  title text not null default 'Regular meeting',
  location text not null default '',
  agenda_url text not null default '' check (agenda_url = '' or agenda_url ~ '^https://\S+$'),
  status text not null default 'scheduled' check (status in ('scheduled', 'held', 'cancelled')),
  source_checked_at timestamptz
);

-- Agenda items. The stage is what the agenda says, unless stage_basis is 'official' (checked against the record).
create table if not exists items (
  id text primary key,
  meeting_id text not null references meetings(id) on delete cascade,
  title text not null,
  summary text not null default '',
  what_it_decides text not null default '',
  who_it_affects text not null default '',
  stage text not null default 'introduced'
    check (stage in ('introduced', 'committee', 'vote', 'decided', 'continued', 'information_only')),
  outcome text not null default '',
  stage_basis text not null default 'agenda' check (stage_basis in ('agenda', 'official')),
  comment_deadline timestamptz,
  source_url text not null default '' check (source_url = '' or source_url ~ '^https://\S+$'),
  updated_at timestamptz not null default now(),
  constraint items_outcome_only_when_decided check (outcome = '' or stage = 'decided')
);

create index if not exists meetings_body_idx on meetings (body_id, starts_at);
create index if not exists items_meeting_idx on items (meeting_id);

-- Profiles hold a nickname and the body ids the user chose. The address is never stored.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 30),
  body_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table bodies enable row level security;
alter table meetings enable row level security;
alter table items enable row level security;
alter table profiles enable row level security;

drop policy if exists bodies_read on bodies;
drop policy if exists meetings_read on meetings;
drop policy if exists items_read on items;
drop policy if exists profiles_read_own on profiles;
drop policy if exists profiles_insert_own on profiles;
drop policy if exists profiles_update_own on profiles;
create policy bodies_read on bodies for select to authenticated using (true);
create policy meetings_read on meetings for select to authenticated using (true);
create policy items_read on items for select to authenticated using (true);
create policy profiles_read_own on profiles for select to authenticated using (id = auth.uid());
create policy profiles_insert_own on profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Visitors read public agenda data. Only the import tool (secret key) writes agendas.
revoke all on bodies, meetings, items, profiles from anon;
grant select on bodies, meetings, items, profiles to authenticated;
revoke insert, update on profiles from authenticated;
grant insert (id, nickname) on profiles to authenticated;
grant update (nickname, body_ids) on profiles to authenticated;
