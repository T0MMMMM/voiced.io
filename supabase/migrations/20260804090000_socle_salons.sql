-- ═══════════════════════════════════════════════════════════════
-- Socle commun aux quatre jeux.
--
-- Un salon ne sert plus seulement au doublage : il porte le jeu choisi,
-- ses reglages, et l'hote qui arbitre. Les statuts deviennent communs a
-- tous les jeux, ce qui permet au meme lobby de servir partout.
-- ═══════════════════════════════════════════════════════════════

alter table public.rooms
  add column if not exists game text not null default 'dub',
  add column if not exists options jsonb not null default '{}'::jsonb,
  add column if not exists host_player_id uuid
    references public.players (id) on delete set null,
  add column if not exists current_step int not null default 0,
  add column if not exists step_started_at timestamptz;

alter table public.rooms drop constraint if exists rooms_game_check;
alter table public.rooms
  add constraint rooms_game_check check (game in ('quiz', 'dub', 'beast', 'next'));

-- Un salon de quiz n'a pas de clip.
alter table public.rooms alter column clip_id drop not null;

alter table public.rooms drop constraint if exists rooms_status_check;
alter table public.rooms
  add constraint rooms_status_check
  check (status in ('lobby', 'playing', 'grading', 'results'));

comment on column public.rooms.options is
  'Reglages actives dans le salon. Un jsonb plutot que vingt colonnes :
   ces reglages changeront souvent et aucun n''a besoin d''etre filtre en SQL.';

comment on column public.rooms.host_player_id is
  'Joueur qui arbitre. Repris par le plus ancien present si l''hote quitte,
   sinon une partie de quiz devient incorrigible et donc inachevable.';

comment on column public.rooms.step_started_at is
  'Debut de l''etape courante, en heure serveur : le minuteur doit etre
   identique pour tous, un compte a rebours local ne le garantit pas.';

create index if not exists rooms_status_idx on public.rooms (status);
create index if not exists players_last_seen_idx on public.players (last_seen_at);
