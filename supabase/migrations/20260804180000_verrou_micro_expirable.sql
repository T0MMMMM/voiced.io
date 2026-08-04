-- ═══════════════════════════════════════════════════════════════
-- Le verrou du micro doit pouvoir se liberer tout seul.
--
-- Un onglet ferme en pleine prise, un decompte interrompu, un plantage :
-- le verrou restait pose et bloquait le salon entier, sans aucun moyen de
-- le rendre depuis l'interface. On horodate donc sa prise pour pouvoir
-- considerer un verrou trop vieux comme abandonne.
-- ═══════════════════════════════════════════════════════════════

alter table public.rooms
  add column if not exists recording_since timestamptz;

comment on column public.rooms.recording_since is
  'Instant de prise du micro. Au-dela de quatre-vingt-dix secondes, le
   verrou est considere abandonne : aucune replique ne dure aussi longtemps.';

-- Les verrous deja poses sont liberes : ils datent d'avant ce garde-fou.
update public.rooms set recording_by = null where recording_by is not null;
