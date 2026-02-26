-- Schéma Arie's backend (local Postgres)

-- 1) TABLE players (base de tout le reste)
create table if not exists public.players (
  id text primary key,
  name text not null,
  avatar_url text null,
  avatar jsonb null,
  coins bigint not null default 0,
  last_event_at timestamptz null,
  created_at timestamptz not null default now(),
  has_mod_installed boolean not null default false,
  mod_version text null,
  api_key text unique null,
  badges text[] not null default '{}',
  constraint players_badges_check check (badges <@ array['mod_creator', 'supporter']::text[])
);

create index if not exists players_name_idx
  on public.players using btree (name);

create index if not exists players_created_at_idx
  on public.players using btree (created_at desc);

create index if not exists players_last_event_at_idx
  on public.players using btree (last_event_at desc);

create index if not exists players_coins_idx
  on public.players using btree (coins desc);


-- 2) TABLE blocked_ips
create table if not exists public.blocked_ips (
  ip text primary key,
  reason text null,
  blocked_at timestamptz not null default now()
);


-- 3) TABLE rooms
create table if not exists public.rooms (
  id text primary key,
  is_private boolean not null default false,
  last_updated_at timestamptz null,
  last_updated_by_player_id text null,
  created_at timestamptz not null default now(),
  players_count integer not null default 0,
  user_slots jsonb null,
  admin_privacy_override text null default null,
  constraint rooms_last_updated_by_player_id_fkey
    foreign key (last_updated_by_player_id)
    references public.players (id)
);

create index if not exists room_last_updated_at_idx
  on public.rooms using btree (last_updated_at);

create index if not exists rooms_created_at_idx
  on public.rooms using btree (created_at desc);


-- 4) TABLE room_players
create table if not exists public.room_players (
  room_id text not null,
  player_id text not null,
  joined_at timestamptz not null default now(),
  left_at timestamptz null,
  constraint room_players_pkey primary key (room_id, player_id),
  constraint room_players_player_id_fkey
    foreign key (player_id) references public.players (id) on delete cascade,
  constraint room_players_room_id_fkey
    foreign key (room_id) references public.rooms (id) on delete cascade
);

create index if not exists room_players_player_id_idx
  on public.room_players using btree (player_id);

create index if not exists room_players_room_id_idx
  on public.room_players using btree (room_id);

create index if not exists room_players_room_joined_idx
  on public.room_players using btree (room_id, joined_at);


-- 5) TABLE player_state
create table if not exists public.player_state (
  player_id text primary key,
  garden jsonb null,
  inventory jsonb null,
  stats jsonb null,
  updated_at timestamptz not null default now(),
  activity_log jsonb null,
  journal jsonb null,
  constraint player_state_player_id_fkey
    foreign key (player_id) references public.players (id) on delete cascade
);


-- 6) TABLE player_privacy
create table if not exists public.player_privacy (
  player_id text primary key,
  show_profile boolean null,
  show_garden boolean null,
  show_inventory boolean null,
  show_coins boolean null,
  show_activity_log boolean null,
  hide_room_from_public_list boolean null,
  updated_at timestamptz not null default now(),
  show_journal boolean null,
  show_stats boolean null,
  constraint player_privacy_player_id_fkey
    foreign key (player_id) references public.players (id) on delete cascade
);


-- 7) TABLE player_relationships (amis / pending / rejected)
create table if not exists public.player_relationships (
  user_one_id text not null,
  user_two_id text not null,
  requested_by text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_relationships_pkey
    primary key (user_one_id, user_two_id),
  constraint player_relationships_requested_by_fkey
    foreign key (requested_by) references public.players (id) on delete cascade,
  constraint player_relationships_user_one_id_fkey
    foreign key (user_one_id) references public.players (id) on delete cascade,
  constraint player_relationships_user_two_id_fkey
    foreign key (user_two_id) references public.players (id) on delete cascade,
  constraint player_relationships_status_check check (
    status = any (array['pending'::text, 'accepted'::text, 'rejected'::text])
  )
);

create index if not exists player_relationships_requested_by_idx
  on public.player_relationships using btree (requested_by);

create index if not exists player_relationships_user_one_idx
  on public.player_relationships using btree (user_one_id);

create index if not exists player_relationships_user_two_idx
  on public.player_relationships using btree (user_two_id);

create index if not exists player_relationships_status_idx
  on public.player_relationships using btree (status);

create index if not exists player_relationships_status_created_idx
  on public.player_relationships using btree (status, created_at desc);

create index if not exists player_relationships_accepted_user_one_idx
  on public.player_relationships using btree (user_one_id)
  where status = 'accepted';

create index if not exists player_relationships_accepted_user_two_idx
  on public.player_relationships using btree (user_two_id)
  where status = 'accepted';

-- 7bis) TABLE direct_messages
create table if not exists public.direct_messages (
  id bigserial primary key,
  conversation_id text not null,
  sender_id text not null,
  recipient_id text not null,
  room_id text null,
  body text not null,
  created_at timestamptz not null default now(),
  delivered_at timestamptz not null default now(),
  read_at timestamptz null,
  constraint direct_messages_sender_id_fkey
    foreign key (sender_id) references public.players (id) on delete cascade,
  constraint direct_messages_recipient_id_fkey
    foreign key (recipient_id) references public.players (id) on delete cascade,
  constraint direct_messages_room_id_fkey
    foreign key (room_id) references public.rooms (id) on delete set null
);

create index if not exists direct_messages_conversation_idx
  on public.direct_messages using btree (conversation_id, id);

create index if not exists direct_messages_recipient_unread_idx
  on public.direct_messages using btree (recipient_id, read_at, created_at);

create index if not exists direct_messages_created_idx
  on public.direct_messages using btree (created_at desc);

create index if not exists direct_messages_created_sender_idx
  on public.direct_messages using btree (created_at desc, sender_id);

-- 7ter) TABLE groups / group_members / group_messages
create table if not exists public.groups (
  id bigserial primary key,
  name text not null,
  owner_id text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_owner_id_fkey
    foreign key (owner_id) references public.players (id) on delete cascade
);

create index if not exists groups_owner_idx
  on public.groups using btree (owner_id);

create index if not exists groups_created_idx
  on public.groups using btree (created_at desc);

create index if not exists groups_updated_idx
  on public.groups using btree (updated_at desc);

create index if not exists groups_is_public_idx
  on public.groups using btree (is_public)
  where is_public = true;

create table if not exists public.group_members (
  group_id bigint not null,
  player_id text not null,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  constraint group_members_pkey primary key (group_id, player_id),
  constraint group_members_group_id_fkey
    foreign key (group_id) references public.groups (id) on delete cascade,
  constraint group_members_player_id_fkey
    foreign key (player_id) references public.players (id) on delete cascade,
  constraint group_members_role_check check (
    role = any (array['owner'::text, 'admin'::text, 'member'::text])
  )
);

create index if not exists group_members_player_idx
  on public.group_members using btree (player_id);

create index if not exists group_members_group_idx
  on public.group_members using btree (group_id);

create table if not exists public.group_messages (
  id bigserial primary key,
  group_id bigint not null,
  sender_id text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint group_messages_group_id_fkey
    foreign key (group_id) references public.groups (id) on delete cascade,
  constraint group_messages_sender_id_fkey
    foreign key (sender_id) references public.players (id) on delete cascade
);

create index if not exists group_messages_group_idx
  on public.group_messages using btree (group_id, id);

create index if not exists group_messages_created_idx
  on public.group_messages using btree (created_at desc);

create table if not exists public.group_activity (
  id bigserial primary key,
  group_id bigint,
  group_name text not null,
  type text not null,
  actor_id text,
  member_id text,
  meta jsonb,
  created_at timestamptz not null default now(),
  constraint group_activity_group_id_fkey
    foreign key (group_id) references public.groups (id) on delete set null,
  constraint group_activity_actor_id_fkey
    foreign key (actor_id) references public.players (id) on delete set null,
  constraint group_activity_member_id_fkey
    foreign key (member_id) references public.players (id) on delete set null,
  constraint group_activity_type_check check (
    type = any (array[
      'group_created'::text,
      'group_deleted'::text,
      'group_member_added'::text,
      'group_member_removed'::text,
      'group_renamed'::text,
      'group_member_joined'::text,
      'group_role_changed'::text
    ])
  )
);

create index if not exists group_activity_created_idx
  on public.group_activity using btree (created_at desc);

create index if not exists group_activity_group_idx
  on public.group_activity using btree (group_id, created_at desc);

-- 7quater) TABLE leaderboard_stats
create table if not exists public.leaderboard_stats (
  player_id text primary key,
  coins bigint not null default 0,
  eggs_hatched bigint not null default 0,
  updated_at timestamptz not null default now(),
  coins_rank_snapshot integer,
  eggs_rank_snapshot integer,
  snapshot_at date,
  constraint leaderboard_stats_player_id_fkey
    foreign key (player_id) references public.players (id) on delete cascade
);

create index if not exists leaderboard_stats_coins_idx
  on public.leaderboard_stats using btree (coins desc);

create index if not exists leaderboard_stats_eggs_idx
  on public.leaderboard_stats using btree (eggs_hatched desc);

create index if not exists leaderboard_stats_updated_idx
  on public.leaderboard_stats using btree (updated_at desc);


-- 8) TABLE admin_broadcasts / admin_broadcast_receipts
create table if not exists public.admin_broadcasts (
  id bigserial primary key,
  action text not null,
  data jsonb null,
  target_type text not null default 'all',
  target_id text null,
  target_player_ids text[] null,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint admin_broadcasts_target_type_check check (
    target_type = any (array['all'::text, 'room'::text, 'group'::text, 'players'::text])
  )
);

create index if not exists admin_broadcasts_created_at_idx
  on public.admin_broadcasts using btree (created_at desc);

create table if not exists public.admin_broadcast_receipts (
  broadcast_id bigint not null,
  player_id text not null,
  sent_at timestamptz not null default now(),
  constraint admin_broadcast_receipts_pkey primary key (broadcast_id, player_id),
  constraint admin_broadcast_receipts_broadcast_id_fkey
    foreign key (broadcast_id) references public.admin_broadcasts (id) on delete cascade,
  constraint admin_broadcast_receipts_player_id_fkey
    foreign key (player_id) references public.players (id) on delete cascade
);

create index if not exists admin_broadcast_receipts_player_idx
  on public.admin_broadcast_receipts using btree (player_id);

create index if not exists admin_broadcast_receipts_broadcast_idx
  on public.admin_broadcast_receipts using btree (broadcast_id);


-- 9) TABLE rate_limit_usage
create table if not exists public.rate_limit_usage (
  id bigserial primary key,
  ip text null,
  player_id text null,
  bucket_start timestamptz not null,
  hit_count integer not null default 1,
  constraint rate_limit_usage_ip_bucket_unique
    unique (ip, bucket_start),
  constraint rate_limit_usage_player_bucket_unique
    unique (player_id, bucket_start)
);

create index if not exists rate_limit_usage_bucket_idx
  on public.rate_limit_usage using btree (bucket_start);

create index if not exists rate_limit_usage_bucket_ip_idx
  on public.rate_limit_usage using btree (bucket_start, ip)
  where ip is not null;

create index if not exists rate_limit_usage_bucket_player_idx
  on public.rate_limit_usage using btree (bucket_start, player_id)
  where player_id is not null;

create index if not exists rate_limit_usage_ip_idx
  on public.rate_limit_usage using btree (ip);

create index if not exists rate_limit_usage_player_idx
  on public.rate_limit_usage using btree (player_id);

create index if not exists rate_limit_usage_player_bucket_desc_ip_idx
  on public.rate_limit_usage using btree (player_id, bucket_start desc)
  include (ip)
  where ip is not null;

-- 8bis) TABLE message_rate_limit_usage
create table if not exists public.message_rate_limit_usage (
  id bigserial primary key,
  ip text null,
  player_id text null,
  bucket_start timestamptz not null,
  hit_count integer not null default 1,
  constraint message_rate_limit_usage_ip_bucket_unique
    unique (ip, bucket_start),
  constraint message_rate_limit_usage_player_bucket_unique
    unique (player_id, bucket_start)
);

create index if not exists message_rate_limit_usage_bucket_idx
  on public.message_rate_limit_usage using btree (bucket_start);

create index if not exists message_rate_limit_usage_ip_idx
  on public.message_rate_limit_usage using btree (ip);

create index if not exists message_rate_limit_usage_player_idx
  on public.message_rate_limit_usage using btree (player_id);


-- 9) FUNCTION check_rate_limit (RPC Supabase réimplémenté)
create or replace function public.check_rate_limit(
  p_ip text,
  p_player_id text,
  p_ip_limit integer default 60,
  p_player_limit integer default 60
)
returns boolean
language plpgsql
as $$
declare
  v_bucket timestamptz := date_trunc('minute', now());
  v_ip_count integer;
  v_player_count integer;
begin
  -- blocage dur par IP
  if p_ip is not null then
    if exists (
      select 1
      from public.blocked_ips
      where ip = p_ip
    ) then
      return false;
    end if;
  end if;

  -- incrémenter / insérer usage IP
  if p_ip is not null then
    insert into public.rate_limit_usage (ip, bucket_start, hit_count)
    values (p_ip, v_bucket, 1)
    on conflict (ip, bucket_start) do update
      set hit_count = rate_limit_usage.hit_count + 1;
  end if;

  -- incrémenter / insérer usage player
  if p_player_id is not null then
    insert into public.rate_limit_usage (player_id, bucket_start, hit_count)
    values (p_player_id, v_bucket, 1)
    on conflict (player_id, bucket_start) do update
      set hit_count = rate_limit_usage.hit_count + 1;
  end if;

  -- compter usage IP
  if p_ip is not null then
    select coalesce(sum(hit_count), 0) into v_ip_count
    from public.rate_limit_usage
    where ip = p_ip
      and bucket_start = v_bucket;
  else
    v_ip_count := 0;
  end if;

  -- compter usage player
  if p_player_id is not null then
    select coalesce(sum(hit_count), 0) into v_player_count
    from public.rate_limit_usage
    where player_id = p_player_id
      and bucket_start = v_bucket;
  else
    v_player_count := 0;
  end if;

  if v_ip_count > p_ip_limit or v_player_count > p_player_limit then
    return false;
  end if;

  return true;
end;
$$;


-- 10) FUNCTION check_message_rate_limit
create or replace function public.check_message_rate_limit(
  p_ip text,
  p_player_id text,
  p_ip_limit integer default 120,
  p_player_limit integer default 30
)
returns boolean
language plpgsql
as $$
declare
  v_bucket timestamptz := date_trunc('minute', now());
  v_ip_count integer;
  v_player_count integer;
begin
  -- blocage dur par IP
  if p_ip is not null then
    if exists (
      select 1
      from public.blocked_ips
      where ip = p_ip
    ) then
      return false;
    end if;
  end if;

  -- incrémenter / insérer usage IP
  if p_ip is not null then
    insert into public.message_rate_limit_usage (ip, bucket_start, hit_count)
    values (p_ip, v_bucket, 1)
    on conflict (ip, bucket_start) do update
      set hit_count = message_rate_limit_usage.hit_count + 1;
  end if;

  -- incrémenter / insérer usage player
  if p_player_id is not null then
    insert into public.message_rate_limit_usage (player_id, bucket_start, hit_count)
    values (p_player_id, v_bucket, 1)
    on conflict (player_id, bucket_start) do update
      set hit_count = message_rate_limit_usage.hit_count + 1;
  end if;

  -- compter usage IP
  if p_ip is not null then
    select coalesce(sum(hit_count), 0) into v_ip_count
    from public.message_rate_limit_usage
    where ip = p_ip
      and bucket_start = v_bucket;
  else
    v_ip_count := 0;
  end if;

  -- compter usage player
  if p_player_id is not null then
    select coalesce(sum(hit_count), 0) into v_player_count
    from public.message_rate_limit_usage
    where player_id = p_player_id
      and bucket_start = v_bucket;
  else
    v_player_count := 0;
  end if;

  if v_ip_count > p_ip_limit or v_player_count > p_player_limit then
    return false;
  end if;

  return true;
end;
$$;
