# voiced.io — PRD

**Version** 1.0 · **Date** 2026-08-01 · **Statut** Validé, prêt pour planification technique

---

## 1. Vision

voiced.io est un site où deux personnes doublent ensemble une scène d'anime, en direct, depuis leur navigateur.

On importe un clip, on le découpe en scènes, on attribue les personnages, et chacun enregistre ses répliques à son tour pendant que l'autre regarde. À la fin, on regarde le résultat complet et on le télécharge.

**Le pari produit :** le plaisir vient de la boucle courte — écouter la réplique originale, l'imiter, se rater, recommencer, rire. Tout le design sert cette boucle. Chaque écran qui n'y contribue pas est un écran en trop.

### Principes directeurs

1. **Rien ne bloque le jeu.** Aucun compte requis pour jouer. Un pseudo et un code à 4 lettres suffisent.
2. **Recommencer est gratuit.** Refaire une prise doit coûter un clic et zéro seconde d'attente.
3. **Aucun traitement lourd.** Le découpage ne coupe jamais le fichier, la lecture finale ne rend jamais de vidéo. On ne fabrique un MP4 que si l'utilisateur demande un fichier à partager.
4. **Zéro euro d'infrastructure.** Contrainte de conception, pas d'optimisation a posteriori.

### Hors périmètre (v1)

Enregistrement depuis mobile · plus de 2 joueurs · effets de voix / filtres audio · sous-titres · voix générées par IA · édition vidéo avancée (transitions, recadrage) · modération automatique des uploads.

### Critères de succès

- Deux personnes qui ne connaissent pas le site produisent un clip doublé de bout en bout en **moins de 6 minutes**, sans aide.
- Le décalage entre la voix enregistrée et l'image dans la lecture finale est **imperceptible** (< 60 ms).
- Refaire une prise prend **moins de 2 secondes** entre le clic et le début de l'enregistrement.
- Aucune ligne de facture. Jamais.

---

## 2. Contrainte fondatrice : le 100 % gratuit

Aucune plateforme gratuite ne permet de faire tourner FFmpeg côté serveur de façon fiable. Les fonctions serverless sont coupées avant la fin, les conteneurs gratuits s'endorment ou n'ont pas assez de RAM. **L'architecture entière découle de ce constat : il n'y a pas de traitement vidéo côté serveur.**

Trois décisions permettent de s'en passer :

**a) Le découpage est non-destructif.** Une scène n'est pas un fichier, c'est une paire de nombres : `{ start: 4.2, end: 11.8 }`. Le lecteur joue l'intervalle. Découper un clip en 8 scènes = 8 lignes en base de données, zéro octet de plus, zéro seconde de calcul.

**b) La lecture finale n'est pas un fichier.** Regarder le clip doublé, c'est jouer la vidéo en muet pendant qu'un moteur Web Audio déclenche les pistes enregistrées à la milliseconde près. Instantané, gratuit, et réécouter une seule réplique ne demande aucun re-rendu.

**c) L'export MP4 se fait dans le navigateur, et il est rapide.** `ffmpeg.wasm` a une mauvaise réputation parce qu'on lui fait réencoder de la vidéo. Ici on n'y touche pas : `-c:v copy`. On ne réencode que la piste audio mixée. Un clip d'une minute s'exporte en 10 à 20 secondes.

### Services et quotas

| Besoin | Service | Quota gratuit | Contrainte à gérer |
|---|---|---|---|
| Site + routes API | Vercel Hobby | 100 Go bande passante/mois | Usage non commercial uniquement |
| Base de données | Supabase Postgres | 500 Mo | Projet mis en pause après 7 j d'inactivité |
| Synchro 2 joueurs | Supabase Realtime | 200 connexions simultanées, 2 M messages/mois | Confortable |
| Fichiers | Supabase Storage | 1 Go stockage, 5 Go egress/mois | **La vraie limite** |
| Traitement vidéo | Aucun serveur | — | ffmpeg.wasm côté client |

### Garde-fous de stockage

Le gigaoctet de stockage est la ressource rare. Trois mesures, à implémenter dès la Phase 0 et non « plus tard » :

- **Les clips personnalisés expirent au bout de 7 jours.** Colonne `expires_at`, nettoyage par un Cron Vercel quotidien qui supprime les fichiers et les lignes. Annoncé clairement à l'upload.
- **Les prises audio expirent en même temps que leur salon.** Une prise de 10 s en Opus pèse ~20 Ko : ce n'est pas le problème, mais on ne garde pas de déchets.
- **La bibliothèque officielle reste petite et courte.** Clips de 15 à 30 s, ~3 Mo pièce : 200 clips tiennent dans 600 Mo.
- **Limite à l'upload :** 50 Mo et 3 minutes maximum par fichier, vérifiés côté client avant l'envoi.

### Porte de sortie

Quand le stockage deviendra serré, **Cloudflare R2** (10 Go, egress illimité et gratuit) prend le relais. Pour que la migration soit un changement d'un seul fichier, **tout accès aux fichiers passe par `lib/storage/index.ts`** qui expose quatre fonctions : `upload`, `getUrl`, `remove`, `exists`. Aucun composant n'importe jamais le client Supabase Storage directement. C'est la seule abstraction « au cas où » que ce projet s'autorise, parce que son coût est de dix lignes et son bénéfice est de ne pas réécrire vingt fichiers.

---

## 3. Direction visuelle — Studio Dub

Un outil de montage propre. L'interface s'efface, la vidéo occupe l'espace, et les seuls éléments qui attirent l'œil sont ceux sur lesquels on doit agir.

**Signature visuelle :** les waveforms (référence en gris, la vôtre en orange, superposables) et les timecodes en monospace. C'est tout. Pas de dégradé, pas d'ombre décorative, pas d'illustration, pas d'icône qui ne serve à rien.

### Règles de retenue

Ces règles priment sur toute envie d'ajout :

- **Une seule couleur d'accent visible par écran.** L'orange marque l'action principale, rien d'autre.
- **Aucun dégradé, aucune ombre portée décorative.** Les ombres servent uniquement à détacher un élément flottant (modale, menu).
- **Bordures de 1 px.** Jamais plus.
- **L'espace blanc fait le travail de séparation**, pas les traits ni les fonds colorés.
- **Une icône n'apparaît que si elle remplace du texte**, jamais en décoration à côté d'un libellé.
- **Une seule taille de police pour le corps de texte** (15 px) et trois tailles au total pour tout le site.

### Tokens — `styles/theme.css`

Toutes les couleurs vivent ici, et nulle part ailleurs. Aucune valeur hexadécimale n'est écrite dans un composant. Le dark mode redéfinit uniquement des variables : il n'existe aucune variante conditionnelle dans le code des composants.

```css
:root {
  /* Surfaces */
  --bg:             #FAFAF8;
  --surface:        #FFFFFF;
  --surface-sunken: #F1F1EF;
  --border:         #E4E4E7;
  --border-strong:  #C9C9CE;

  /* Texte */
  --text:           #101014;
  --text-muted:     #6B6B75;
  --text-faint:     #9A9AA3;

  /* Accent */
  --accent:         #FF5A1F;
  --accent-hover:   #E64E15;
  --accent-soft:    #FFF0E9;
  --on-accent:      #FFFFFF;

  /* États */
  --rec:            #E5484D;
  --ok:             #12B981;
  --warn:           #F5A524;

  /* Waveform */
  --wave-ref:       #C9C9CE;
  --wave-self:      #FF5A1F;
  --playhead:       #101014;

  /* Identité joueur */
  --player-1:       #0EA5E9;
  --player-2:       #F59E0B;

  /* Forme */
  --radius:         6px;
  --radius-lg:      10px;
  --shadow:         0 1px 2px rgb(16 16 20 / .06);
  --shadow-float:   0 8px 24px rgb(16 16 20 / .10);

  /* Typo */
  --font-ui:        'Inter', system-ui, sans-serif;
  --font-mono:      'JetBrains Mono', ui-monospace, monospace;
}

[data-theme='dark'] {
  --bg:             #0B0B0D;
  --surface:        #16161A;
  --surface-sunken: #0F0F12;
  --border:         #26262B;
  --border-strong:  #3A3A42;

  --text:           #F2F2F4;
  --text-muted:     #9A9AA3;
  --text-faint:     #6B6B75;

  --accent-soft:    #2A1509;
  --wave-ref:       #3A3A42;
  --playhead:       #F2F2F4;

  --shadow:         none;
  --shadow-float:   0 8px 24px rgb(0 0 0 / .50);
}
```

Les accents (`--accent`, `--rec`, `--ok`, joueurs) sont identiques dans les deux thèmes : ils ont été choisis pour tenir le contraste sur `#FAFAF8` comme sur `#0B0B0D`.

### Mécanisme de thème

- Attribut `data-theme` sur `<html>`, valeur `light` (défaut) ou `dark`.
- Persistance dans `localStorage` sous la clé `voiced-theme`.
- Un script inline dans `app/layout.tsx`, exécuté avant le premier rendu, applique l'attribut pour éviter le flash blanc au chargement en dark.
- Le composant `<ThemeToggle />` bascule l'attribut. Il vit dans l'en-tête, discret, jamais mis en avant.
- Aucun respect automatique de `prefers-color-scheme` : le light est le défaut assumé, l'utilisateur choisit explicitement.

### Typographie

| Usage | Police | Taille | Graisse |
|---|---|---|---|
| Titre d'écran | Inter | 24 px | 600 |
| Sous-titre / label de section | Inter | 13 px, lettres espacées, majuscules | 500 |
| Corps | Inter | 15 px | 400 |
| Timecodes, durées, compteurs | JetBrains Mono | 13 px | 500, chiffres tabulaires |

Les chiffres qui changent en continu (position de lecture, durée d'enregistrement) sont **toujours** en monospace à chasse tabulaire, sinon la ligne tremble.

### Mouvement

150 ms, `ease-out`, uniquement sur `opacity` et `transform`. Aucun rebond, aucune animation d'entrée d'écran. Trois exceptions animées, toutes fonctionnelles : le décompte avant enregistrement, la pulsation du point rouge pendant l'enregistrement, et le déplacement de la tête de lecture.

### Accessibilité

- Contraste minimum 4.5:1 pour le texte, vérifié dans les deux thèmes.
- L'état d'enregistrement n'est jamais signalé par la seule couleur : point rouge **et** libellé « ENREGISTREMENT » **et** compteur qui tourne.
- Focus visible sur tous les éléments interactifs (contour 2 px `--accent`).
- Toute la boucle de doublage est pilotable au clavier : `Espace` rejouer, `R` enregistrer, `Entrée` valider.

---

## 4. Architecture technique

### Stack

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework | Next.js 15 (App Router), TypeScript | Un seul déploiement pour le site et les routes serveur |
| Style | Tailwind CSS v4 | Les tokens CSS de `theme.css` sont exposés directement comme classes utilitaires |
| Base + temps réel | Supabase (Postgres, Realtime, Storage) | Les trois besoins couverts par un seul service gratuit |
| État local | Zustand | Un store = un fichier. Plus lisible que des contextes imbriqués |
| Audio | Web Audio API + MediaRecorder | Natif, aucune dépendance |
| Export | `@ffmpeg/ffmpeg` (build mono-thread) | Le build mono-thread évite les en-têtes COOP/COEP, qui casseraient le chargement des vidéos depuis Supabase |

### Le principe de synchronisation

**La base de données est l'unique source de vérité.** Chaque transition d'état d'une partie est une écriture en base. Les deux clients écoutent les changements Postgres via Supabase Realtime et se redessinent. Il n'existe aucun état de partie qui vive uniquement dans la mémoire d'un navigateur.

C'est légèrement plus lent qu'un canal de diffusion direct, et c'est un choix délibéré : il devient structurellement impossible que les deux joueurs voient des choses différentes, et un joueur qui rafraîchit sa page retrouve exactement l'état de la partie. Le débit est trivial — quelques dizaines d'écritures par partie.

### Arborescence

```
voiced.io/
├─ app/
│  ├─ layout.tsx                    # thème, polices, en-tête
│  ├─ page.tsx                      # accueil, choix du mode
│  ├─ globals.css
│  ├─ create/page.tsx               # upload → découpage → personnages
│  ├─ library/page.tsx              # bibliothèque de clips (Phase 3)
│  └─ room/[code]/page.tsx          # lobby → casting → doublage → résultat
│
├─ components/
│  ├─ ui/                           # primitives, aucune logique métier
│  │  ├─ Button.tsx  IconButton.tsx  Panel.tsx  Input.tsx
│  │  ├─ Dialog.tsx  Badge.tsx  Timecode.tsx  Spinner.tsx
│  │  ├─ ThemeToggle.tsx  EmptyState.tsx
│  │  └─ index.ts                   # ré-export unique
│  ├─ video/
│  │  ├─ VideoStage.tsx             # lecteur, joue un intervalle donné
│  │  ├─ Waveform.tsx               # rendu canvas de peaks
│  │  ├─ Timeline.tsx               # barre + poignées de découpage
│  │  └─ SceneList.tsx
│  ├─ record/
│  │  ├─ RecordControls.tsx
│  │  ├─ Countdown.tsx
│  │  ├─ LevelMeter.tsx
│  │  └─ TakeRow.tsx
│  └─ room/
│     ├─ PlayerBadge.tsx  CharacterCard.tsx  TurnBanner.tsx  RoomCode.tsx
│
├─ lib/
│  ├─ supabase/client.ts  server.ts
│  ├─ storage/index.ts              # SEUL point d'accès aux fichiers
│  ├─ audio/
│  │  ├─ recorder.ts                # MediaRecorder encapsulé + mesure de latence
│  │  ├─ peaks.ts                   # extraction et cache des waveforms
│  │  └─ player.ts                  # lecture synchronisée vidéo + pistes
│  ├─ export/ffmpeg.ts              # construction de la commande d'export
│  ├─ room/actions.ts               # server actions : créer, rejoindre, avancer
│  └─ utils/time.ts  id.ts  file.ts
│
├─ stores/
│  ├─ useRoomStore.ts               # état de la partie, abonnement Realtime
│  └─ useDubStore.ts                # état de l'écran de doublage
│
├─ styles/theme.css                 # TOUS les tokens
├─ types/db.ts                      # types générés depuis Supabase
└─ supabase/migrations/
```

### Règles de code

Elles servent la demande « code le plus simple possible, bien découpé » :

1. **Un composant `ui/` ne connaît aucun concept métier.** Il ignore ce qu'est une scène, un joueur, une prise. Il reçoit des props génériques.
2. **Un fichier dépasse 200 lignes = il fait trop de choses.** On le découpe.
3. **Aucun appel Supabase dans un composant.** Les composants appellent des fonctions de `lib/`, qui parlent à Supabase.
4. **Aucune valeur hexadécimale hors de `theme.css`.**
5. **Toute logique testable sans navigateur vit dans `lib/`** et est couverte par des tests.
6. **Pas d'abstraction « au cas où ».** Les deux seules autorisées sont `lib/storage/` (migration R2 prévue) et `components/ui/` (réutilisation réelle et immédiate).

---

## 5. Modèle de données

```sql
-- Le fichier vidéo source
clips (
  id            uuid primary key,
  title         text not null,
  source        text not null check (source in ('library','custom')),
  storage_path  text not null,
  thumb_path    text,
  duration_sec  numeric not null,
  width         int,  height int,
  anime_title   text,                    -- rempli pour la bibliothèque
  peaks         jsonb,                   -- waveform pré-calculée, cache
  created_by    text,                    -- pseudo, pas de compte en Phase 1-2
  expires_at    timestamptz,             -- null pour la bibliothèque
  created_at    timestamptz default now()
)

-- Un personnage du clip
characters (
  id        uuid primary key,
  clip_id   uuid references clips on delete cascade,
  name      text not null,
  color     text not null,               -- token, ex. 'player-1'
  sort      int  not null
)

-- Une scène = un intervalle + UN personnage qui parle
scenes (
  id           uuid primary key,
  clip_id      uuid references clips on delete cascade,
  character_id uuid references characters on delete set null,
  idx          int     not null,
  start_sec    numeric not null,
  end_sec      numeric not null,
  label        text,
  unique (clip_id, idx)
)

-- Une partie
rooms (
  id            uuid primary key,
  code          text unique not null,    -- 4 lettres, sans voyelles ambiguës
  clip_id       uuid references clips,
  status        text not null,           -- lobby|casting|dubbing|review|done
  current_idx   int  default 0,          -- scène en cours
  expires_at    timestamptz not null,    -- création + 24 h
  created_at    timestamptz default now()
)

players (
  id           uuid primary key,
  room_id      uuid references rooms on delete cascade,
  nickname     text not null,
  slot         int  not null check (slot in (1,2)),
  is_host      boolean default false,
  last_seen_at timestamptz default now(),
  unique (room_id, slot)
)

-- Qui joue quel personnage
assignments (
  room_id      uuid references rooms on delete cascade,
  character_id uuid references characters on delete cascade,
  player_id    uuid references players on delete cascade,
  primary key (room_id, character_id)
)

-- Un enregistrement
takes (
  id           uuid primary key,
  room_id      uuid references rooms on delete cascade,
  scene_id     uuid references scenes on delete cascade,
  player_id    uuid references players on delete set null,
  storage_path text not null,
  duration_ms  int  not null,
  offset_ms    int  default 0,           -- correction de latence, ajustable
  peaks        jsonb,
  is_selected  boolean default true,     -- la prise retenue pour la scène
  created_at   timestamptz default now()
)
```

### Décisions de modélisation

**Une scène = un seul personnage qui parle.** Si deux personnages parlent, on coupe en deux scènes. Cette contrainte simplifie radicalement le casting, le tour de parole et l'écran de doublage — et elle correspond à la façon naturelle de découper. Les scènes à plusieurs répliques imbriquées sont un besoin de Phase 4, pas de Phase 1.

**Plusieurs prises par scène, une seule sélectionnée.** `is_selected` permet de garder les ratés et de revenir dessus, ce qui est souvent le plus drôle. Elles disparaissent avec le salon.

**Les peaks sont mises en cache en base.** Calculées une fois au premier visionnage, réutilisées ensuite. Cela évite de re-décoder l'audio à chaque chargement d'écran.

**Pas de `users` avant la Phase 3.** Un joueur, c'est un pseudo attaché à un salon. La table `players` est déjà prête à recevoir une colonne `user_id` nullable le moment venu, sans migration douloureuse.

### Sécurité

Row Level Security activé sur toutes les tables. En l'absence de comptes (Phase 1-2), le modèle est : **la connaissance du code de salon donne l'accès**. Les routes serveur vérifient le code, les clients n'écrivent jamais directement en base sur les tables sensibles (`rooms`, `assignments`) — ils passent par des server actions. Les uploads passent par des URLs signées à durée courte.

---

## 6. Parcours utilisateur

### Boucle principale — clip personnalisé

```
Accueil
  └─ « Créer une partie »
      ├─ Upload du MP4                    (glisser-déposer, < 50 Mo, < 3 min)
      ├─ Découpage                        (poser des marqueurs sur la timeline)
      ├─ Personnages                      (nommer, puis assigner un perso à chaque scène)
      └─ Salon créé → code à 4 lettres
          ├─ Le joueur 2 rejoint avec le code
          ├─ Casting                      (qui double qui)
          ├─ Doublage                     (scène par scène, chacun son tour)
          └─ Résultat                     (lecture complète, export MP4)
```

### L'écran de découpage

Un lecteur, une timeline sous la vidéo, un bouton **« Couper ici »** qui pose un marqueur à la position courante. Les marqueurs se déplacent au glisser. Chaque intervalle devient une scène dans une liste à droite, avec sa durée en monospace et un bouton de prévisualisation.

Rien d'autre. Pas de zoom, pas de pistes multiples, pas de glisser-déposer de scènes. « Un éditeur vidéo très très simple » signifie : poser des marqueurs, les bouger, en supprimer.

**Aide au découpage :** un bouton « Détecter les silences » propose des marqueurs automatiques en analysant les peaks (seuil d'amplitude + durée minimale de silence). Purement local, purement suggestif — l'utilisateur accepte, ajuste ou ignore. C'est du confort, pas une dépendance.

### L'écran de doublage

C'est l'écran central. Sa mise en page :

```
┌────────────────────────────────────────────────────────┐
│  voiced.io          Scène 3 / 7          [◐]  Tom  Léa │
│                                                        │
│              ┌──────────────────────────┐              │
│              │                          │              │
│              │      VIDÉO 16:9          │              │
│              │                          │              │
│              └──────────────────────────┘              │
│                                                        │
│   RÉFÉRENCE   ▁▃▅█▇▅▃▁▁▃▅▇█▅▃▁▁▃▅▁                    │
│   TOI         ▁▁▃▅▇█▇▅▃▁▁▁▃▅▇▅▃▁▁▁                    │
│   ──────────────────────●─────────────────             │
│   00:04.21 / 00:11.80                                  │
│                                                        │
│        [ ⟲ Rejouer ]      [ ● Enregistrer ]            │
└────────────────────────────────────────────────────────┘
```

**Le déroulé exact d'une scène :**

1. À l'arrivée sur la scène, la vidéo joue **avec le son original**. C'est la référence. La waveform de référence se dessine en gris pendant cette lecture.
2. Clic sur **Enregistrer** → décompte 3-2-1 → la vidéo repart du début de la scène **en muet**, le micro tourne. Point rouge, libellé, compteur.
3. Fin de la scène → l'enregistrement s'arrête tout seul. Lecture automatique du résultat.
4. Trois choix : **Refaire** (retour à l'étape 2, instantané), **Rejouer l'original** (retour à l'étape 1), **Valider** → scène suivante.
5. Pendant tout ce temps, l'autre joueur voit le même écran en lecture seule, avec un bandeau « Léa enregistre… », et entend la prise en même temps que son auteur au moment de la relecture.

**Le tour de parole** découle mécaniquement du casting : la scène 3 appartient au personnage Naruto, Naruto est joué par Tom, donc c'est le tour de Tom. Aucun bouton « passer le tour » n'existe. Si les deux joueurs doublent des personnages différents dans des scènes consécutives, ça alterne tout seul.

### L'écran de résultat

La vidéo complète se joue avec tous les doublages en place. Sous le lecteur, la liste des scènes avec pour chacune le personnage, le joueur, et un bouton pour refaire cette scène-là uniquement. Un bouton **Exporter en MP4**, et un curseur « garder le son original » à 0 % par défaut (le monter permet de récupérer musique et bruitages, au prix d'entendre les voix japonaises en fond).

---

## 7. Les points techniques qui feront mal

Trois problèmes méritent d'être nommés maintenant plutôt que découverts en Phase 2.

### La latence d'enregistrement

`MediaRecorder` ne commence pas à capturer à l'instant où on l'appelle. Le délai réel varie de 50 à 150 ms selon la machine et le navigateur. Non corrigé, le doublage est systématiquement en retard et le résultat semble raté sans qu'on comprenne pourquoi.

**Traitement :** on relève `performance.now()` au premier événement `playing` de la vidéo et au premier `dataavailable` du recorder. La différence est stockée dans `takes.offset_ms` et appliquée à la lecture comme à l'export. En complément, l'écran de résultat expose un réglage fin par scène, de −300 à +300 ms par pas de 10 ms, parce qu'aucune mesure automatique n'est parfaite et que l'oreille tranche mieux.

### L'extraction des waveforms

`decodeAudioData` sur un MP4 fonctionne sur Chrome et Safari, mal sur Firefox. Extraire proprement la piste audio demanderait FFmpeg — qu'on n'a pas en Phase 1.

**Traitement :** on capture les amplitudes en temps réel pendant la première lecture du clip, via `MediaElementAudioSourceNode` + `AnalyserNode`. Or le parcours impose déjà de regarder chaque scène avant de la doubler. La waveform se construit donc pendant un visionnage qui a lieu de toute façon, sans dépendance, sur tous les navigateurs. Le résultat part dans `clips.peaks` et devient instantané ensuite.

### Les formats audio selon le navigateur

Chrome et Firefox enregistrent en `audio/webm;codecs=opus`, Safari en `audio/mp4;codecs=aac`. L'export doit gérer les deux.

**Traitement :** on stocke le type MIME avec chaque prise et on laisse FFmpeg décider du décodeur à l'entrée. La sortie est toujours de l'AAC dans un conteneur MP4. **Support annoncé : Chrome, Edge et Firefox sur ordinateur.** Safari est testé en Phase 2 et documenté comme « fonctionne, non garanti ». Le mobile est explicitement hors périmètre pour l'enregistrement — un bandeau le dit à l'entrée plutôt que de laisser l'utilisateur le découvrir après avoir uploadé son clip.

---

## 8. Phases et tâches

Cinq phases. Chacune se termine sur quelque chose d'utilisable, pas sur une couche technique.

---

### Phase 0 — Fondations

*Objectif : un site déployé, un thème qui bascule, une base de données prête, un kit de composants. Rien de fonctionnel, mais tout le reste s'appuie dessus.*

| # | Tâche | Détail |
|---|---|---|
| 0.1 | Initialiser Next.js 15 + TypeScript + Tailwind v4 | App Router, mode strict |
| 0.2 | Créer le projet Supabase | Récupérer les clés, configurer `.env.local` et `.env.example` |
| 0.3 | Écrire `styles/theme.css` | Tous les tokens de la section 3, light et dark |
| 0.4 | Brancher les tokens sur Tailwind | Via `@theme` en Tailwind v4, pour écrire `bg-surface` et non `bg-[var(--surface)]` |
| 0.5 | Mécanisme de thème | Attribut `data-theme`, `localStorage`, script anti-flash dans `layout.tsx` |
| 0.6 | Charger les polices | Inter et JetBrains Mono via `next/font`, chiffres tabulaires activés |
| 0.7 | Composant `<ThemeToggle />` | |
| 0.8 | Kit UI de base | `Button`, `IconButton`, `Panel`, `Input`, `Badge`, `Spinner`, `Timecode`, `EmptyState` + `index.ts` |
| 0.9 | Composant `<Dialog />` | Focus piégé, fermeture par `Échap` |
| 0.10 | Layout global | En-tête minimal : logo, contexte, `ThemeToggle` |
| 0.11 | Migration SQL initiale | Les 6 tables de la section 5, index sur `rooms.code` et `scenes(clip_id, idx)` |
| 0.12 | Politiques RLS | Lecture par code de salon, écritures sensibles réservées aux server actions |
| 0.13 | Buckets Storage | `clips`, `takes`, `thumbs` + politiques d'accès |
| 0.14 | Générer `types/db.ts` | Script npm pour régénérer après chaque migration |
| 0.15 | `lib/storage/index.ts` | `upload`, `getUrl`, `remove`, `exists` — implémentation Supabase |
| 0.16 | `lib/utils/time.ts` | Formatage `mm:ss.cc`, conversions, découpage d'intervalles + tests |
| 0.17 | `lib/utils/id.ts` | Génération de code de salon à 4 lettres, alphabet sans caractères ambigus |
| 0.18 | Déployer sur Vercel | Variables d'environnement, vérifier que la bascule de thème fonctionne en production |
| 0.19 | Page d'accueil statique | Titre, deux boutons (dont un désactivé), pied de page. Valide la direction visuelle en vrai |

**Fin de phase :** une page en ligne, sobre, qui bascule entre light et dark sans clignoter.

---

### Phase 1 — La boucle complète, en solo

*Objectif : une seule personne peut importer un clip, le découper, doubler tous les personnages et regarder le résultat. Tout le cœur du produit est validé avant d'ajouter la difficulté du temps réel.*

Le salon existe déjà en base dès cette phase, avec un seul joueur. La Phase 2 sera un ajout, pas une réécriture.

#### Import

| # | Tâche | Détail |
|---|---|---|
| 1.1 | Écran d'upload | Glisser-déposer, sélection de fichier, barre de progression |
| 1.2 | Validation côté client | MP4 uniquement, ≤ 50 Mo, ≤ 3 min, dimensions lisibles. Messages d'erreur explicites |
| 1.3 | Upload vers Storage | URL signée, création de la ligne `clips` avec `expires_at` à +7 j |
| 1.4 | Vignette | Capture d'une image à 10 % de la durée via `<canvas>`, upload dans `thumbs` |
| 1.5 | Mention de l'expiration | Visible à l'upload, pas enfouie dans des CGU |

#### Lecture

| # | Tâche | Détail |
|---|---|---|
| 1.6 | `<VideoStage />` | Lecteur qui joue un intervalle `[start, end]`, s'arrête à `end`, expose `seek`, `play`, `replay` |
| 1.7 | `lib/audio/peaks.ts` | Capture des amplitudes en temps réel pendant la lecture, réduction à ~600 points |
| 1.8 | `<Waveform />` | Rendu canvas, deux pistes superposables, tête de lecture, adapté au ratio de pixels |
| 1.9 | Cache des peaks | Écriture dans `clips.peaks` au premier passage, relecture ensuite |

#### Découpage

| # | Tâche | Détail |
|---|---|---|
| 1.10 | `<Timeline />` | Barre pleine largeur, marqueurs déplaçables au glisser, tête de lecture |
| 1.11 | Poser / supprimer un marqueur | Bouton « Couper ici » à la position courante, suppression au clic droit ou via la liste |
| 1.12 | Dérivation des scènes | Les marqueurs produisent les intervalles, écriture en base, `idx` réindexé |
| 1.13 | `<SceneList />` | Une ligne par scène : numéro, durée en monospace, prévisualisation, suppression |
| 1.14 | Détection de silences | Analyse des peaks, seuil réglable, proposition de marqueurs à accepter ou ignorer. Nécessite des peaks complètes : le bouton reste désactivé tant que le clip n'a pas été lu une fois de bout en bout, avec la raison affichée |
| 1.15 | Garde-fous | Durée minimale de scène 0.5 s, maximum 30 scènes par clip |

#### Personnages

| # | Tâche | Détail |
|---|---|---|
| 1.16 | Écran personnages | Ajouter, renommer, supprimer. Couleur attribuée automatiquement |
| 1.17 | Assignation scène → personnage | Sélecteur sur chaque ligne de la liste de scènes |
| 1.18 | Validation | Impossible de continuer si une scène n'a pas de personnage |

#### Doublage

| # | Tâche | Détail |
|---|---|---|
| 1.19 | `lib/audio/recorder.ts` | `MediaRecorder` encapsulé : démarrage, arrêt, mesure de latence, retour du blob et de sa durée |
| 1.20 | Autorisation micro | Demande explicite avec explication, gestion du refus |
| 1.21 | `<LevelMeter />` | Barre de niveau d'entrée, avertissement si saturation ou silence total |
| 1.22 | `<Countdown />` | 3-2-1 en surimpression, l'unique animation appuyée du site |
| 1.23 | `<RecordControls />` | Rejouer, Enregistrer, Refaire, Valider — états mutuellement exclusifs |
| 1.24 | Machine à états de la scène | `écoute → décompte → enregistrement → relecture → validé`, dans `useDubStore` |
| 1.25 | Arrêt automatique | L'enregistrement s'arrête à la fin de la scène, sans clic |
| 1.26 | Upload de la prise | Vers `takes`, avec `duration_ms`, `offset_ms`, type MIME |
| 1.27 | Prises multiples | Historique par scène, sélection de la prise retenue |
| 1.28 | Raccourcis clavier | `Espace`, `R`, `Entrée` |

#### Résultat

| # | Tâche | Détail |
|---|---|---|
| 1.29 | `lib/audio/player.ts` | Lecture synchronisée : vidéo en muet + planification des pistes via Web Audio, `offset_ms` appliqué |
| 1.30 | Écran de résultat | Lecture continue, liste des scènes, bouton pour refaire une scène isolée |
| 1.31 | Réglage fin de décalage | Curseur −300/+300 ms par scène, écoute immédiate du changement |
| 1.32 | Volume du son original | Curseur global, 0 % par défaut |

**Fin de phase :** vous importez un clip, le découpez, doublez tous les personnages seul, et regardez le résultat synchronisé. Le produit est validé — il ne lui manque que le deuxième joueur.

---

### Phase 2 — Deux joueurs en direct + export MP4

*Objectif : le produit tel qu'il a été imaginé.*

#### Salon et connexion

| # | Tâche | Détail |
|---|---|---|
| 2.1 | Création de salon | Code à 4 lettres unique, `expires_at` à +24 h, redirection vers `/room/[code]` |
| 2.2 | Écran de connexion | Saisie du pseudo et du code, erreurs claires (salon inexistant, expiré, complet) |
| 2.3 | `<RoomCode />` | Affichage du code en grand caractères espacés, copie du lien en un clic |
| 2.4 | Lobby | Les deux emplacements de joueur, état de connexion, bouton de démarrage réservé à l'hôte |
| 2.5 | `useRoomStore` | Abonnement Realtime aux tables `rooms`, `players`, `takes`, `assignments` |
| 2.6 | Présence | `last_seen_at` rafraîchi toutes les 10 s, indicateur « déconnecté » au-delà de 30 s |
| 2.7 | Reconnexion | Rafraîchir la page restaure exactement l'état de la partie |
| 2.8 | Expiration des salons | Cron Vercel quotidien : suppression des salons, prises et clips périmés |

#### Casting

| # | Tâche | Détail |
|---|---|---|
| 2.9 | Écran de casting | Un `<CharacterCard />` par personnage, attribution à un joueur |
| 2.10 | Synchronisation en direct | L'attribution faite par l'un apparaît chez l'autre immédiatement |
| 2.11 | Validation | Chaque personnage doit avoir un joueur ; chaque joueur au moins un personnage |
| 2.12 | Attribution automatique | Bouton « Répartir » qui équilibre le nombre de répliques |

#### Doublage à deux

| # | Tâche | Détail |
|---|---|---|
| 2.13 | Tour de parole | Dérivé du casting via le personnage de la scène courante. Aucun bouton manuel |
| 2.14 | `<TurnBanner />` | « À toi » ou « Léa enregistre… », toujours visible |
| 2.15 | Mode spectateur | L'écran du joueur inactif reflète l'autre, contrôles désactivés |
| 2.16 | Écoute partagée | La relecture d'une prise se déclenche chez les deux joueurs simultanément |
| 2.17 | Validation de scène | Passage à la scène suivante par écriture de `current_idx`, les deux clients suivent |
| 2.18 | Départ d'un joueur | Message clair, partie en pause, reprise à la reconnexion |
| 2.19 | Cas de l'hôte seul | Si le second joueur ne vient jamais, l'hôte peut doubler tous les personnages |

#### Export MP4

| # | Tâche | Détail |
|---|---|---|
| 2.20 | Intégrer `@ffmpeg/ffmpeg` | Build mono-thread, chargement à la demande uniquement sur l'écran de résultat |
| 2.21 | `lib/export/ffmpeg.ts` | Construction de la commande : `adelay` par piste, `amix`, `-map 0:v -c:v copy -c:a aac` |
| 2.22 | Application des décalages | `offset_ms` et ajustements manuels intégrés au `adelay` |
| 2.23 | Volume du son original | Filtre `volume` sur la piste d'origine selon le curseur |
| 2.24 | Interface d'export | Progression réelle, estimation, annulation possible |
| 2.25 | Téléchargement | Nom de fichier lisible : `voiced-<titre>-<date>.mp4` |
| 2.26 | Gestion des échecs | Message honnête et repli sur la lecture en ligne si l'export échoue |
| 2.27 | Test multi-navigateurs | Chrome, Edge, Firefox. Safari testé et documenté |

**Fin de phase :** deux personnes doublent un clip ensemble et repartent avec un fichier MP4.

---

### Phase 3 — Bibliothèque et comptes

*Objectif : pouvoir jouer sans avoir de clip sous la main. C'est ce qui transforme un outil en site où l'on revient.*

#### Bibliothèque

| # | Tâche | Détail |
|---|---|---|
| 3.1 | Statut `library` sur les clips | Pas d'expiration, découpage et personnages pré-remplis |
| 3.2 | Outil d'administration | Interface protégée pour importer un clip, le découper, le publier |
| 3.3 | Page bibliothèque | Grille de vignettes : titre, anime, durée, nombre de personnages |
| 3.4 | Filtres | Par anime, par durée, par nombre de personnages |
| 3.5 | Aperçu | Lecture du clip sans lancer de partie |
| 3.6 | « Clip au hasard » | Un bouton, une partie créée immédiatement |
| 3.7 | Constituer le fonds initial | 30 clips découpés et castés à la main. Le travail le plus long de la phase, et le plus déterminant |
| 3.8 | Surveillance du quota | Tableau de bord interne du stockage utilisé, alerte à 80 % |

#### Comptes

| # | Tâche | Détail |
|---|---|---|
| 3.9 | Supabase Auth | Email par lien magique + Discord |
| 3.10 | Colonne `user_id` sur `players` | Nullable : jouer sans compte reste possible, définitivement |
| 3.11 | Historique | Liste des doublages passés, relecture, ré-export |
| 3.12 | Profil | Pseudo par défaut, thème préféré, statistiques simples |
| 3.13 | Rattachement rétroactif | À la création d'un compte, proposer de récupérer les parties de la session en cours |
| 3.14 | Mise à jour des RLS | Accès par compte en plus de l'accès par code |

#### Partage

| # | Tâche | Détail |
|---|---|---|
| 3.15 | Lien de partage public | Page en lecture seule d'un doublage terminé |
| 3.16 | Métadonnées Open Graph | Vignette et titre corrects sur Discord et les réseaux |

**Fin de phase :** on arrive sur le site, on clique sur « Au hasard », on joue.

---

### Phase 4 — Nouveaux modes

*Objectif : donner une raison de revenir. Chaque mode réutilise le moteur des phases 1 et 2 ; aucun ne demande de nouvelle brique technique.*

| # | Tâche | Détail |
|---|---|---|
| 4.1 | Notion de mode de jeu | Colonne `mode` sur `rooms`, aiguillage des écrans |
| 4.2 | **Mode « La suite »** | On regarde le début d'un clip, on double la suite sans savoir ce qui est dit. La révélation de l'original à la fin est le cœur du mode |
| 4.3 | Découpage point-de-coupe | Marquer où s'arrête le contexte et où commence l'improvisation |
| 4.4 | Écran de révélation | Version doublée puis version originale, l'une après l'autre |
| 4.5 | **Mode « Sans le son »** | La référence audio est coupée dès le premier visionnage. Seule l'image guide |
| 4.6 | **Mode « Rôle imposé »** | Une contrainte de jeu tirée au sort par scène : en colère, en chuchotant, en chantant |
| 4.7 | Sélecteur de mode | Sur l'écran de création, avec une explication courte de chacun |
| 4.8 | Scènes à plusieurs répliques | Lever la contrainte « une scène = un personnage » pour les dialogues rapides |
| 4.9 | Bilan de fin de partie | Récapitulatif léger : nombre de prises, scène la plus refaite |

---

### Phase 5 — Finition

*Objectif : que le site tienne debout devant quelqu'un qui n'a pas été prévenu.*

| # | Tâche | Détail |
|---|---|---|
| 5.1 | Passe sur les états vides | Chaque liste vide dit quoi faire ensuite |
| 5.2 | Passe sur les erreurs | Aucun message technique visible. Une action de sortie proposée à chaque fois |
| 5.3 | Passe sur les chargements | Squelettes plutôt que spinners partout où c'est possible |
| 5.4 | Première visite | Trois repères contextuels sur l'écran de doublage, affichés une seule fois |
| 5.5 | Détection mobile | Bandeau honnête dès l'accueil, avant tout upload |
| 5.6 | Audit d'accessibilité | Navigation clavier complète, contrastes, libellés ARIA |
| 5.7 | Performance | Chargement initial < 200 Ko de JS, ffmpeg.wasm en import différé |
| 5.8 | Signalement de contenu | Un bouton, une file d'attente. Obligatoire dès que les clips deviennent publics |
| 5.9 | Pages légales | Mentions, confidentialité, réutilisation d'extraits |
| 5.10 | Test à blanc | Deux personnes extérieures, sans aide, chronomètre en main |

---

## 9. Risques

| Risque | Impact | Traitement |
|---|---|---|
| Le doublage sonne décalé | Le produit paraît raté sans qu'on sache pourquoi | Mesure automatique de latence en 1.19, réglage manuel en 1.31, testé avant la Phase 2 |
| Le gigaoctet de stockage se remplit | Le site s'arrête | Expiration à 7 j dès la Phase 0, surveillance en 3.8, migration R2 préparée par `lib/storage/` |
| Le projet Supabase se met en pause après 7 j | Le site tombe silencieusement | Cron Vercel quotidien qui touche la base, ce qui compte comme activité |
| L'export ffmpeg.wasm échoue selon le navigateur | Frustration en fin de partie | Repli sur la lecture en ligne, test multi-navigateurs en 2.27 |
| Uploads de contenus problématiques | Responsabilité juridique | Expiration à 7 j, clips non listés publiquement avant la Phase 3, signalement en 5.8 |
| Le découpage manuel décourage | Personne n'atteint le doublage | Détection de silences en 1.14, et surtout bibliothèque pré-découpée en Phase 3 |
| La bibliothèque ne se constitue jamais | Le site reste un outil, pas un jeu | 3.7 est traité comme une vraie tâche, chiffrée et planifiée, pas comme une intendance |

---

## 10. Ce qui est décidé, et ce qui ne l'est pas

**Décidé.** Aucun traitement vidéo côté serveur. Découpage non-destructif. Base de données comme source de vérité unique pour la synchronisation. Une scène égale un personnage jusqu'en Phase 4. Aucun compte avant la Phase 3. Light par défaut. Un seul fichier de tokens. Support ordinateur uniquement pour l'enregistrement.

**Ouvert, à trancher le moment venu.** La provenance et le statut des clips de la bibliothèque (3.7) — c'est une question éditoriale et juridique, pas technique. Le passage à Cloudflare R2, déclenché par la mesure en 3.8 et pas avant. Les modes de la Phase 4, à arbitrer selon ce que les premiers joueurs redemandent.
