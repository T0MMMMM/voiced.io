-- La validation d'une reponse.
--
-- La reponse s'enregistre au fil de la saisie ; valider est autre chose :
-- c'est dire « j'ai fini ». Quand toute la table a valide, la question
-- suivante arrive sans attendre la fin du minuteur.
alter table public.answers
  add column if not exists submitted boolean not null default false;
