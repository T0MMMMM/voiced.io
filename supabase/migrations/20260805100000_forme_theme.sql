-- La forme « theme au choix ».
--
-- On annonce le sujet, pas la question : le joueur decide lui-meme s'il
-- affronte la facile, la moyenne ou la difficile, et ce que sa reponse
-- vaudra. C'est la seule forme ou deux joueurs ne repondent pas a la meme
-- chose.
alter table public.questions drop constraint if exists questions_kind_check;
alter table public.questions
  add constraint questions_kind_check check (kind in (
    'ecrite', 'liste', 'estimation', 'classement', 'frise', 'carte',
    'petit_bac', 'intrus', 'association', 'theme', 'media'
  ));

-- Le petit bac n'a pas de correction attendue : c'est l'hote qui tranche
-- si « Nice » est une ville pour la lettre N. La colonne doit donc
-- accepter l'absence de reponse.
alter table public.questions alter column answer drop not null;
