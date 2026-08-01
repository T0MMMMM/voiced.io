-- ═══════════════════════════════════════════════════════════════
-- Politiques RLS — modèle Phase 0 à 2 (sans comptes)
--
--   anon : LECTURE seule sur tout. Nécessaire pour que Realtime
--          délivre les changements aux clients.
--   écritures : exclusivement via server actions en service_role,
--          qui contourne RLS et applique les règles métier.
--
-- Limite assumée : deviner un identifiant permet de lire une partie.
-- Acceptable pour un jeu entre amis, sans donnée personnelle, avec
-- des salons qui expirent en 24 h. Resserré en Phase 3 avec l'auth.
-- ═══════════════════════════════════════════════════════════════

alter table public.clips       enable row level security;
alter table public.characters  enable row level security;
alter table public.scenes      enable row level security;
alter table public.rooms       enable row level security;
alter table public.players     enable row level security;
alter table public.assignments enable row level security;
alter table public.takes       enable row level security;

create policy "lecture publique" on public.clips
  for select to anon, authenticated using (true);

create policy "lecture publique" on public.characters
  for select to anon, authenticated using (true);

create policy "lecture publique" on public.scenes
  for select to anon, authenticated using (true);

create policy "lecture publique" on public.rooms
  for select to anon, authenticated using (true);

create policy "lecture publique" on public.players
  for select to anon, authenticated using (true);

create policy "lecture publique" on public.assignments
  for select to anon, authenticated using (true);

create policy "lecture publique" on public.takes
  for select to anon, authenticated using (true);

-- Aucune politique d'écriture n'est déclarée : avec RLS actif, cela
-- équivaut à un refus total pour anon. C'est intentionnel.
