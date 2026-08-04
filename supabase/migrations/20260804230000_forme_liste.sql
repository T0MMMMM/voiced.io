-- La forme « citez N ».
--
-- « Citez quatre pays d'Oceanie » : plusieurs reponses sont valables, et on
-- en demande plusieurs. C'est aussi ce qui permet de noter automatiquement
-- les reponses ecrites — l'hote n'arbitre plus que ce que la machine n'a
-- pas su rapprocher d'une variante acceptee.
alter table public.questions drop constraint if exists questions_kind_check;
alter table public.questions
  add constraint questions_kind_check check (kind in (
    'ecrite', 'liste', 'estimation', 'classement', 'frise', 'carte',
    'petit_bac', 'intrus', 'association', 'media'
  ));
