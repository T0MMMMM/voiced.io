# Plan d'implémentation — Phases 1 et 2

**Base :** [PRD.md](PRD.md) · **Mis à jour** 2026-08-03

Ce plan couvre le socle des salons puis le quiz jouable de bout en bout. Les phases 3 à 6 sont listées dans le PRD ; elles ne seront détaillées qu'une fois la Phase 2 livrée, parce que leurs contours dépendront de ce qu'on aura appris en jouant.

## Ordre imposé

Le risque numéro un du projet est de commencer trois jeux et de n'en finir aucun. L'ordre suivant n'est pas négociable :

```
socle des salons  →  quiz écrit + estimation + classement  →  correction  →  résultats
                                                                    ↓
                                          seulement ensuite : formes riches, bête, doublage
```

Le jalon qui compte : **une partie de quiz jouable à quatre, de bout en bout, avec correction et podium.** Tout ce qui ne sert pas ce jalon attend.

---

# Phase 1 — Le socle des salons

**Objectif.** Quatre personnes rejoignent un salon avec un code, se voient dans le lobby, et l'hôte lance la partie. Aucun jeu derrière — c'est la plomberie dont les trois jeux dépendent.

## Fichiers

```
supabase/migrations/  …_socle_salons.sql

lib/rooms/
├─ actions.ts          server actions : créer, rejoindre, quitter, lancer
├─ options.ts          réglages par défaut + fusion, pur, testé
└─ options.test.ts

stores/useRoomStore.ts abonnement Realtime, état de la partie

components/room/
├─ RoomCode.tsx        le code en grand, copie du lien
├─ PlayerList.tsx      joueurs présents, hôte marqué
├─ GamePicker.tsx      choix du jeu (hôte)
└─ OptionToggles.tsx   réglages du salon (hôte)

app/
├─ join/page.tsx       saisie pseudo + code
└─ room/[code]/page.tsx  lobby, puis aiguillage vers le jeu
```

## Tâches

### 1.1 — Migration du socle

```sql
alter table public.rooms
  add column game text not null default 'quiz'
    check (game in ('quiz','dub','beast')),
  add column options jsonb not null default '{}'::jsonb,
  add column host_player_id uuid references public.players(id) on delete set null,
  add column current_step int not null default 0,
  alter column clip_id drop not null;

alter table public.rooms drop constraint rooms_status_check;
alter table public.rooms add constraint rooms_status_check
  check (status in ('lobby','playing','grading','results'));
```

`clip_id` devient facultatif : un salon de quiz n'a pas de clip. Regénérer les types après (`npm run db:types`).

### 1.2 — Réglages du salon (pur, TDD)

`lib/rooms/options.ts` :

```ts
export interface RoomOptions {
  timerSec: 0 | 15 | 30 | 60
  allowBets: boolean
  allowHints: boolean
  allowSteal: boolean
  shuffle: boolean
  anonymousGrading: boolean
  kinds: QuestionKind[]
}

export const DEFAULT_OPTIONS: RoomOptions
export function mergeOptions(stored: unknown): RoomOptions
```

`mergeOptions` doit survivre à un `jsonb` incomplet, inconnu ou corrompu — c'est le prix de la souplesse du `jsonb`, et c'est exactement ce qu'on teste : clé manquante → valeur par défaut, clé inconnue → ignorée, type inattendu → valeur par défaut.

### 1.3 — Server actions

```ts
createRoom(input: { game: GameKind; nickname: string; clipId?: string }): Promise<{ code: string; playerId: string }>
joinRoom(input: { code: string; nickname: string }): Promise<{ roomId: string; playerId: string }>
leaveRoom(playerId: string): Promise<void>
setOptions(roomId: string, options: Partial<RoomOptions>): Promise<void>
startGame(roomId: string): Promise<void>
```

Points de vigilance :
- `createRoom` retente sur collision de code — 160 000 combinaisons, mais la collision n'est pas impossible.
- Le premier joueur devient hôte ; `host_player_id` est posé dans la même transaction.
- `joinRoom` refuse un salon plein (8), expiré, ou déjà en partie.
- L'identité du joueur tient dans un cookie `voiced-player` (`{ roomId, playerId }`) : sans compte, c'est ce qui permet de retrouver sa place après un rafraîchissement.

### 1.4 — Store Realtime

`stores/useRoomStore.ts` s'abonne aux changements Postgres de `rooms`, `players`, `answers`. Un seul canal par salon.

Un joueur envoie un battement toutes les 10 s (`last_seen_at`) ; au-delà de 30 s sans signe, il est marqué absent — sans être supprimé, pour qu'il retrouve ses réponses en revenant.

### 1.5 — Lobby

Code à quatre lettres en très grand, en Space Mono, avec copie du lien en un clic. Liste des joueurs, hôte marqué. Réglages visibles de tous mais modifiables par l'hôte seul. Bouton de départ actif à partir de deux joueurs.

### 1.6 — Transfert d'hôte

Si l'hôte quitte, le joueur présent le plus ancien reprend la main. Sans ça, une partie devient incorrigible dès que l'hôte perd sa connexion — ce qui, sur un quiz corrigé à la main, la rend inachevable.

**Fin de phase :** quatre onglets rejoignent le même salon, se voient apparaître et disparaître en direct, et l'hôte lance la partie.

---

# Phase 2 — Le Quiz jouable

**Objectif.** Une partie complète : questions, réponses, correction par l'hôte, podium.

## Fichiers

```
supabase/migrations/  …_quiz.sql

lib/quiz/
├─ kinds.ts            contrat commun à toutes les formes
├─ scoring.ts          notation automatique, pur, testé
├─ scoring.test.ts
├─ similarity.ts       groupement des réponses écrites, pur, testé
├─ similarity.test.ts
└─ actions.ts          submitAnswer, gradeAnswer, nextQuestion, finish

components/quiz/
├─ QuestionFrame.tsx   cadre commun : énoncé, minuteur, état d'envoi
├─ kinds/WrittenQuestion.tsx
├─ kinds/EstimateQuestion.tsx
├─ kinds/RankQuestion.tsx
├─ GradingDeck.tsx     l'écran de correction de l'hôte
└─ Podium.tsx

app/room/[code]/  play | grade | results
```

## Tâches

### 2.1 — Tables et anti-triche

Les trois tables du PRD, plus la politique qui compte :

```sql
create policy "reponses privees jusqu'aux resultats" on public.answers
  for select to anon using (
    exists (
      select 1 from public.rooms r
      where r.id = answers.room_id and r.status = 'results'
    )
  );
```

Sans elle, n'importe qui ouvre l'inspecteur et lit les réponses des autres pendant la partie. **À vérifier par une sonde, comme les politiques existantes** : `npm run check:rls` doit tenter la lecture d'une réponse pendant une partie en cours et échouer.

### 2.2 — Contrat commun des formes

```ts
export interface QuestionComponentProps<P, A> {
  payload: P
  disabled: boolean
  onAnswer: (answer: A) => void
}
```

Chaque forme est un composant autonome qui ne sait rien du salon, du minuteur ni du score. C'est ce qui permettra d'en ajouter huit en Phase 3 sans toucher au moteur.

### 2.3 — Notation automatique (pur, TDD)

`lib/quiz/scoring.ts` — le cœur testable du quiz.

```ts
scoreEstimate(given: number, expected: number, tolerance: number): number
scoreRanking(given: string[], expected: string[]): number
scoreDistance(given: LatLng, expected: LatLng, maxKm: number): number
```

Décisions à respecter :
- **Le classement se note par paires**, pas en tout-ou-rien : sur cinq éléments, en avoir quatre bien placés doit rapporter beaucoup plus que zéro. On compte les paires dans le bon ordre relatif (distance de Kendall normalisée).
- **L'estimation est dégressive**, pas binaire : l'écart relatif détermine la fraction de points.
- **La carte est dégressive à la distance**, avec un plafond au-delà duquel c'est zéro.

### 2.4 — Groupement des réponses écrites (pur, TDD)

`lib/quiz/similarity.ts` — c'est ce qui rend la correction rapide.

```ts
normalizeAnswer(text: string): string      // minuscules, accents, ponctuation, espaces
groupAnswers(answers: string[]): Group[]   // regroupe les variantes proches
```

« Napoléon », « napoleon », « Napoléon Bonaparte » et « napoleon bonaparte » doivent arriver dans le même groupe et se valider d'un seul geste. Distance de Levenshtein sur la forme normalisée, seuil relatif à la longueur.

### 2.5 — Boucle de partie

`rooms.current_step` porte la question courante ; tous les clients suivent. Le minuteur est calculé à partir d'un `step_started_at` en base et non d'un compte à rebours local — sinon deux joueurs n'ont pas le même temps.

Quand tout le monde a répondu, on passe sans attendre le minuteur.

### 2.6 — Écran de correction

L'écran le plus risqué du projet. Exigences :

- une question à la fois, en grand, lisible à trois mètres
- réponses groupées par similitude, validables en bloc
- `J` juste · `F` faux · `→` suivante · `Z` annuler
- les formes auto-notées arrivent pré-remplies, l'hôte confirme ou rectifie
- barre d'avancement
- si `anonymousGrading`, les pseudos sont masqués jusqu'à la validation

**À chronométrer dès la première version** : vingt questions, six joueurs, moins de cinq minutes. Si on dépasse, l'écran est à revoir avant d'ajouter la moindre forme de question.

### 2.7 — Résultats

Podium, puis récapitulatif question par question avec les réponses de tous. C'est le moment de révélation : il mérite une orchestration — les scores montent, le podium se pose.

### 2.8 — Éditeur de quiz

Version minimale : titre, ajout de questions par forme, réordonnancement, enregistrement. Sans lui, il n'y a rien à jouer — c'est une tâche de premier plan, pas une commodité.

**Fin de phase :** quatre personnes jouent un quiz de vingt questions, l'hôte corrige, le podium tombe.

---

## Ce que ce plan ne fait pas

Les huit formes de questions supplémentaires, la carte, le petit bac, les paris, le jeu des animaux et le doublage à plusieurs sont hors de ce plan. Ils sont décrits dans le PRD et seront planifiés quand le jalon « une partie jouable » sera atteint — pas avant, parce que jouer révélera des choses qu'aucun plan ne peut deviner.
