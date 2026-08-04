-- ═══════════════════════════════════════════════════════════════
-- Points de coupe poses a la main.
--
-- La detection automatique par les silences a ete abandonnee : elle
-- devinait mal les conversations, la ou l'oreille tranche en une seconde.
-- Les points sont donc poses en direct pendant la lecture, et vivent dans
-- le salon pour que tous les ecrans voient le meme decoupage.
-- ═══════════════════════════════════════════════════════════════

alter table public.rooms
  add column if not exists breakpoints jsonb not null default '[]'::jsonb;

comment on column public.rooms.breakpoints is
  'Instants de coupe, en secondes, tries. N points donnent N+1 segments ;
   les bords du clip n''en sont pas.';
