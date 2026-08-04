-- Les questions tirees pour la partie.
--
-- Le tirage est fige au lancement : une partie doit rester la meme si
-- quelqu'un rafraichit sa page, et l'ordre doit exister avant qu'on puisse
-- annoncer « question 3 sur 20 ».
alter table public.rooms
  add column if not exists question_ids jsonb not null default '[]'::jsonb;

comment on column public.rooms.question_ids is
  'Identifiants des questions de la partie, dans l''ordre ou elles tombent.';
