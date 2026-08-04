# Plan : le site en deux langues

Objectif : chacun choisit sa langue, français ou anglais, depuis la page
d'accueil. Le choix suit le joueur partout, y compris dans un salon où les
autres jouent dans l'autre langue.

## 1. La décision qui structure tout

**Le choix est par personne, pas par salon.** Deux joueurs de la même partie
peuvent lire l'interface dans deux langues différentes. C'est plus simple à
tenir qu'une langue de salon (rien à synchroniser, rien à négocier au moment
où quelqu'un rejoint) et c'est ce qui rend le site utilisable par un groupe
mixte, qui est précisément le cas où la question se pose.

Conséquence directe : **la langue ne vit pas dans l'URL**. Pas de `/fr/` ni
de `/en/`, pas de sous-domaine. Elle vit dans un cookie, comme le thème et
comme l'identité du joueur. Un lien de salon partagé reste le même pour
tout le monde, ce qui est indispensable puisqu'on le dicte au téléphone.

C'est le point à trancher en premier, parce qu'il décide de tout le reste.
Le préfixe d'URL est la solution habituelle et la meilleure pour le
référencement ; ici le produit est une salle de jeu, pas un site de contenu,
et un code de salon qui change selon la langue serait un vrai problème.

## 2. Le socle, une demi-journée

```
src/lib/i18n/
  locales.ts      LOCALE_CHOICES, type Locale, resolveLocale (même forme
                  exacte que lib/theme.ts, qui a déjà résolu ce problème)
  fr.ts           le dictionnaire, source de vérité des clés
  en.ts           satisfies typeof fr — l'anglais ne peut pas oublier une clé
  index.ts        getLocale() côté serveur, useT() côté client
```

- Un cookie `voiced-lang`, lu dans `layout.tsx` et posé sur `<html lang>`.
- Un script d'initialisation dans `<head>`, comme pour le thème, pour que
  rien ne clignote.
- Un `LangProvider` (contexte React) qui porte le dictionnaire résolu, et un
  `useT()` qui rend une fonction `t('room.start')`.
- Le sélecteur : deux segments **FR / EN** dans le `Header`, à côté du
  bouton de thème. Même matière, même taille — c'est le même genre de
  réglage personnel.

Les dictionnaires sont de simples objets imbriqués. Pas de bibliothèque :
`next-intl` et consorts apportent le routage par préfixe dont on vient
justement de décider qu'on n'en veut pas, et le formatage des pluriels se
règle avec `Intl.PluralRules`, qui est dans le navigateur.

## 3. L'interface, deux jours

Environ **trois cents chaînes** dans `src/components` et `src/app`. Le
travail est mécanique mais long, et il vaut mieux le faire écran par écran,
en vérifiant chacun, que d'un seul geste :

1. accueil, en-tête, création et arrivée dans un salon ;
2. salon : réglages, sièges, choix du jeu ;
3. quiz : jeu, correction, rattrapage, podium ;
4. doublage ;
5. messages d'erreur des actions serveur — ils remontent en clair jusqu'à
   l'écran, donc ils doivent devenir des **clés**, pas des phrases. C'est le
   seul endroit qui demande de toucher à la logique et non à l'affichage.

Un test qui compare les clés de `fr` et de `en` empêche l'oubli silencieux.

## 4. Le contenu des questions, le vrai sujet

C'est là que se trouve le coût, et il ne faut pas se le cacher : **413
questions** écrites en français, dont beaucoup ne se traduisent pas.
« Citez 3 fromages français » n'a pas de sens pour un joueur anglophone, et
« Quel mot contient les cinq voyelles dans l'ordre ? » n'a pas d'équivalent.

Le schéma, lui, demande peu :

```sql
alter table questions add column locale text not null default 'fr';
create index on questions (locale, kind);
```

Le tirage filtre alors sur la langue du salon — **et là, la langue redevient
un réglage de salon**, parce qu'on ne peut pas poser deux questions
différentes à deux joueurs de la même partie. C'est la seule chose qui
n'est pas personnelle : l'interface suit le joueur, le contenu suit la
table. Le salon reçoit un réglage `contentLang` à côté des formes de
questions, et le lobby affiche combien de questions existent dans chaque
langue.

Trois façons de remplir la banque anglaise, à décider plus tard :

- **traduire ce qui se traduit** (géographie, sciences, cartes, silhouettes,
  frises : environ 250 questions passent sans effort) ;
- **écrire à part** ce qui est culturel (gastronomie, langue, chansons) ;
- **laisser la banque anglaise plus petite au début** — une partie de vingt
  questions n'a besoin que de vingt questions.

Les cartes et les silhouettes sont déjà presque bilingues : seul le nom du
lieu change, la géométrie non.

## 5. Ce qu'il ne faut pas faire

- **Traduire à la volée avec un service en ligne.** Coût, latence, et des
  contresens dans un jeu où la formulation exacte décide du point.
- **Deviner la langue du navigateur sans le dire.** Le site propose, il
  n'impose pas : un choix explicite au premier écran, mémorisé ensuite.
- **Mettre la langue dans l'URL.** Le code de salon doit rester unique.

## 6. Ordre d'exécution

| # | Étape | Coût |
|---|---|---|
| 1 | Socle : cookie, provider, sélecteur, `fr.ts` avec les clés existantes | ½ jour |
| 2 | Extraction des chaînes de l'interface, écran par écran | 2 jours |
| 3 | `en.ts` et test de parité des clés | ½ jour |
| 4 | Colonne `locale` sur les questions, réglage de salon, filtre au tirage | ½ jour |
| 5 | Banque anglaise, par vagues | continu |

Les étapes 1 à 3 rendent le site entièrement bilingue **sauf les questions**,
et se tiennent en trois jours. L'étape 5 n'a pas de fin nette, mais elle ne
bloque rien : tant que la banque anglaise est vide, le réglage de contenu
reste sur le français.
