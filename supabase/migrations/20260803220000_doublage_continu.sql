-- ═══════════════════════════════════════════════════════════════
-- Bascule vers le doublage continu.
--
-- Le decoupage en scenes et l'attribution des personnages
-- disparaissent : on double par-dessus le clip entier, en direct, et
-- n'importe qui peut poser la tete de lecture et enregistrer.
--
-- Une prise n'est donc plus rattachee a une scene mais a un instant du
-- clip. Le salon porte le verrou d'enregistrement : un seul micro a la
-- fois, quel que soit le nombre de joueurs.
-- ═══════════════════════════════════════════════════════════════

-- ── Ce qui n'a plus de sens ────────────────────────────────────
drop table if exists public.assignments;
drop table if exists public.characters cascade;
drop table if exists public.scenes cascade;

-- ── Les prises s'ancrent dans le temps du clip ─────────────────
alter table public.takes drop column if exists scene_id;

alter table public.takes
  add column if not exists start_sec numeric(10, 3) not null default 0;

comment on column public.takes.start_sec is
  'Position dans le clip ou demarre la prise. Plusieurs prises peuvent se
   superposer : c''est le melange de toutes les voix qui fait le resultat.';

comment on column public.takes.is_selected is
  'Prise retenue dans le mixage final. Une prise ecartee reste ecoutable.';

create index if not exists takes_room_start_idx
  on public.takes (room_id, start_sec);

-- ── Le salon porte le verrou du micro ──────────────────────────
alter table public.rooms drop column if exists current_idx;

alter table public.rooms
  add column if not exists recording_by uuid
    references public.players (id) on delete set null;

comment on column public.rooms.recording_by is
  'Joueur qui tient le micro. Non nul = enregistrement en cours, personne
   d''autre ne peut demarrer. Le verrou vit en base pour que tous les
   ecrans voient le meme etat.';

alter table public.rooms drop constraint if exists rooms_status_check;
alter table public.rooms
  add constraint rooms_status_check
  check (status in ('lobby', 'dubbing', 'review'));

-- ── Plus de deux joueurs ───────────────────────────────────────
alter table public.players drop constraint if exists players_slot_check;
alter table public.players
  add constraint players_slot_check check (slot between 1 and 8);
