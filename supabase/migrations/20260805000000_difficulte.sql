-- Niveau de difficulte, montre au joueur avant qu'il reponde.
--
-- Il sert deux fois : il previent de l'effort demande, et il justifie le
-- bareme — une question rouge doit rapporter plus qu'une verte, sinon la
-- difficulte n'est qu'une decoration.
alter table public.questions
  add column if not exists difficulty int not null default 1
    check (difficulty between 1 and 3);

comment on column public.questions.difficulty is
  '1 facile, 2 moyen, 3 difficile. Affiche au joueur pendant la question.';
