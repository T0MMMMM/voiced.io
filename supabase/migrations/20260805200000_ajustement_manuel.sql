-- Le rattrapage de fin de correction.
--
-- La machine se trompe, l'hote aussi : une reponse juste refusee, un
-- doublon compte deux fois. Plutot que de revenir en arriere question par
-- question, l'hote ajuste le total avant de publier.
alter table public.players
  add column if not exists bonus numeric not null default 0;
