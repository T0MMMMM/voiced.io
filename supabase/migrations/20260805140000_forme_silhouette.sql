-- La forme « silhouette ».
--
-- Les frontieres d'un pays, seules et tournees, a reconnaitre. Le trace
-- voyage dans la question ; son nom, jamais : l'envoyer reviendrait a
-- livrer la reponse dans le navigateur.
alter table public.questions drop constraint if exists questions_kind_check;
alter table public.questions
  add constraint questions_kind_check check (kind in (
    'ecrite', 'liste', 'estimation', 'classement', 'frise', 'carte',
    'petit_bac', 'intrus', 'association', 'theme', 'silhouette', 'media'
  ));
