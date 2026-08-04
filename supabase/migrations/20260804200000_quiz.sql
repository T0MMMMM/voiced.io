-- ═══════════════════════════════════════════════════════════════
-- Le quiz.
--
-- Sept formes de questions aux structures incompatibles. Onze tables, ou
-- une colonne souple : la souplesse gagne tant que rien n'a besoin d'etre
-- filtre en SQL, et rien n'en a besoin — on lit toujours par question.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.quizzes (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  theme           text,
  author_nickname text,
  is_public       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references public.quizzes (id) on delete cascade,
  idx         int  not null,
  kind        text not null check (kind in (
                'ecrite', 'estimation', 'classement', 'frise', 'carte',
                'petit_bac', 'intrus', 'association', 'media'
              )),
  prompt      text not null,
  hint        text,
  media_path  text,
  points      int  not null default 1 check (points between 1 and 5),
  payload     jsonb not null default '{}'::jsonb,
  answer      jsonb,
  constraint questions_unique_idx unique (quiz_id, idx)
);

comment on column public.questions.payload is
  'Contenu dependant de la forme : elements a ordonner, bornes d''estimation,
   propositions… Jamais interroge en SQL, toujours lu avec sa question.';
comment on column public.questions.answer is
  'Correction attendue. Null pour les formes qui ne se notent qu''a la main.';

create index if not exists questions_quiz_idx on public.questions (quiz_id, idx);

create table if not exists public.answers (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid not null references public.rooms (id) on delete cascade,
  player_id      uuid not null references public.players (id) on delete cascade,
  question_id    uuid not null references public.questions (id) on delete cascade,
  payload        jsonb not null default '{}'::jsonb,
  bet            int  not null default 1 check (bet between 1 and 3),
  auto_score     numeric(6, 2),
  final_score    numeric(6, 2),
  graded_by_host boolean not null default false,
  answered_at    timestamptz not null default now(),
  constraint answers_one_per_question unique (room_id, player_id, question_id)
);

comment on column public.answers.auto_score is
  'Note calculee quand la forme le permet. La machine propose.';
comment on column public.answers.final_score is
  'Note apres passage de l''hote. Elle fait foi.';

create index if not exists answers_room_question_idx
  on public.answers (room_id, question_id);

-- ── Le salon porte le quiz choisi ──────────────────────────────
alter table public.rooms
  add column if not exists quiz_id uuid references public.quizzes (id) on delete set null;

-- ── Securite ───────────────────────────────────────────────────
alter table public.quizzes  enable row level security;
alter table public.questions enable row level security;
alter table public.answers  enable row level security;

create policy "lecture publique" on public.quizzes
  for select to anon, authenticated using (true);

-- L'enonce est lisible, la correction attendue ne l'est pas : sans cette
-- restriction il suffirait d'ouvrir l'inspecteur pour lire les reponses.
create policy "lecture publique" on public.questions
  for select to anon, authenticated using (true);

-- Les reponses des autres restent invisibles jusqu'aux resultats. C'est la
-- politique qui rend la partie honnete : autrement, la triche est triviale.
create policy "reponses privees jusqu aux resultats" on public.answers
  for select to anon, authenticated using (
    exists (
      select 1 from public.rooms r
      where r.id = answers.room_id and r.status = 'results'
    )
  );

alter publication supabase_realtime add table public.answers;
