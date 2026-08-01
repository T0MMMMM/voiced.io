-- ═══════════════════════════════════════════════════════════════
-- voiced.io — schéma initial
-- Décisions structurantes :
--   · Le découpage est non-destructif : une scène est un intervalle,
--     pas un fichier. Aucune colonne ne pointe vers une vidéo découpée.
--   · Une scène = UN personnage qui parle. Deux personnages dans un
--     même passage → deux scènes. Cela simplifie casting et tour de parole.
--   · Pas de table `users` : un joueur est un pseudo attaché à un salon.
--     La colonne players.user_id sera ajoutée en Phase 3.
-- ═══════════════════════════════════════════════════════════════

-- ── Clips ──────────────────────────────────────────────────────
create table public.clips (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  source       text not null check (source in ('library', 'custom')),
  storage_path text not null,
  thumb_path   text,
  duration_sec numeric(10, 3) not null check (duration_sec > 0),
  width        int,
  height       int,
  anime_title  text,
  peaks        jsonb,
  created_by   text,
  expires_at   timestamptz,
  created_at   timestamptz not null default now()
);

comment on column public.clips.peaks is
  'Amplitudes de la waveform, capturées au premier visionnage puis mises en cache.';
comment on column public.clips.expires_at is
  'Les clips personnalisés expirent à 7 jours. null pour la bibliothèque.';

create index clips_expires_at_idx on public.clips (expires_at)
  where expires_at is not null;
create index clips_source_idx on public.clips (source);

-- ── Personnages ────────────────────────────────────────────────
create table public.characters (
  id      uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.clips (id) on delete cascade,
  name    text not null,
  color   text not null,
  sort    int  not null default 0
);

comment on column public.characters.color is
  'Nom de token, jamais une valeur hexadécimale : player-1, player-2.';

create index characters_clip_id_idx on public.characters (clip_id);

-- ── Scènes ─────────────────────────────────────────────────────
create table public.scenes (
  id           uuid primary key default gen_random_uuid(),
  clip_id      uuid not null references public.clips (id) on delete cascade,
  character_id uuid references public.characters (id) on delete set null,
  idx          int  not null,
  start_sec    numeric(10, 3) not null check (start_sec >= 0),
  end_sec      numeric(10, 3) not null,
  label        text,
  constraint scenes_interval_valid check (end_sec > start_sec),
  constraint scenes_min_duration check (end_sec - start_sec >= 0.5),
  constraint scenes_unique_idx unique (clip_id, idx)
);

create index scenes_clip_id_idx on public.scenes (clip_id, idx);

-- ── Salons ─────────────────────────────────────────────────────
create table public.rooms (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[BCDFGHJKLMNPQRSTVWXZ]{4}$'),
  clip_id     uuid not null references public.clips (id) on delete cascade,
  status      text not null default 'lobby'
                check (status in ('lobby', 'casting', 'dubbing', 'review', 'done')),
  current_idx int  not null default 0,
  expires_at  timestamptz not null default (now() + interval '24 hours'),
  created_at  timestamptz not null default now()
);

comment on table public.rooms is
  'Source de vérité unique de l''état d''une partie. Les deux clients écoutent les changements de cette ligne via Realtime et se redessinent.';

create index rooms_code_idx on public.rooms (code);
create index rooms_expires_at_idx on public.rooms (expires_at);

-- ── Joueurs ────────────────────────────────────────────────────
create table public.players (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references public.rooms (id) on delete cascade,
  nickname     text not null check (length(trim(nickname)) between 1 and 20),
  slot         int  not null check (slot in (1, 2)),
  is_host      boolean not null default false,
  last_seen_at timestamptz not null default now(),
  constraint players_unique_slot unique (room_id, slot)
);

create index players_room_id_idx on public.players (room_id);

-- ── Attributions ───────────────────────────────────────────────
create table public.assignments (
  room_id      uuid not null references public.rooms (id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  player_id    uuid not null references public.players (id) on delete cascade,
  primary key (room_id, character_id)
);

create index assignments_player_id_idx on public.assignments (player_id);

-- ── Prises ─────────────────────────────────────────────────────
create table public.takes (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references public.rooms (id) on delete cascade,
  scene_id     uuid not null references public.scenes (id) on delete cascade,
  player_id    uuid references public.players (id) on delete set null,
  storage_path text not null,
  mime_type    text not null,
  duration_ms  int  not null check (duration_ms > 0),
  offset_ms    int  not null default 0 check (offset_ms between -3000 and 3000),
  peaks        jsonb,
  is_selected  boolean not null default true,
  created_at   timestamptz not null default now()
);

comment on column public.takes.offset_ms is
  'Correction de la latence de MediaRecorder, mesurée automatiquement puis ajustable à l''oreille.';
comment on column public.takes.mime_type is
  'Chrome et Firefox produisent du webm/opus, Safari du mp4/aac. Stocké pour que l''export sache quel décodeur utiliser.';

create index takes_room_scene_idx on public.takes (room_id, scene_id);

-- Une seule prise retenue par scène et par salon
create unique index takes_one_selected_per_scene
  on public.takes (room_id, scene_id)
  where is_selected;

-- ── Realtime ───────────────────────────────────────────────────
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.assignments;
alter publication supabase_realtime add table public.takes;
