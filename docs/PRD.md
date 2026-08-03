# voiced.io — PRD

**Version** 2.0 · **Date** 2026-08-03 · **Statut** En construction, Phase 0 livrée

> **Ce qui a changé depuis la v1.** Le site n'est plus un outil de doublage, c'est une **plateforme de jeux en salon** dont le doublage devient un mode parmi trois. Le découpage en scènes et l'attribution des personnages sont abandonnés : on double en continu par-dessus le clip entier. Le quiz devient le jeu de tête.

---

## 1. Vision

voiced.io réunit des amis autour d'un code à quatre lettres, sans compte et sans installation, pour jouer à des jeux qui se corrigent et se découvrent **ensemble, à la fin**.

Trois jeux au lancement, une seule mécanique commune : chacun joue de son côté sur son écran, personne ne voit ni n'entend ce que font les autres pendant la partie, et **tout se révèle d'un coup au moment du résultat**. C'est ce décalage qui fait le plaisir — la salle attend, puis découvre.

### Les trois jeux

| Jeu | Ce qu'on y fait | Statut |
|---|---|---|
| **Quiz** | Des questions de culture générale de sept formes différentes, corrigées à la main par l'hôte à la fin | À construire — c'est le jeu de tête |
| **Doublage** | On double un clip d'anime en direct, chacun son tour au micro | Écran solo livré |
| **Cri de la bête** | Un son, un animal à deviner | À construire |

### Principes directeurs

1. **Rien ne bloque le jeu.** Aucun compte pour jouer : un pseudo et un code à quatre lettres suffisent.
2. **On découvre à la fin.** Pendant la partie, personne ne voit les réponses ni n'entend les voix des autres. La révélation est le moment fort, il ne doit jamais être gâché en cours de route.
3. **L'hôte arbitre, la machine compte.** Ce qui demande du jugement est corrigé à la main ; ce qui est objectif est noté automatiquement. On ne fait jamais trancher une machine sur une réponse écrite libre.
4. **Zéro euro d'infrastructure.** Contrainte de conception, pas d'optimisation a posteriori.

### Hors périmètre

Enregistrement audio depuis mobile · voix générées par IA · modération automatique des contenus importés · classement mondial · jeu en solo contre la machine.

### Critères de succès

- Un groupe qui découvre le site lance une partie de quiz en **moins de 90 secondes**, sans aide.
- L'hôte corrige une partie de vingt questions à six joueurs en **moins de 5 minutes**.
- Le décalage voix/image dans un doublage reste **imperceptible** (< 60 ms).
- Aucune ligne de facture. Jamais.

### Question ouverte

Le nom **voiced.io** décrit un site de voix. Si le quiz devient effectivement le jeu de tête, le nom porte à faux. À trancher avant toute communication publique — pas avant.

---

## 2. Contrainte fondatrice : le 100 % gratuit

Aucune plateforme gratuite ne fait tourner FFmpeg côté serveur de façon fiable : les fonctions serverless sont coupées avant la fin, les conteneurs gratuits s'endorment ou manquent de RAM. **L'architecture entière découle de ce constat.**

Trois décisions permettent de s'en passer :

**a) Rien n'est jamais découpé ni transcodé.** Une position dans un clip est un nombre, pas un fichier.

**b) La restitution n'est pas un rendu.** Écouter un doublage complet, c'est jouer la vidéo en muet pendant qu'un moteur Web Audio déclenche les prises aux bons instants. Instantané, gratuit, et réécouter une seule prise ne demande aucun recalcul.

**c) L'export MP4 se fait dans le navigateur, et il est rapide.** `ffmpeg.wasm` a mauvaise réputation parce qu'on lui fait réencoder de la vidéo. Ici on n'y touche pas (`-c:v copy`) : on n'encode que la piste audio mixée.

### Services et quotas

| Besoin | Service | Quota gratuit | Contrainte à gérer |
|---|---|---|---|
| Site + routes API | Vercel Hobby | 100 Go/mois | Usage non commercial |
| Base de données | Supabase Postgres | 500 Mo | Pause après 7 j d'inactivité — traitée par un cron |
| Synchro des salons | Supabase Realtime | 200 connexions, 2 M messages/mois | Confortable |
| Fichiers | Supabase Storage | 1 Go, 5 Go egress/mois | **La vraie limite** |
| Traitement vidéo | Aucun serveur | — | ffmpeg.wasm côté client |

### Garde-fous de stockage

Le gigaoctet est la ressource rare, et le quiz l'aggrave : chaque question à image ou à son consomme du stockage permanent.

- **Les clips importés expirent à 7 jours** (`expires_at`, nettoyage par cron quotidien). Déjà en place.
- **Les prises audio expirent avec leur salon** (24 h).
- **Les médias de questions sont compressés à l'import** : images en WebP ≤ 200 Ko, extraits sonores en Opus ≤ 15 s. Une banque de 500 questions illustrées tient alors dans 100 Mo.
- **Limite à l'import** : 50 Mo et 3 minutes par clip vidéo.

**Porte de sortie :** Cloudflare R2 (10 Go, egress gratuit). Tout accès fichier passe par `lib/storage/index.ts` — quatre fonctions, un seul fichier à réécrire le jour venu.

---

## 3. Direction visuelle

Fond crème, contrôles en relief, le vert comme unique couleur, noir franc sur la typographie. **L'élévation remplace la bordure** : un contrôle se lit parce qu'il flotte au-dessus du fond, pas parce qu'on l'a encadré. Les champs de saisie font l'inverse — ils sont creusés : on entre dans un champ, on presse un bouton.

Pas de barre de navigation. Seuls le logo et la bascule de thème flottent au-dessus de la page.

### Tokens — `styles/theme.css`

Seul fichier du projet autorisé à contenir des couleurs. Le thème sombre ne fait que redéfinir ces variables : aucun `dark:` dans un composant.

| Rôle | Clair | Sombre |
|---|---|---|
| Fond | `#FFF7EA` | `#151714` |
| Surface posée | `#FFFFFF` | `#1F221E` |
| Surface creusée | `#F6EEE0` | `#1A1D19` |
| Texte | `#0A0A0A` | `#F4F1E9` |
| Accent | `#7A9B7A` | `#A6BFA2` |
| Accent pâle | `#E7F0E2` | `#232A21` |
| Enregistrement | `#C2554A` | `#E0705F` |

Le rouge d'enregistrement est la seule couleur chaude du système : il ne doit jamais avoir de concurrent à l'écran.

### Typographie

**Space Grotesk** porte tout le texte — ses formes géométriques un peu bancales lui donnent une voix. **Space Mono**, sa sœur du même dessinateur, ne sert qu'aux timecodes, compteurs, codes de salon et libellés de piste (classe `.eyebrow`).

### Règles de retenue

Une seule couleur d'accent visible par écran · aucun dégradé, aucune ombre décorative · l'espace fait la séparation, pas les traits · une icône seulement si elle remplace du texte · mouvement à 200 ms, `ease-out`, sur `opacity` et `transform` uniquement.

### Accessibilité — exigence de premier rang

- Tout écran de jeu est **entièrement pilotable au clavier**, et ses raccourcis sont **affichés à l'écran** : un raccourci qu'on ne peut pas découvrir n'existe pas.
- Aucun état n'est signalé par la seule couleur. L'enregistrement, par exemple, se lit à la fois par un point, un libellé et un compteur.
- Les changements d'état qui n'attendent pas (début d'enregistrement, passage à la question suivante) passent par une région `aria-live`.
- Contraste minimum 4.5:1, vérifié dans les deux thèmes.
- `prefers-reduced-motion` respecté globalement.

---

## 4. Architecture

### Stack

Next.js 15 (App Router, TypeScript strict) · Tailwind CSS v4 · Supabase (Postgres, Realtime, Storage) · Zustand · Web Audio + MediaRecorder natifs · `@ffmpeg/ffmpeg` mono-thread pour l'export.

### Le principe de synchronisation

**La base de données est l'unique source de vérité.** Chaque transition d'état d'une partie est une écriture ; tous les clients écoutent les changements Postgres via Realtime et se redessinent. Il devient structurellement impossible que deux joueurs voient des choses différentes, et rafraîchir la page restaure l'état exact.

### Arborescence

```
app/
├─ page.tsx                    accueil
├─ create/page.tsx             import d'un clip
├─ dub/[clipId]/page.tsx       doublage (solo, provisoire)
├─ room/[code]/page.tsx        salon — aiguille vers le jeu choisi
├─ quiz/edit/                  éditeur de questions (hôte)
└─ api/cron/keepalive/

components/
├─ ui/                         10 primitives, aucun concept métier
├─ brand/  layout/  home/
├─ video/  dub/                lecteur, partition, transport, prises
├─ quiz/                       un dossier par forme de question
└─ room/                       lobby, joueurs, code

lib/
├─ supabase/  storage/         clients, adaptateur fichiers
├─ audio/                      peaks, recorder, mixage
├─ clips/  rooms/  quiz/       logique métier + server actions
└─ utils/
```

### Règles de code

Un composant `ui/` ne connaît aucun concept métier · aucun appel Supabase dans un composant · aucune valeur hexadécimale hors de `theme.css` · un fichier au-delà de 200 lignes se découpe · toute logique testable sans navigateur vit dans `lib/` et est couverte par des tests.

---

## 5. Modèle de données

### Socle commun aux trois jeux

```sql
rooms (
  id, code (4 consonnes, unique), game text check (game in ('quiz','dub','beast')),
  status text check (status in ('lobby','playing','grading','results')),
  host_player_id uuid, options jsonb,   -- réglages activés dans le salon
  clip_id uuid,                         -- doublage uniquement
  quiz_id uuid,                         -- quiz uniquement
  current_step int, recording_by uuid,  -- verrou du micro (doublage)
  expires_at, created_at
)

players (id, room_id, nickname, slot 1..8, is_host, last_seen_at)
```

`options` porte les réglages activables du salon (formes de questions autorisées, minuteur, indices, paris…). Un `jsonb` plutôt que vingt colonnes : ces réglages changeront souvent, et aucun n'a besoin d'être interrogé en SQL.

### Quiz

```sql
quizzes (id, title, author_nickname, is_public, created_at)

questions (
  id, quiz_id, idx,
  kind text check (kind in (
    'ecrite','estimation','classement','frise','carte',
    'petit_bac','theme','indices','intrus','association','media'
  )),
  prompt text, media_path text, points int default 1,
  payload jsonb,        -- forme-dépendant : items, bornes, réponses…
  answer  jsonb         -- correction attendue, null si purement manuelle
)

answers (
  id, room_id, player_id, question_id,
  payload jsonb,        -- ce que le joueur a soumis
  auto_score numeric,   -- calculé quand la forme le permet
  final_score numeric,  -- après passage de l'hôte ; fait foi
  graded_by_host boolean default false,
  answered_at
)
```

**Pourquoi `payload` et `answer` en `jsonb`** : sept formes de questions aux structures incompatibles. Onze tables, ou une colonne souple. La souplesse gagne tant que rien n'a besoin d'être filtré en SQL — et rien n'en a besoin, on lit toujours par question.

**Pourquoi `auto_score` et `final_score` séparés** : la machine propose, l'hôte dispose. On garde la note automatique pour pouvoir montrer à l'hôte ce qui a été calculé, et pour mesurer plus tard la fiabilité du calcul.

### Doublage

```sql
clips (id, title, source, storage_path, thumb_path, duration_sec,
       width, height, peaks jsonb, expires_at, created_at)

takes (id, room_id, player_id, storage_path, mime_type,
       start_sec,          -- ancrage dans le clip
       duration_ms, offset_ms, peaks jsonb, is_selected, created_at)
```

### Cri de la bête

```sql
beasts (id, name, sound_path, image_path, difficulty int, credit text)
```

Le jeu tire au sort dans cette table ; les réponses passent par `answers` avec `kind = 'media'`. Aucun mécanisme spécifique à construire — c'est un quiz à une seule forme de question, ce qui en fait le premier client du moteur de quiz et un bon banc d'essai.

### Sécurité

RLS active partout. Sans comptes, le modèle est : **la clé publique lit, elle n'écrit jamais**. Toutes les écritures passent par des server actions en `service_role`. La lecture large est indispensable — Realtime ne délivre que ce que le client peut voir.

**Une exception à traiter** : les réponses des autres joueurs ne doivent pas être lisibles pendant la partie, sinon il suffit d'ouvrir l'inspecteur pour tricher. La table `answers` reçoit donc une politique qui ne laisse lire que ses propres réponses tant que `rooms.status <> 'results'`.

---

## 6. Le Quiz

L'hôte compose un quiz (ou en prend un tout fait), ouvre un salon, chacun rejoint avec le code. Les questions défilent, tout le monde répond de son côté. **Personne ne voit les réponses des autres.** À la fin, l'hôte passe en revue les questions une par une, tranche ce qui demande du jugement, et le classement se révèle.

### Les trois phases

```
COMPOSITION → PARTIE → CORRECTION → RÉSULTATS
   (hôte)     (tous)     (hôte)       (tous)
```

La correction est un moment de jeu à part entière, pas une corvée administrative : tout le monde regarde l'hôte trancher, les réponses drôles sortent, on conteste. L'écran de correction doit donc être **projetable** — lisible de loin, une question à la fois.

### Les formes de questions

| Forme | Ce que fait le joueur | Notation |
|---|---|---|
| **Écrite** | Tape une réponse libre | Manuelle. L'hôte voit les réponses groupées par similitude pour trancher vite |
| **Estimation** | Donne un nombre | **Auto** — le plus proche marque, dégressif ensuite |
| **Classement** | Ordonne une liste (films les plus vus, pays les plus peuplés…) | **Auto** — points par paire correctement ordonnée, pas tout ou rien |
| **Frise** | Place des évènements sur une ligne du temps | **Auto** — même logique de paires que le classement |
| **Carte** | Pose un point sur une carte | **Auto** — score dégressif selon la distance en kilomètres |
| **Petit bac** | Une lettre, des catégories, un mot par catégorie | Manuelle, mais **les doublons entre joueurs sont détectés automatiquement** |
| **Thème à difficulté** | Choisit son thème et son niveau ; le niveau fixe la mise | Selon la forme sous-jacente |

### Formes supplémentaires proposées

Elles répondent à la demande « des idées qui changent des questions de base ». Chacune est activable ou non dans le salon.

- **Indices dégressifs** — la question s'ouvre sur un indice, d'autres tombent toutes les dix secondes, et la valeur baisse à chaque indice. Répondre tôt paie. Crée une vraie tension collective.
- **Intrus** — cinq éléments, un ne va pas avec les autres. Rapide à composer, rapide à jouer, et l'explication de l'hôte fait souvent débat.
- **Association** — relier deux colonnes (pays/capitale, acteur/film). **Auto**, points par paire juste.
- **Dévoilement** — une image très zoomée qui se dézoome progressivement, ou floue qui se précise. Même tension que les indices, en visuel.
- **Extrait sonore** — un son à identifier. **C'est la brique qui fait exister « Cri de la bête »** : le jeu des animaux n'est qu'un quiz à cette seule forme. Réutilise toute l'infrastructure audio déjà écrite pour le doublage.
- **Pari** — avant de répondre, chacun mise entre 1 et 3 sur sa confiance. Se combine avec n'importe quelle autre forme et change complètement le rythme d'une fin de partie.
- **Question volée** — celui qui passe laisse la main ; les autres peuvent tenter pour la moitié des points.
- **Les questions des joueurs** — chacun soumet une question pendant le lobby, le jeu les pose ensuite. Le contenu se fabrique tout seul, et c'est souvent le meilleur.

### Réglages du salon

Tout est activable ou désactivable par l'hôte, en `rooms.options` :

- quelles formes de questions sont autorisées
- minuteur par question (aucun, 15 s, 30 s, 60 s)
- paris activés
- indices dégressifs activés
- vol de question activé
- ordre des questions aléatoire ou fixe
- réponses anonymes pendant la correction (l'hôte ne voit pas qui a écrit quoi — corrige les biais entre amis)

Ce dernier réglage mérite d'exister : quand l'hôte sait qui a répondu, il est plus indulgent avec certains. L'anonymat pendant la correction rend l'arbitrage plus juste et le résultat plus crédible.

### L'écran de correction

C'est l'écran que je considère le plus risqué du projet : mal fait, il transforme une bonne partie en quart d'heure pénible.

Ce qui le rend rapide :
- **Une question à la fois**, en grand, projetable.
- **Réponses groupées par similitude** — « Napoléon », « napoleon », « Napoléon Bonaparte » arrivent ensemble et se valident d'un seul geste.
- **Tout au clavier** : `J` juste, `F` faux, `→` question suivante, `Z` annuler.
- **Les formes auto-notées arrivent pré-corrigées**, l'hôte se contente de confirmer ou de rectifier.
- **Barre d'avancement** : on doit voir qu'on approche de la fin.

---

## 7. Le Doublage

On importe un clip (ou on en prend un dans la banque), on ouvre un salon, tout le monde voit le même écran. N'importe qui pose la tête de lecture et lance un enregistrement — **un seul micro à la fois**, le verrou vit en base. Personne n'entend les autres pendant la partie : **on découvre toutes les voix d'un coup à la fin**.

### La partition

Pendant l'enregistrement, la vidéo est muette — sinon le micro reprend la bande originale. La forme d'onde est donc **la seule information de timing disponible**. Elle se lit comme une partition, en avance :

- derrière la tête de lecture, ce qui est joué s'estompe
- les **2,5 secondes qui arrivent** sont mises en avant : on voit sa réplique venir
- au-delà, le tracé sert de contexte

### Raccourcis

`Espace` lire/pause · `R` enregistrer · `←→` 2 s · `⇧←→` 0,5 s · `Début` retour au départ. Affichés en permanence sous le transport.

### La latence

`MediaRecorder` ne démarre pas quand on l'appelle : 50 à 150 ms passent avant la première capture. Non corrigé, tout le doublage sonne en retard sans qu'on comprenne pourquoi. La latence est mesurée à chaque prise et l'ancrage décalé d'autant ; un réglage fin manuel de ±300 ms reste disponible à la relecture, parce qu'aucune mesure automatique n'est parfaite et que l'oreille tranche mieux.

---

## 8. Cri de la bête

Un son, quatre propositions ou une réponse libre, on devine l'animal. La révélation montre l'animal en image avec son nom.

Ce jeu ne demande **aucun moteur propre** : c'est un quiz dont toutes les questions sont de forme « extrait sonore ». Il sert donc de banc d'essai au moteur de quiz sur un périmètre minuscule, et il est le premier à en valider les fondations.

Le travail réel est éditorial : constituer la banque de sons, avec leur provenance et leurs droits.

---

## 9. Phases et tâches

### ✅ Phase 0 — Fondations (livrée)

Échafaudage Next.js 15 + TypeScript strict + Vitest · tokens de design et thème clair/sombre sans clignotement · Space Grotesk et Space Mono · 10 primitives d'interface et vitrine `/dev/ui` · schéma Supabase, RLS et sonde de sécurité · buckets et adaptateur de stockage · clients et types générés · cron de maintien · page d'accueil.

### 🔶 Phase 1 — Le socle des salons (en cours)

C'est le prérequis des trois jeux. Rien d'autre ne peut avancer sans lui.

| # | Tâche |
|---|---|
| 1.1 | Migration : `rooms.game`, `rooms.options`, `rooms.host_player_id`, statuts unifiés |
| 1.2 | Server actions : créer un salon, rejoindre par code, quitter |
| 1.3 | Écran de lobby : code en grand, liste des joueurs, réglages, bouton de départ réservé à l'hôte |
| 1.4 | Abonnement Realtime : `useRoomStore`, présence, reconnexion après rafraîchissement |
| 1.5 | Transfert d'hôte si l'hôte quitte |
| 1.6 | Expiration des salons par le cron quotidien |

### Phase 2 — Le Quiz, socle jouable

| # | Tâche |
|---|---|
| 2.1 | Tables `quizzes`, `questions`, `answers` + RLS anti-triche sur `answers` |
| 2.2 | Moteur de questions : composant par forme, contrat commun `{ payload, onAnswer }` |
| 2.3 | Forme **écrite** (la plus simple, valide le cycle complet) |
| 2.4 | Forme **estimation** — première notation automatique |
| 2.5 | Forme **classement** — notation par paires |
| 2.6 | Boucle de partie : question courante, minuteur, attente des joueurs |
| 2.7 | Écran de correction de l'hôte, groupement par similitude, tout au clavier |
| 2.8 | Écran de résultats et podium |
| 2.9 | Éditeur de quiz minimal pour l'hôte |

### Phase 3 — Les formes riches

| # | Tâche |
|---|---|
| 3.1 | **Frise** — placement d'évènements, notation par paires |
| 3.2 | **Carte** — fond de carte libre, notation à la distance |
| 3.3 | **Petit bac** — lettre tirée, catégories, détection automatique des doublons |
| 3.4 | **Thème à difficulté** — choix du thème et de la mise |
| 3.5 | **Extrait sonore** et **image** — réutilise l'adaptateur de stockage |
| 3.6 | **Indices dégressifs** et **dévoilement** |
| 3.7 | **Intrus** et **association** |
| 3.8 | **Paris** et **question volée** |
| 3.9 | Réglages du salon : activer/désactiver chaque forme et chaque option |

### Phase 4 — Cri de la bête

| # | Tâche |
|---|---|
| 4.1 | Table `beasts` et outil d'administration |
| 4.2 | Mode de jeu bâti sur le moteur de quiz, une seule forme |
| 4.3 | Banque initiale : 60 sons avec provenance et droits vérifiés |
| 4.4 | Écran de révélation : son, image, nom |

### Phase 5 — Le Doublage à plusieurs

| # | Tâche |
|---|---|
| 5.1 | Persistance des prises (envoi, stockage, rechargement) |
| 5.2 | Verrou du micro synchronisé : un seul enregistrement à la fois |
| 5.3 | Écoute du résultat mixé, toutes voix confondues |
| 5.4 | Réglage fin du décalage par prise |
| 5.5 | Export MP4 via `ffmpeg.wasm`, sans réencodage vidéo |
| 5.6 | Banque de clips prêts à doubler |

### Phase 6 — Finition

États vides et messages d'erreur · première visite · audit d'accessibilité complet · détection mobile · signalement de contenu · pages légales · test à blanc avec des joueurs extérieurs.

---

## 10. Risques

| Risque | Impact | Traitement |
|---|---|---|
| **L'écran de correction est pénible** | Une bonne partie finit mal | Groupement par similitude, tout au clavier, pré-correction automatique. Chronométré dès la Phase 2 |
| **Les réponses fuitent pendant la partie** | Triche triviale par l'inspecteur | Politique RLS sur `answers` conditionnée au statut du salon (2.1) |
| **Aucune banque de questions** | Le site reste une coquille | 2.9 (éditeur) et 4.3 (sons) sont des tâches à part entière, pas de l'intendance |
| **Le gigaoctet se remplit** | Le site s'arrête | Compression à l'import, expiration des clips, migration R2 préparée |
| **Le doublage sonne décalé** | Paraît raté sans qu'on sache pourquoi | Mesure de latence en place, réglage manuel en 5.4 |
| **Trois jeux, aucun fini** | Rien n'est jouable | Ordre imposé : socle des salons, puis le quiz jusqu'au bout, avant tout le reste |

---

## 11. Ce qui est décidé, et ce qui ne l'est pas

**Décidé.** Aucun traitement vidéo côté serveur · base de données comme source de vérité unique · aucun compte avant plus tard · thème clair par défaut, un seul fichier de tokens · correction manuelle par l'hôte pour tout ce qui demande du jugement, automatique pour le reste · doublage en continu, sans découpage ni personnages · support ordinateur uniquement pour l'enregistrement audio.

**Ouvert.** Le nom du site si le quiz devient le jeu de tête · la provenance et les droits des sons d'animaux et des médias de questions · le passage à Cloudflare R2, déclenché par la mesure et pas avant · le partage public de quiz entre utilisateurs.
