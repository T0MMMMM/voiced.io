-- La langue d'une question.
--
-- L'interface suit chaque joueur, mais le contenu suit la table : on ne
-- peut pas poser deux questions differentes a deux personnes de la meme
-- partie. La langue du tirage est donc celle de l'hote au lancement.
alter table public.questions
  add column if not exists locale text not null default 'fr';

alter table public.questions drop constraint if exists questions_locale_check;
alter table public.questions
  add constraint questions_locale_check check (locale in ('fr', 'en'));

create index if not exists questions_locale_kind_idx
  on public.questions (locale, kind);
