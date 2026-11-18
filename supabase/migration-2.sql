-- Civic Lens migration 2: who decides, the approval path, source dates, live meetings, and item comments.
-- Run once in the SQL Editor after schema.sql. Safe to re-run.

alter table bodies add column if not exists watch_url text not null default ''
  check (watch_url = '' or watch_url ~ '^https://\S+$');
alter table bodies add column if not exists comment_guide text not null default '';

alter table items add column if not exists decided_by_body_id text references bodies(id);
alter table items add column if not exists approval_path text[] not null default '{}';
alter table items add column if not exists verified_at timestamptz;

alter table meetings drop constraint if exists meetings_status_check;
alter table meetings add constraint meetings_status_check
  check (status in ('scheduled', 'in_progress', 'held', 'cancelled'));

-- Comments on an agenda item. Only residents of the item's body can post. Everyone can read.
create table if not exists item_comments (
  id uuid primary key default gen_random_uuid(),
  item_id text not null references items(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('question', 'information', 'opinion')),
  body text not null check (char_length(trim(body)) between 1 and 1000),
  source_url text not null default '' check (source_url = '' or source_url ~ '^https://\S+$'),
  created_at timestamptz not null default now(),
  constraint item_comments_info_needs_source check (kind <> 'information' or source_url <> '')
);
create index if not exists item_comments_item_idx on item_comments (item_id, created_at);
alter table item_comments enable row level security;

drop policy if exists item_comments_insert on item_comments;
create policy item_comments_insert on item_comments for insert to authenticated with check (
  author_id = auth.uid()
  and exists (
    select 1
    from items i
    join meetings m on m.id = i.meeting_id
    join profiles p on p.id = auth.uid()
    where i.id = item_id and m.body_id = any (p.body_ids)
  )
);

-- Read through a view so commenters' ids stay hidden and nicknames show.
create or replace view item_comment_view as
select c.id, c.item_id, c.kind, c.body, c.source_url, c.created_at, p.nickname as author_name
from item_comments c
join profiles p on p.id = c.author_id;

revoke all on item_comments from anon, authenticated;
grant insert on item_comments to authenticated;
grant select on item_comment_view to authenticated;
revoke all on item_comment_view from anon;
