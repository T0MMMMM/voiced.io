/**
 * Banque de questions.
 *
 * Le contenu vit dans un fichier plutôt qu'en SQL : on le relit, on le
 * corrige et on l'étend sans quitter l'éditeur, et les variantes acceptées
 * se listent naturellement.
 *
 * Quatre règles de rédaction tenues partout :
 *   · l'énoncé se comprend à la première lecture : une question qu'il faut
 *     relire est déjà ratée, même si la réponse est connue ;
 *   · toute réponse écrite porte ses variantes acceptées, sans quoi la
 *     machine ne peut rien noter et l'hôte arbitre tout ;
 *   · une estimation ne porte jamais sur un chiffre invérifiable, sinon la
 *     partie tourne à la dispute ;
 *   · une question « citez N » a toujours bien plus de réponses valables
 *     que le nombre demandé : sinon ce n'est plus une liste, c'est un piège.
 *
 * La difficulté est annoncée au joueur : 1 vert, 2 orange, 3 rouge. La
 * majorité est verte à dessein : on joue entre amis, pas à un concours.
 */

/**
 * La difficulté fixe le barème : une question rouge doit rapporter plus
 * qu'une verte, sinon l'annoncer n'est qu'une décoration.
 */
const POINTS = { 1: 1, 2: 2, 3: 3 }

/** Réponse écrite : `accepted` liste toutes les formulations valables. */
const ecrite = (theme, difficulty, prompt, accepted, hint = null) => ({
  theme, kind: 'ecrite', prompt, difficulty, points: POINTS[difficulty], hint,
  payload: {}, answer: { accepted },
})

/** « Citez N » : `accepted` est le vivier, `count` ce qu'on demande. */
const liste = (theme, difficulty, prompt, count, accepted, hint = null) => ({
  theme, kind: 'liste', prompt, difficulty, points: POINTS[difficulty], hint,
  payload: { count }, answer: { accepted, count },
})

const estimation = (theme, difficulty, prompt, value, unit, hint = null) => ({
  theme, kind: 'estimation', prompt, difficulty, points: POINTS[difficulty], hint,
  payload: { unit }, answer: value,
})

/** Classement : `order` est la bonne réponse ; les items sont mélangés au jeu. */
const classement = (theme, difficulty, prompt, order, topLabel, bottomLabel) => ({
  theme, kind: 'classement', prompt, difficulty, points: POINTS[difficulty],
  hint: null,
  payload: { items: [...order].reverse(), topLabel, bottomLabel },
  answer: order,
})

/** Association : `pairs` est la reponse ; les colonnes sont melangees au jeu. */
const association = (theme, difficulty, prompt, pairs) => ({
  theme, kind: 'association', prompt, difficulty, points: POINTS[difficulty],
  hint: null,
  payload: {
    left: Object.keys(pairs),
    // La colonne de droite est brouillee, sinon les paires se lisent en
    // diagonale sans rien connaitre.
    right: [...Object.values(pairs)].reverse(),
  },
  answer: pairs,
})

/**
 * Frise chronologique : un axe qu'on parcourt jusqu'a l'annee voulue.
 * C'est par elle que passent toutes les questions de date.
 *
 * `gap` est l'ecart en annees au-dela duquel la reponse ne vaut plus rien,
 * `exact` la tolerance qui vaut encore tous les points. Les deux dependent
 * du sujet : dater les pyramides a cinquante ans pres est excellent, dater
 * un film a cinquante ans pres ne veut rien dire.
 *
 * Les reperes s'ecrivent `[libelle, annee]`, une annee negative valant
 * avant Jesus-Christ. Ils donnent l'echelle : sans eux, un axe nu de mille
 * ans se joue au hasard.
 */
const frise = (theme, difficulty, event, year, options) => {
  const { from, to, gap, exact = 0, marks = [] } = options

  return {
    theme, kind: 'frise',
    prompt: 'Datez cet évènement sur la frise',
    difficulty, points: POINTS[difficulty], hint: null,
    payload: {
      event,
      from,
      to,
      marks: marks.map(([label, at]) => ({ label, year: at })),
    },
    answer: { year, maxGap: gap, exact },
  }
}

/**
 * Carte : un point a poser. Le rayon tolere suit l'echelle de la question,
 * situer un pays sur un planisphere pardonnant bien plus d'erreur que
 * placer une ville francaise.
 */
const carte = (theme, difficulty, target, region, lat, lng, maxKm) => ({
  theme, kind: 'carte',
  prompt: `Placez ${target} sur la carte`,
  difficulty, points: POINTS[difficulty], hint: null,
  payload: { region, target },
  answer: { point: { lat, lng }, maxKm },
})

/**
 * Theme a difficulte choisie : trois questions du meme sujet, et c'est le
 * joueur qui decide laquelle il affronte. `levels` s'ecrit du plus facile
 * au plus difficile, et le bareme suit ce choix.
 */
const themeAuChoix = (theme, levels) => ({
  theme, kind: 'theme',
  prompt: `Thème au choix : ${theme.toLowerCase()}`,
  // La difficulte affichee est celle du pari, pas celle de la question :
  // c'est le joueur qui la fixe juste apres.
  difficulty: 2, points: 3, hint: null,
  payload: {
    theme,
    levels: levels.map(([prompt], index) => ({
      level: index + 1,
      prompt,
      points: index + 1,
    })),
  },
  answer: {
    max: 3,
    levels: Object.fromEntries(
      levels.map(([, accepted], index) => [
        index + 1,
        { accepted, points: index + 1 },
      ]),
    ),
  },
})

/** Petit bac : une lettre, des categories. Corrige a la main, toujours. */
const petitBac = (theme, difficulty, letter, categories) => ({
  theme, kind: 'petit_bac',
  prompt: `Petit bac, lettre ${letter}`,
  difficulty, points: POINTS[difficulty], hint: null,
  payload: { letter, categories },
  answer: null,
})

const intrus = (theme, difficulty, prompt, items, odd, hint = null) => ({
  theme, kind: 'intrus', prompt, difficulty, points: POINTS[difficulty], hint,
  payload: { items }, answer: odd,
})

export const QUESTIONS = [
  // ═══ Géographie ═══════════════════════════════════════════════════════
  ecrite('Géographie', 1, 'Quelle est la capitale de l’Italie ?', ['Rome']),
  ecrite('Géographie', 1, 'Quelle est la capitale du Japon ?', ['Tokyo']),
  ecrite('Géographie', 1, 'Quelle est la capitale de l’Espagne ?', ['Madrid']),
  ecrite('Géographie', 1, 'Dans quel pays se trouve la tour Eiffel ?', ['France']),
  ecrite('Géographie', 1, 'Quel océan sépare l’Europe de l’Amérique ?',
    ['Atlantique', 'Océan Atlantique']),
  ecrite('Géographie', 1, 'Quel est le plus grand désert chaud du monde ?', ['Sahara']),
  ecrite('Géographie', 1, 'Quelle est la plus haute montagne du monde ?',
    ['Everest', 'Mont Everest']),
  ecrite('Géographie', 1, 'Dans quel pays se trouve la Grande Muraille ?', ['Chine']),
  ecrite('Géographie', 2, 'Quelle est la capitale de l’Australie ?', ['Canberra'],
    'Ce n’est ni Sydney ni Melbourne'),
  ecrite('Géographie', 2, 'Dans quel pays se trouve le Machu Picchu ?', ['Pérou']),
  ecrite('Géographie', 2, 'Quelle est la plus grande île du monde ?', ['Groenland']),
  ecrite('Géographie', 2, 'Quel fleuve traverse Paris ?', ['Seine', 'La Seine']),
  ecrite('Géographie', 3, 'Quelle chaîne de montagnes sépare l’Europe de l’Asie ?',
    ['Oural', 'Monts Oural']),
  liste('Géographie', 1, 'Citez 3 pays d’Amérique du Sud', 3, [
    'Brésil', 'Argentine', 'Chili', 'Pérou', 'Colombie', 'Bolivie', 'Équateur',
    'Venezuela', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname',
  ]),
  liste('Géographie', 1, 'Citez 3 pays voisins de la France', 3, [
    'Belgique', 'Luxembourg', 'Allemagne', 'Suisse', 'Italie', 'Espagne',
    'Andorre', 'Monaco',
  ]),
  liste('Géographie', 2, 'Citez 4 pays d’Océanie', 4, [
    'Australie', 'Nouvelle-Zélande', 'Papouasie-Nouvelle-Guinée', 'Fidji',
    'Samoa', 'Tonga', 'Vanuatu', 'Palaos', 'Nauru', 'Tuvalu', 'Kiribati',
    'Micronésie', 'Îles Marshall', 'Îles Salomon',
  ]),
  liste('Géographie', 2, 'Citez 3 fleuves français', 3, [
    'Loire', 'Seine', 'Rhône', 'Garonne', 'Rhin', 'Meuse', 'Adour', 'Charente',
    'Somme', 'Orne', 'Vilaine', 'Var', 'Aude', 'Hérault',
  ]),
  estimation('Géographie', 1, 'Combien de pays sont membres de l’ONU ?', 193, 'pays'),
  estimation('Géographie', 2, 'Quelle est l’altitude du mont Blanc ?', 4806, 'mètres'),
  estimation('Géographie', 2, 'Quelle est l’altitude de l’Everest ?', 8849, 'mètres'),
  estimation('Géographie', 3, 'Combien de communes compte la France ?', 34945, 'communes'),
  classement('Géographie', 1, 'Classez ces pays du plus peuplé au moins peuplé',
    ['Inde', 'Chine', 'États-Unis', 'Indonésie', 'Brésil'],
    'Le plus peuplé', 'Le moins peuplé'),
  classement('Géographie', 2, 'Classez ces villes de la plus au nord à la plus au sud',
    ['Oslo', 'Berlin', 'Paris', 'Madrid', 'Alger'],
    'La plus au nord', 'La plus au sud'),
  classement('Géographie', 2, 'Classez ces pays du plus grand au plus petit',
    ['Russie', 'Canada', 'Chine', 'Brésil', 'Australie'],
    'Le plus grand', 'Le plus petit'),
  intrus('Géographie', 1, 'Lequel n’est pas une île ?',
    ['Madagascar', 'Sri Lanka', 'Mongolie', 'Islande', 'Cuba'], 'Mongolie'),
  intrus('Géographie', 1, 'Lequel n’est pas un pays européen ?',
    ['Portugal', 'Autriche', 'Maroc', 'Suède', 'Grèce'], 'Maroc'),
  intrus('Géographie', 2, 'Laquelle n’est pas une capitale ?',
    ['Lima', 'Quito', 'Rio de Janeiro', 'Bogota', 'Santiago'], 'Rio de Janeiro'),
  intrus('Géographie', 2, 'Lequel n’est pas un pays d’Asie ?',
    ['Népal', 'Bhoutan', 'Botswana', 'Laos', 'Cambodge'], 'Botswana'),

  // ═══ Histoire ═════════════════════════════════════════════════════════
  ecrite('Histoire', 1, 'Quel mur est tombé en 1989 ?', ['Mur de Berlin', 'Berlin']),
  ecrite('Histoire', 1, 'Qui était le premier président de la Ve République ?',
    ['Charles de Gaulle', 'De Gaulle', 'Gaulle']),
  ecrite('Histoire', 1, 'Quelle bataille Napoléon a-t-il perdue en 1815 ?', ['Waterloo']),
  ecrite('Histoire', 2, 'Qui fut la première femme à recevoir un prix Nobel ?',
    ['Marie Curie', 'Curie']),
  ecrite('Histoire', 2, 'Quel navire a coulé en 1912 après avoir heurté un iceberg ?',
    ['Titanic', 'Le Titanic']),
  ecrite('Histoire', 2, 'Quel peuple a construit les pyramides de Gizeh ?',
    ['Égyptiens', 'Les Égyptiens', 'Égyptiens de l’Antiquité']),
  ecrite('Histoire', 3, 'Quel empereur romain a fait bâtir un mur en Angleterre ?',
    ['Hadrien']),
  liste('Histoire', 1, 'Citez 3 présidents de la République française', 3, [
    'Charles de Gaulle', 'Georges Pompidou', 'Valéry Giscard d’Estaing',
    'François Mitterrand', 'Jacques Chirac', 'Nicolas Sarkozy',
    'François Hollande', 'Emmanuel Macron', 'Vincent Auriol', 'René Coty',
  ]),
  liste('Histoire', 2, 'Citez 3 rois de France prénommés Louis', 3, [
    'Louis XIV', 'Louis XVI', 'Louis XV', 'Louis XIII', 'Louis IX', 'Saint Louis',
    'Louis XI', 'Louis XVIII', 'Louis-Philippe', 'Louis VIII', 'Louis X',
  ]),
  estimation('Histoire', 2, 'Combien de temps a duré la guerre de Cent Ans ?', 116, 'ans'),
  classement('Histoire', 1, 'Classez ces événements du plus ancien au plus récent',
    ['Révolution française', 'Première Guerre mondiale', 'Seconde Guerre mondiale',
      'Premier pas sur la Lune', 'Chute du mur de Berlin'],
    'Le plus ancien', 'Le plus récent'),
  classement('Histoire', 2, 'Classez ces inventions par ordre d’apparition',
    ['Imprimerie', 'Machine à vapeur', 'Téléphone', 'Télévision', 'Internet'],
    'La plus ancienne', 'La plus récente'),
  intrus('Histoire', 2, 'Lequel n’a pas été président de la République française ?',
    ['Jacques Chirac', 'Georges Pompidou', 'Pierre Mendès France',
      'François Mitterrand', 'Nicolas Sarkozy'], 'Pierre Mendès France'),

  // ═══ Sciences ═════════════════════════════════════════════════════════
  ecrite('Sciences', 1, 'Quelle planète est la plus proche du Soleil ?', ['Mercure']),
  ecrite('Sciences', 1, 'Quelle planète est surnommée la planète rouge ?', ['Mars']),
  ecrite('Sciences', 1, 'Quel est le symbole chimique de l’or ?', ['Au']),
  ecrite('Sciences', 1, 'Quel est le symbole chimique de l’eau ?', ['H2O', 'H₂O']),
  ecrite('Sciences', 1, 'Quel est l’organe le plus grand du corps humain ?', ['Peau']),
  ecrite('Sciences', 1, 'Qui a formulé la théorie de la relativité ?',
    ['Albert Einstein', 'Einstein']),
  ecrite('Sciences', 1, 'Quel gaz respirons-nous pour vivre ?',
    ['Oxygène', 'Dioxygène', 'O2']),
  ecrite('Sciences', 2, 'Quel gaz les plantes absorbent-elles pour grandir ?',
    ['Dioxyde de carbone', 'CO2', 'Gaz carbonique']),
  ecrite('Sciences', 2, 'Combien d’os compte le corps humain adulte ?', ['206']),
  ecrite('Sciences', 2, 'Quelle particule porte une charge négative ?', ['Électron']),
  ecrite('Sciences', 3, 'Quel est l’élément le plus abondant dans l’univers ?',
    ['Hydrogène']),
  liste('Sciences', 1, 'Citez 4 planètes du système solaire', 4, [
    'Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter', 'Saturne', 'Uranus', 'Neptune',
  ]),
  liste('Sciences', 1, 'Citez 3 des cinq sens', 3,
    ['Vue', 'Ouïe', 'Odorat', 'Goût', 'Toucher']),
  liste('Sciences', 2, 'Citez 3 os du corps humain', 3, [
    'Fémur', 'Tibia', 'Péroné', 'Humérus', 'Radius', 'Cubitus', 'Ulna',
    'Clavicule', 'Sternum', 'Crâne', 'Mandibule', 'Rotule', 'Omoplate',
    'Scapula', 'Vertèbre', 'Côte', 'Bassin', 'Phalange',
  ]),
  estimation('Sciences', 1, 'Combien de chromosomes compte une cellule humaine ?',
    46, 'chromosomes'),
  estimation('Sciences', 1, 'Combien de litres de sang circulent dans un adulte ?',
    5, 'litres'),
  estimation('Sciences', 2, 'Combien de minutes met la lumière du Soleil à nous parvenir ?',
    8, 'minutes'),
  estimation('Sciences', 3, 'À quelle vitesse voyage la lumière, en km par seconde ?',
    299792, 'km/s'),
  classement('Sciences', 1,
    'Classez ces planètes de la plus proche du Soleil à la plus lointaine',
    ['Mercure', 'Vénus', 'Terre', 'Mars', 'Jupiter'],
    'La plus proche', 'La plus lointaine'),
  classement('Sciences', 1, 'Classez ces animaux du plus rapide au plus lent',
    ['Guépard', 'Cheval', 'Lion', 'Éléphant', 'Tortue'],
    'Le plus rapide', 'Le plus lent'),
  intrus('Sciences', 1, 'Lequel n’est pas un mammifère ?',
    ['Dauphin', 'Chauve-souris', 'Requin', 'Baleine', 'Chat'], 'Requin'),
  intrus('Sciences', 1, 'Laquelle n’est pas une planète ?',
    ['Vénus', 'Neptune', 'Pluton', 'Uranus', 'Saturne'], 'Pluton'),
  intrus('Sciences', 2, 'Lequel n’est pas un métal ?',
    ['Fer', 'Cuivre', 'Soufre', 'Zinc', 'Nickel'], 'Soufre'),
  intrus('Sciences', 1, 'Lequel n’est pas un état de la matière ?',
    ['Solide', 'Liquide', 'Métal', 'Gazeux', 'Plasma'], 'Métal'),

  // ═══ Cinéma ═══════════════════════════════════════════════════════════
  ecrite('Cinéma', 1, 'Qui joue Jack dans « Titanic » ?',
    ['Leonardo DiCaprio', 'DiCaprio']),
  ecrite('Cinéma', 1, 'Quel studio a créé Mickey Mouse ?', ['Disney', 'Walt Disney']),
  ecrite('Cinéma', 1, 'Comment s’appelle le sorcier ami de Ron et Hermione ?',
    ['Harry Potter', 'Harry']),
  ecrite('Cinéma', 1, 'Dans quel film entend-on « Je suis ton père » ?',
    ['Star Wars', 'L’Empire contre-attaque', 'Star Wars 5']),
  ecrite('Cinéma', 2, 'Qui a réalisé « Pulp Fiction » ?',
    ['Quentin Tarantino', 'Tarantino']),
  ecrite('Cinéma', 2, 'Quel studio japonais a créé « Mon voisin Totoro » ?',
    ['Studio Ghibli', 'Ghibli']),
  ecrite('Cinéma', 2, 'Comment s’appelle le vaisseau de Han Solo ?',
    ['Faucon Millenium', 'Millennium Falcon']),
  ecrite('Cinéma', 3, 'Quel film a remporté l’Oscar du meilleur film en 2020 ?',
    ['Parasite']),
  liste('Cinéma', 1, 'Citez 3 super-héros Marvel', 3, [
    'Iron Man', 'Captain America', 'Thor', 'Hulk', 'Spider-Man', 'Black Widow',
    'Docteur Strange', 'Black Panther', 'Ant-Man', 'Wolverine', 'Deadpool',
    'Daredevil', 'Captain Marvel', 'Hawkeye', 'Faucon',
  ]),
  liste('Cinéma', 2, 'Citez 3 films d’animation Pixar', 3, [
    'Toy Story', 'Le Monde de Nemo', 'Les Indestructibles', 'Ratatouille',
    'Wall-E', 'Là-haut', 'Vice-versa', 'Coco', 'Cars', 'Monstres et Cie',
    'Rebelle', 'Soul', 'Luca',
  ]),
  estimation('Cinéma', 1, 'Combien de films compte la saga Harry Potter ?', 8, 'films'),
  classement('Cinéma', 2, 'Classez ces films du plus ancien au plus récent',
    ['Le Parrain', 'Star Wars', 'Retour vers le futur', 'Titanic', 'Avatar'],
    'Le plus ancien', 'Le plus récent'),
  intrus('Cinéma', 1, 'Lequel n’est pas un personnage de Star Wars ?',
    ['Dark Vador', 'Yoda', 'Gandalf', 'Chewbacca', 'Leia'], 'Gandalf'),
  intrus('Cinéma', 2, 'Lequel n’est pas un film d’animation ?',
    ['Le Roi Lion', 'Shrek', 'Jurassic Park', 'Ratatouille', 'Toy Story'],
    'Jurassic Park'),

  // ═══ Musique ══════════════════════════════════════════════════════════
  ecrite('Musique', 1, 'Combien de touches compte un piano standard ?', ['88']),
  ecrite('Musique', 1, 'Quel groupe a chanté « Bohemian Rhapsody » ?', ['Queen']),
  ecrite('Musique', 1, 'De quelle ville viennent les Beatles ?', ['Liverpool']),
  ecrite('Musique', 1, 'Combien de cordes a une guitare classique ?', ['6', 'Six']),
  ecrite('Musique', 2, 'Quel compositeur est devenu sourd ?',
    ['Beethoven', 'Ludwig van Beethoven']),
  ecrite('Musique', 2, 'De quel instrument jouait Miles Davis ?', ['Trompette']),
  liste('Musique', 1, 'Citez 4 notes de la gamme', 4,
    ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si']),
  liste('Musique', 1, 'Citez 3 instruments à cordes', 3, [
    'Violon', 'Alto', 'Violoncelle', 'Contrebasse', 'Guitare', 'Harpe', 'Banjo',
    'Mandoline', 'Ukulélé', 'Luth', 'Piano',
  ]),
  liste('Musique', 2, 'Citez 3 membres des Beatles', 3, [
    'John Lennon', 'Paul McCartney', 'George Harrison', 'Ringo Starr',
    'Lennon', 'McCartney', 'Harrison', 'Starr',
  ]),
  classement('Musique', 2, 'Classez ces genres musicaux par ordre d’apparition',
    ['Jazz', 'Rock', 'Disco', 'Hip-hop', 'Techno'],
    'Le plus ancien', 'Le plus récent'),
  intrus('Musique', 1, 'Lequel n’est pas un instrument à vent ?',
    ['Flûte', 'Trompette', 'Violoncelle', 'Clarinette', 'Saxophone'], 'Violoncelle'),

  // ═══ Littérature ══════════════════════════════════════════════════════
  ecrite('Littérature', 1, 'Qui a écrit « Les Misérables » ?', ['Victor Hugo', 'Hugo']),
  ecrite('Littérature', 1, 'Qui a écrit « Le Petit Prince » ?',
    ['Antoine de Saint-Exupéry', 'Saint-Exupéry']),
  ecrite('Littérature', 1, 'Quel détective habite au 221B Baker Street ?',
    ['Sherlock Holmes', 'Sherlock']),
  ecrite('Littérature', 2, 'Qui a écrit « 1984 » ?', ['George Orwell', 'Orwell']),
  ecrite('Littérature', 2, 'Qui a écrit « Vingt mille lieues sous les mers » ?',
    ['Jules Verne', 'Verne']),
  liste('Littérature', 1, 'Citez 3 maisons de Poudlard', 3,
    ['Gryffondor', 'Serpentard', 'Serdaigle', 'Poufsouffle']),
  intrus('Littérature', 2, 'Lequel n’est pas un roman de Jules Verne ?',
    ['Michel Strogoff', 'L’Île mystérieuse', 'Les Misérables',
      'Voyage au centre de la Terre', 'De la Terre à la Lune'], 'Les Misérables'),

  // ═══ Sport ════════════════════════════════════════════════════════════
  ecrite('Sport', 1, 'Combien de joueurs compte une équipe de football sur le terrain ?',
    ['11', 'Onze']),
  ecrite('Sport', 1, 'Tous les combien d’années ont lieu les Jeux olympiques d’été ?',
    ['4', 'Quatre']),
  ecrite('Sport', 1, 'Quel pays a gagné la Coupe du monde de football en 2018 ?',
    ['France']),
  ecrite('Sport', 1, 'Sur quelle surface se joue Roland-Garros ?', ['Terre battue']),
  ecrite('Sport', 1, 'Combien de joueurs compte une équipe de basket sur le terrain ?',
    ['5', 'Cinq']),
  ecrite('Sport', 2, 'Quelle course cycliste traverse la France chaque été ?',
    ['Tour de France', 'Le Tour de France']),
  liste('Sport', 1, 'Citez 3 sports olympiques d’hiver', 3, [
    'Ski alpin', 'Ski de fond', 'Biathlon', 'Patinage artistique',
    'Patinage de vitesse', 'Hockey sur glace', 'Curling', 'Bobsleigh', 'Luge',
    'Skeleton', 'Snowboard', 'Saut à ski',
  ]),
  liste('Sport', 2, 'Citez 3 tournois du Grand Chelem de tennis', 3,
    ['Roland-Garros', 'Wimbledon', 'US Open', 'Open d’Australie']),
  estimation('Sport', 1, 'Quelle est la longueur d’un marathon, en kilomètres ?',
    42, 'km'),
  estimation('Sport', 1, 'Combien de trous compte un parcours de golf ?', 18, 'trous'),
  intrus('Sport', 1, 'Lequel ne se joue pas avec un ballon ?',
    ['Football', 'Basket', 'Tennis', 'Rugby', 'Volley'], 'Tennis'),
  intrus('Sport', 2, 'Lequel n’est pas un sport olympique ?',
    ['Escrime', 'Tir à l’arc', 'Cricket', 'Judo', 'Aviron'], 'Cricket'),

  // ═══ Gastronomie ══════════════════════════════════════════════════════
  ecrite('Gastronomie', 1, 'De quel pays vient la pizza ?', ['Italie']),
  ecrite('Gastronomie', 1, 'De quel pays vient le sushi ?', ['Japon']),
  ecrite('Gastronomie', 1, 'Quel fromage est utilisé dans la pizza margherita ?',
    ['Mozzarella']),
  ecrite('Gastronomie', 1, 'Avec quel fruit fait-on le vin ?', ['Raisin', 'Le raisin']),
  ecrite('Gastronomie', 2, 'Quelle céréale sert à faire le saké ?', ['Riz']),
  ecrite('Gastronomie', 2, 'Quelle épice donne sa couleur jaune au curry ?',
    ['Curcuma', 'Le curcuma']),
  liste('Gastronomie', 1, 'Citez 3 fromages français', 3, [
    'Camembert', 'Roquefort', 'Comté', 'Brie', 'Reblochon', 'Munster', 'Cantal',
    'Beaufort', 'Bleu d’Auvergne', 'Époisses', 'Saint-Nectaire', 'Tomme',
    'Morbier', 'Maroilles', 'Chèvre',
  ]),
  liste('Gastronomie', 1, 'Citez 3 épices', 3, [
    'Poivre', 'Cannelle', 'Curcuma', 'Cumin', 'Paprika', 'Safran', 'Gingembre',
    'Muscade', 'Clou de girofle', 'Coriandre', 'Cardamome', 'Piment', 'Curry',
    'Anis', 'Vanille',
  ]),
  intrus('Gastronomie', 1, 'Lequel n’est pas un plat italien ?',
    ['Risotto', 'Lasagnes', 'Paella', 'Carbonara', 'Tiramisu'], 'Paella'),
  intrus('Gastronomie', 1, 'Lequel n’est pas un fruit ?',
    ['Pomme', 'Tomate', 'Carotte', 'Banane', 'Cerise'], 'Carotte'),

  // ═══ Nature ═══════════════════════════════════════════════════════════
  ecrite('Nature', 1, 'Quel est le plus grand animal du monde ?',
    ['Baleine bleue', 'Rorqual bleu']),
  ecrite('Nature', 1, 'Combien de pattes a une araignée ?', ['8', 'Huit']),
  ecrite('Nature', 1, 'Quel est l’animal le plus rapide sur terre ?', ['Guépard']),
  ecrite('Nature', 1, 'Quel animal est le roi de la savane ?', ['Lion', 'Le lion']),
  ecrite('Nature', 2, 'Quel est l’arbre le plus haut du monde ?', ['Séquoia']),
  ecrite('Nature', 3, 'Combien de cœurs possède une pieuvre ?', ['3', 'Trois']),
  liste('Nature', 1, 'Citez 4 félins', 4, [
    'Lion', 'Tigre', 'Léopard', 'Guépard', 'Jaguar', 'Panthère', 'Lynx', 'Puma',
    'Ocelot', 'Chat', 'Caracal', 'Serval',
  ]),
  liste('Nature', 2, 'Citez 3 animaux qui hibernent', 3, [
    'Ours', 'Marmotte', 'Hérisson', 'Chauve-souris', 'Loir', 'Écureuil',
    'Grenouille', 'Tortue', 'Serpent', 'Escargot',
  ]),
  estimation('Nature', 2, 'Combien d’années peut vivre une tortue géante ?', 100, 'ans'),
  classement('Nature', 1, 'Classez ces animaux du plus lourd au plus léger',
    ['Baleine bleue', 'Éléphant', 'Girafe', 'Ours brun', 'Loup'],
    'Le plus lourd', 'Le plus léger'),
  intrus('Nature', 1, 'Lequel n’est pas un insecte ?',
    ['Fourmi', 'Abeille', 'Araignée', 'Coccinelle', 'Libellule'], 'Araignée'),
  intrus('Nature', 1, 'Lequel n’est pas un oiseau ?',
    ['Aigle', 'Pingouin', 'Chauve-souris', 'Hibou', 'Moineau'], 'Chauve-souris'),

  // ═══ Langue française ═════════════════════════════════════════════════
  ecrite('Langue française', 1, 'Combien de lettres compte l’alphabet français ?',
    ['26', 'Vingt-six']),
  ecrite('Langue française', 1, 'Quel est le pluriel de « cheval » ?', ['Chevaux']),
  ecrite('Langue française', 1, 'Quel est le contraire de « rapide » ?',
    ['Lent', 'Lente']),
  ecrite('Langue française', 2, 'Comment appelle-t-on un mot qui se lit dans les deux sens ?',
    ['Palindrome']),
  liste('Langue française', 2, 'Citez 3 figures de style', 3, [
    'Métaphore', 'Comparaison', 'Hyperbole', 'Litote', 'Métonymie', 'Oxymore',
    'Anaphore', 'Allitération', 'Personnification', 'Euphémisme', 'Antithèse',
    'Ironie', 'Périphrase', 'Pléonasme',
  ]),
  intrus('Langue française', 1, 'Lequel n’est pas un synonyme de « content » ?',
    ['Heureux', 'Joyeux', 'Triste', 'Ravi', 'Satisfait'], 'Triste'),

  // ═══ Technologie ══════════════════════════════════════════════════════
  ecrite('Technologie', 1, 'Que signifie « www » ?', ['World Wide Web']),
  ecrite('Technologie', 1, 'Qui a fondé Microsoft avec Paul Allen ?',
    ['Bill Gates', 'Gates']),
  ecrite('Technologie', 1, 'Quelle entreprise a créé l’iPhone ?', ['Apple']),
  ecrite('Technologie', 2, 'Combien de bits compte un octet ?', ['8', 'Huit']),
  ecrite('Technologie', 2, 'Quel langage de programmation porte le nom d’un serpent ?',
    ['Python']),
  liste('Technologie', 2, 'Citez 3 langages de programmation', 3, [
    'Python', 'JavaScript', 'Java', 'C', 'C++', 'C#', 'Ruby', 'Go', 'Rust',
    'PHP', 'Swift', 'Kotlin', 'TypeScript', 'SQL',
  ]),
  classement('Technologie', 1, 'Classez ces inventions par ordre d’apparition',
    ['Ordinateur personnel', 'Internet', 'Téléphone portable', 'Smartphone',
      'Réseaux sociaux'],
    'La plus ancienne', 'La plus récente'),

  // ═══ Arts ═════════════════════════════════════════════════════════════
  ecrite('Arts', 1, 'Qui a peint « La Joconde » ?',
    ['Léonard de Vinci', 'De Vinci', 'Vinci']),
  ecrite('Arts', 1, 'Dans quel musée se trouve « La Joconde » ?',
    ['Louvre', 'Musée du Louvre']),
  ecrite('Arts', 1, 'Quel peintre s’est coupé l’oreille ?',
    ['Vincent van Gogh', 'Van Gogh']),
  ecrite('Arts', 2, 'Qui a peint le plafond de la chapelle Sixtine ?',
    ['Michel-Ange', 'Michelangelo']),
  ecrite('Arts', 2, 'Qui a sculpté « Le Penseur » ?', ['Auguste Rodin', 'Rodin']),
  liste('Arts', 1, 'Citez 3 couleurs primaires ou secondaires', 3,
    ['Rouge', 'Bleu', 'Jaune', 'Vert', 'Orange', 'Violet']),
  intrus('Arts', 2, 'Lequel n’est pas un peintre ?',
    ['Picasso', 'Matisse', 'Rodin', 'Kandinsky', 'Klimt'], 'Rodin'),

  // ═══ Associations ═════════════════════════════════════════════════════
  association('Géographie', 1, 'Reliez chaque pays à sa capitale', {
    'Italie': 'Rome', 'Espagne': 'Madrid', 'Portugal': 'Lisbonne',
    'Grèce': 'Athènes',
  }),
  association('Géographie', 2, 'Reliez chaque pays à sa monnaie', {
    'Japon': 'Yen', 'Royaume-Uni': 'Livre sterling', 'Suisse': 'Franc suisse',
    'Inde': 'Roupie',
  }),
  association('Sciences', 1, 'Reliez chaque élément à son symbole', {
    'Or': 'Au', 'Fer': 'Fe', 'Oxygène': 'O', 'Sodium': 'Na',
  }),
  association('Cinéma', 1, 'Reliez chaque film à son réalisateur', {
    'Pulp Fiction': 'Quentin Tarantino', 'Inception': 'Christopher Nolan',
    'Jurassic Park': 'Steven Spielberg', 'Le Parrain': 'Francis Ford Coppola',
  }),
  association('Musique', 2, 'Reliez chaque chanson à son groupe', {
    'Bohemian Rhapsody': 'Queen', 'Hey Jude': 'Les Beatles',
    'Stairway to Heaven': 'Led Zeppelin', 'Smells Like Teen Spirit': 'Nirvana',
  }),
  association('Nature', 1, 'Reliez chaque animal à son petit', {
    'Vache': 'Veau', 'Cheval': 'Poulain', 'Mouton': 'Agneau', 'Chèvre': 'Chevreau',
  }),
  association('Sport', 1, 'Reliez chaque sport à son terrain', {
    'Tennis': 'Court', 'Football': 'Stade', 'Natation': 'Piscine',
    'Patinage': 'Patinoire',
  }),
  association('Arts', 2, 'Reliez chaque œuvre à son auteur', {
    'La Joconde': 'Léonard de Vinci', 'La Nuit étoilée': 'Van Gogh',
    'Le Penseur': 'Rodin', 'Guernica': 'Picasso',
  }),

  // ═══ Frises chronologiques ════════════════════════════════════════════
  // Toutes les questions de date passent par ici : on fait glisser un
  // curseur sur un axe plutot que de taper une annee. Taper « 1789 » est un
  // examen, chercher a la main est un jeu, et la note degressive recompense
  // le raisonnement meme sans la date exacte en tete.
  frise('Histoire', 1, 'La Révolution française', 1789, {
    from: 1600, to: 2000, gap: 60, exact: 2,
    marks: [['Règne de Louis XIV', 1661], ['Première Guerre mondiale', 1914]],
  }),
  frise('Histoire', 1, 'Le premier pas de l’homme sur la Lune', 1969, {
    from: 1900, to: 2000, gap: 15, exact: 1,
    marks: [['Seconde Guerre mondiale', 1939], ['Chute du mur de Berlin', 1989]],
  }),
  frise('Histoire', 1, 'Le début de la Première Guerre mondiale', 1914, {
    from: 1850, to: 1980, gap: 20, exact: 1,
    marks: [['Inauguration de la tour Eiffel', 1889], ['Débarquement de Normandie', 1944]],
  }),
  frise('Histoire', 1, 'La chute du mur de Berlin', 1989, {
    from: 1940, to: 2020, gap: 12, exact: 1,
    marks: [['Premier homme dans l’espace', 1961], ['Passage à l’euro', 2002]],
  }),
  frise('Histoire', 1, 'La découverte de l’Amérique par Christophe Colomb', 1492, {
    from: 1200, to: 1800, gap: 80, exact: 5,
    marks: [['Première croisade', 1096], ['Règne de Louis XIV', 1661]],
  }),
  frise('Histoire', 2, 'L’inauguration de la tour Eiffel', 1889, {
    from: 1800, to: 1950, gap: 20, exact: 2,
    marks: [['Révolution française', 1789], ['Première Guerre mondiale', 1914]],
  }),
  frise('Histoire', 2, 'La signature du traité de Versailles', 1919, {
    from: 1880, to: 1960, gap: 12, exact: 1,
    marks: [['Début de la Première Guerre mondiale', 1914], ['Seconde Guerre mondiale', 1939]],
  }),
  frise('Histoire', 2, 'La construction de la pyramide de Khéops', -2560, {
    from: -3500, to: 0, gap: 600, exact: 100,
    marks: [['Naissance de l’écriture', -3300], ['Mort de Jules César', -44]],
  }),
  frise('Histoire', 2, 'Le couronnement de Charlemagne', 800, {
    from: 0, to: 1500, gap: 200, exact: 20,
    marks: [['Chute de l’Empire romain d’Occident', 476], ['Première croisade', 1096]],
  }),
  frise('Histoire', 3, 'La chute de l’Empire romain d’Occident', 476, {
    from: -500, to: 1200, gap: 250, exact: 25,
    marks: [['Mort de Jules César', -44], ['Couronnement de Charlemagne', 800]],
  }),
  frise('Technologie', 1, 'La sortie du premier iPhone', 2007, {
    from: 1980, to: 2025, gap: 8, exact: 1,
    marks: [['Sortie de Windows 95', 1995], ['Création de Facebook', 2004]],
  }),
  frise('Technologie', 2, 'La création du Web', 1989, {
    from: 1940, to: 2020, gap: 15, exact: 2,
    marks: [['Premier ordinateur ENIAC', 1945], ['Sortie du premier iPhone', 2007]],
  }),
  frise('Technologie', 2, 'La première automobile à essence', 1886, {
    from: 1750, to: 1950, gap: 30, exact: 3,
    marks: [['Machine à vapeur de Watt', 1769], ['Premier vol des frères Wright', 1903]],
  }),
  frise('Cinéma', 1, 'La sortie du premier Star Wars', 1977, {
    from: 1930, to: 2020, gap: 12, exact: 1,
    marks: [['Blanche-Neige et les Sept Nains', 1937], ['Titanic', 1997]],
  }),
  frise('Cinéma', 2, 'La première projection publique des frères Lumière', 1895, {
    from: 1850, to: 1960, gap: 20, exact: 2,
    marks: [['Inauguration de la tour Eiffel', 1889], ['Premier film parlant', 1927]],
  }),
  frise('Sciences', 2, 'La théorie de la relativité d’Einstein', 1905, {
    from: 1600, to: 2000, gap: 50, exact: 3,
    marks: [['Loi de la gravitation de Newton', 1687], ['Structure de l’ADN', 1953]],
  }),
  frise('Sciences', 2, 'La découverte de la pénicilline', 1928, {
    from: 1850, to: 2000, gap: 25, exact: 2,
    marks: [['Théorie de l’évolution de Darwin', 1859], ['Structure de l’ADN', 1953]],
  }),
  frise('Sport', 2, 'Les premiers Jeux olympiques modernes', 1896, {
    from: 1800, to: 1980, gap: 25, exact: 2,
    marks: [['Inauguration de la tour Eiffel', 1889], ['Première Coupe du monde de football', 1930]],
  }),
  frise('Sport', 2, 'La première Coupe du monde de football', 1930, {
    from: 1880, to: 2000, gap: 20, exact: 2,
    marks: [['Premiers Jeux olympiques modernes', 1896], ['Seconde Guerre mondiale', 1939]],
  }),
  frise('Jeux vidéo', 2, 'La sortie de la première PlayStation', 1994, {
    from: 1970, to: 2025, gap: 8, exact: 1,
    marks: [['Sortie de la NES', 1983], ['Sortie de la Wii', 2006]],
  }),
  frise('Jeux vidéo', 2, 'La sortie de la Nintendo Switch', 2017, {
    from: 1980, to: 2025, gap: 6, exact: 1,
    marks: [['Sortie du Game Boy', 1989], ['Sortie de la Wii', 2006]],
  }),
  frise('Musique', 3, 'La séparation des Beatles', 1970, {
    from: 1940, to: 2010, gap: 12, exact: 1,
    marks: [['Premier disque des Beatles', 1963], ['Premier pas sur la Lune', 1969]],
  }),

  // ═══ Cartes ═══════════════════════════════════════════════════════════
  // Le rayon tolere suit l'echelle : mille kilometres sur un planisphere
  // valent cent cinquante sur la France.
  carte('Géographie', 1, 'Paris', 'europe', 48.86, 2.35, 400),
  carte('Géographie', 1, 'l’Italie', 'europe', 42.8, 12.6, 500),
  carte('Géographie', 2, 'Madrid', 'europe', 40.42, -3.7, 400),
  carte('Géographie', 2, 'Berlin', 'europe', 52.52, 13.4, 400),
  carte('Géographie', 3, 'Athènes', 'europe', 37.98, 23.73, 400),
  carte('Géographie', 1, 'le Brésil', 'monde', -10, -52, 1600),
  carte('Géographie', 1, 'l’Australie', 'monde', -25, 134, 1600),
  carte('Géographie', 2, 'le Japon', 'monde', 36.2, 138.2, 1200),
  carte('Géographie', 2, 'l’Égypte', 'monde', 26.8, 30.8, 1200),
  carte('Géographie', 2, 'l’Inde', 'monde', 22.5, 79, 1400),
  carte('Géographie', 3, 'Madagascar', 'monde', -19, 46.7, 1100),
  carte('Géographie', 3, 'New York', 'monde', 40.71, -74.01, 900),
  carte('Géographie', 3, 'Moscou', 'monde', 55.75, 37.62, 1000),
  carte('Géographie', 1, 'Marseille', 'france', 43.3, 5.37, 160),
  carte('Géographie', 2, 'Bordeaux', 'france', 44.84, -0.58, 160),
  carte('Géographie', 2, 'Strasbourg', 'france', 48.58, 7.75, 160),
  carte('Géographie', 1, 'la Corse', 'france', 42.15, 9.1, 160),
  carte('Géographie', 3, 'Clermont-Ferrand', 'france', 45.78, 3.08, 160),

  // Les capitales du monde entier, la ou une reponse ecrite ne dirait rien
  // de ce qu'on sait vraiment situer.
  carte('Géographie', 1, 'Londres', 'europe', 51.51, -0.13, 400),
  carte('Géographie', 1, 'Rome', 'europe', 41.9, 12.5, 400),
  carte('Géographie', 2, 'Lisbonne', 'europe', 38.72, -9.14, 400),
  carte('Géographie', 2, 'Stockholm', 'europe', 59.33, 18.07, 450),
  carte('Géographie', 2, 'Varsovie', 'europe', 52.23, 21.01, 450),
  carte('Géographie', 3, 'Bucarest', 'europe', 44.43, 26.1, 450),
  carte('Géographie', 3, 'Dublin', 'europe', 53.35, -6.26, 400),
  carte('Géographie', 3, 'Vienne', 'europe', 48.21, 16.37, 400),
  carte('Géographie', 1, 'Tokyo', 'monde', 35.68, 139.69, 1100),
  carte('Géographie', 1, 'Le Caire', 'monde', 30.04, 31.24, 1100),
  carte('Géographie', 2, 'Pékin', 'monde', 39.9, 116.4, 1100),
  carte('Géographie', 2, 'Rio de Janeiro', 'monde', -22.91, -43.17, 1200),
  carte('Géographie', 2, 'Sydney', 'monde', -33.87, 151.21, 1200),
  carte('Géographie', 2, 'Los Angeles', 'monde', 34.05, -118.24, 1000),
  carte('Géographie', 3, 'Le Cap', 'monde', -33.92, 18.42, 1200),
  carte('Géographie', 3, 'Buenos Aires', 'monde', -34.6, -58.38, 1200),
  carte('Géographie', 3, 'New Delhi', 'monde', 28.61, 77.21, 1100),
  carte('Géographie', 3, 'Istanbul', 'monde', 41.01, 28.98, 1000),
  carte('Géographie', 3, 'Nairobi', 'monde', -1.29, 36.82, 1200),
  carte('Géographie', 2, 'le Canada', 'monde', 56, -106, 1800),
  carte('Géographie', 2, 'la Norvège', 'monde', 62, 10, 1200),
  carte('Géographie', 3, 'le Pérou', 'monde', -10, -76, 1200),
  carte('Géographie', 3, 'la Thaïlande', 'monde', 15.5, 101, 1100),

  // ═══ Thèmes à difficulté choisie ══════════════════════════════════════
  // Le joueur voit le sujet, pas la question, et décide de ce qu'il risque.
  themeAuChoix('Cinéma', [
    ['Quel réalisateur a tourné E.T. et Jurassic Park ?',
      ['Spielberg', 'Steven Spielberg']],
    ['Quel acteur incarne Jack dans Titanic ?',
      ['Leonardo DiCaprio', 'DiCaprio', 'Leonardo Di Caprio']],
    ['Quel est le premier long métrage d’animation de Disney ?',
      ['Blanche-Neige', 'Blanche-Neige et les Sept Nains']],
  ]),
  themeAuChoix('Géographie', [
    ['Quelle est la capitale du Portugal ?', ['Lisbonne']],
    ['Quel est le plus long fleuve d’Afrique ?', ['Nil', 'Le Nil']],
    ['Quelle est la capitale du Kazakhstan ?',
      ['Astana', 'Noursoultan', 'Nur-Sultan']],
  ]),
  themeAuChoix('Musique', [
    ['Quel groupe britannique a chanté « Hey Jude » ?',
      ['Les Beatles', 'Beatles']],
    ['Quel compositeur autrichien a écrit La Flûte enchantée ?', ['Mozart']],
    ['Quel groupe suédois a remporté l’Eurovision en 1974 ?', ['ABBA']],
  ]),
  themeAuChoix('Sport', [
    ['Combien de joueurs une équipe de football aligne-t-elle sur le terrain ?',
      ['11', 'onze']],
    ['Dans quel sport frappe-t-on un volant ?', ['Badminton']],
    ['Quel pays a remporté la Coupe du monde de football 2010 ?', ['Espagne']],
  ]),
  themeAuChoix('Sciences', [
    ['Quelle planète est la plus proche du Soleil ?', ['Mercure']],
    ['Quel gaz les plantes absorbent-elles pour grandir ?',
      ['Dioxyde de carbone', 'CO2', 'Gaz carbonique']],
    ['Quel élément chimique porte le symbole K ?', ['Potassium']],
  ]),
  themeAuChoix('Histoire', [
    ['Quel empereur français a été vaincu à Waterloo ?',
      ['Napoléon', 'Napoléon Bonaparte', 'Napoléon Ier']],
    ['En quelle année la Seconde Guerre mondiale s’est-elle terminée ?',
      ['1945']],
    ['Quel roi de France a fait construire le château de Versailles ?',
      ['Louis XIV', 'Louis 14']],
  ]),
  themeAuChoix('Animaux', [
    ['Quel est le plus grand animal terrestre ?',
      ['Éléphant', 'Éléphant d’Afrique']],
    ['Quel est le seul mammifère capable de voler ?',
      ['Chauve-souris', 'La chauve-souris']],
    ['Combien de cœurs possède une pieuvre ?', ['3', 'Trois']],
  ]),
  themeAuChoix('Jeux vidéo', [
    ['Quel plombier moustachu est la mascotte de Nintendo ?', ['Mario']],
    ['Quel studio développe la série The Legend of Zelda ?', ['Nintendo']],
    ['Quel jeu vidéo est le plus vendu de tous les temps ?', ['Minecraft']],
  ]),

  // ═══ Animaux ══════════════════════════════════════════════════════════
  ecrite('Animaux', 1, 'Quel est l’animal terrestre le plus rapide ?', ['Guépard']),
  ecrite('Animaux', 1, 'Combien de pattes a une araignée ?', ['8', 'Huit']),
  ecrite('Animaux', 1, 'Quel est le plus grand animal du monde ?',
    ['Baleine bleue', 'Rorqual bleu', 'La baleine bleue']),
  ecrite('Animaux', 1, 'De quelle couleur est le sang d’une pieuvre ?', ['Bleu']),
  ecrite('Animaux', 1, 'Quel oiseau est le plus grand du monde ?', ['Autruche']),
  ecrite('Animaux', 2, 'Quel mammifère est le seul à voler vraiment ?',
    ['Chauve-souris']),
  ecrite('Animaux', 2, 'Quel mammifère australien pond des œufs ?',
    ['Ornithorynque']),
  ecrite('Animaux', 2, 'Comment appelle-t-on un animal qui ne mange que des plantes ?',
    ['Herbivore']),
  ecrite('Animaux', 3, 'Quel animal a la plus longue gestation ?',
    ['Éléphant', 'L’éléphant']),
  liste('Animaux', 1, 'Citez 3 animaux de la savane africaine', 3, [
    'Lion', 'Éléphant', 'Girafe', 'Zèbre', 'Hippopotame', 'Rhinocéros',
    'Guépard', 'Gnou', 'Hyène', 'Babouin', 'Crocodile', 'Autruche',
    'Léopard', 'Buffle', 'Antilope', 'Suricate',
  ]),
  liste('Animaux', 1, 'Citez 3 animaux marins', 3, [
    'Dauphin', 'Baleine', 'Requin', 'Orque', 'Phoque', 'Méduse', 'Pieuvre',
    'Tortue', 'Morse', 'Raie', 'Otarie', 'Narval', 'Hippocampe', 'Corail',
    'Étoile de mer', 'Crabe', 'Homard', 'Thon', 'Sardine',
  ]),
  liste('Animaux', 2, 'Citez 4 races de chiens', 4, [
    'Labrador', 'Berger allemand', 'Caniche', 'Bouledogue', 'Chihuahua',
    'Husky', 'Beagle', 'Teckel', 'Golden retriever', 'Dalmatien',
    'Rottweiler', 'Boxer', 'Border collie', 'Yorkshire', 'Cocker',
    'Saint-bernard', 'Berger australien', 'Shiba', 'Carlin',
  ]),
  liste('Animaux', 2, 'Citez 3 animaux qui hibernent', 3, [
    'Marmotte', 'Ours', 'Hérisson', 'Loir', 'Chauve-souris', 'Écureuil',
    'Tortue', 'Grenouille', 'Serpent', 'Escargot', 'Blaireau', 'Lérot',
    'Crapaud', 'Hamster',
  ]),
  estimation('Animaux', 1, 'Combien d’années vit un éléphant en moyenne ?', 65, 'ans'),
  estimation('Animaux', 2, 'Combien de dents a un chien adulte ?', 42, 'dents'),
  estimation('Animaux', 2, 'Quelle vitesse de pointe atteint le guépard ?', 110, 'km/h'),
  estimation('Animaux', 3, 'Combien d’espèces d’oiseaux existe-t-il environ ?',
    11000, 'espèces'),
  intrus('Animaux', 1, 'Lequel n’est pas un félin ?',
    ['Lion', 'Tigre', 'Hyène', 'Léopard', 'Jaguar'], 'Hyène'),
  intrus('Animaux', 1, 'Lequel n’est pas un oiseau ?',
    ['Manchot', 'Autruche', 'Chauve-souris', 'Kiwi', 'Émeu'], 'Chauve-souris'),
  intrus('Animaux', 2, 'Lequel n’est pas un reptile ?',
    ['Crocodile', 'Iguane', 'Salamandre', 'Tortue', 'Cobra'], 'Salamandre'),
  association('Animaux', 1, 'Reliez chaque animal à son cri', {
    'Chien': 'Aboiement', 'Cheval': 'Hennissement', 'Vache': 'Meuglement',
    'Loup': 'Hurlement',
  }),
  association('Animaux', 2, 'Reliez chaque animal à sa famille', {
    'Dauphin': 'Mammifère', 'Grenouille': 'Amphibien', 'Requin': 'Poisson',
    'Tortue': 'Reptile',
  }),
  classement('Animaux', 1, 'Classez ces animaux du plus rapide au plus lent',
    ['Faucon pèlerin', 'Guépard', 'Cheval', 'Humain', 'Escargot'],
    'Le plus rapide', 'Le plus lent'),
  classement('Animaux', 2, 'Classez ces animaux du plus lourd au plus léger',
    ['Baleine bleue', 'Éléphant d’Afrique', 'Hippopotame', 'Cheval', 'Chien'],
    'Le plus lourd', 'Le plus léger'),

  // ═══ Jeux vidéo ═══════════════════════════════════════════════════════
  ecrite('Jeux vidéo', 1, 'Dans quel jeu construit-on un monde fait de cubes ?',
    ['Minecraft']),
  ecrite('Jeux vidéo', 1, 'Quel hérisson bleu est la mascotte de Sega ?', ['Sonic']),
  ecrite('Jeux vidéo', 1, 'Quel jeu de blocs qui tombent vient de Russie ?',
    ['Tetris']),
  ecrite('Jeux vidéo', 1, 'Quelle princesse Link cherche-t-il à sauver ?', ['Zelda']),
  ecrite('Jeux vidéo', 2, 'Quelle entreprise japonaise a créé la PlayStation ?',
    ['Sony']),
  ecrite('Jeux vidéo', 2, 'Quel studio a créé la série Grand Theft Auto ?',
    ['Rockstar', 'Rockstar Games']),
  ecrite('Jeux vidéo', 2, 'Quel Pokémon porte le numéro 1 du Pokédex ?',
    ['Bulbizarre']),
  ecrite('Jeux vidéo', 3, 'Quel jeu de 2017 a lancé la mode de la « battle royale » ?',
    ['PUBG', 'PlayerUnknown’s Battlegrounds', 'Battlegrounds'],
    'Il a précédé Fortnite de quelques mois'),
  liste('Jeux vidéo', 1, 'Citez 3 consoles de salon', 3, [
    'PlayStation', 'Xbox', 'Nintendo Switch', 'Wii', 'GameCube',
    'Nintendo 64', 'Mega Drive', 'Super Nintendo', 'Dreamcast', 'PlayStation 2',
    'Atari 2600', 'NES', 'Wii U', 'PlayStation 5', 'Xbox 360',
  ]),
  liste('Jeux vidéo', 2, 'Citez 3 jeux de la série Mario', 3, [
    'Mario Kart', 'Super Mario Bros', 'Mario Party', 'Super Mario Odyssey',
    'Mario Tennis', 'Super Mario 64', 'Super Mario Galaxy', 'Paper Mario',
    'Mario Maker', 'Super Mario Sunshine', 'Mario Golf', 'Super Mario World',
  ]),
  liste('Jeux vidéo', 2, 'Citez 4 Pokémon', 4, [
    'Pikachu', 'Bulbizarre', 'Salamèche', 'Carapuce', 'Évoli', 'Rondoudou',
    'Miaouss', 'Ronflex', 'Dracaufeu', 'Mewtwo', 'Mew', 'Magicarpe',
    'Léviator', 'Tortank', 'Florizarre', 'Roucool', 'Rattata', 'Aspicot',
  ]),
  estimation('Jeux vidéo', 3, 'Combien de millions d’exemplaires de Minecraft ont été vendus ?',
    300, 'millions'),
  intrus('Jeux vidéo', 1, 'Laquelle n’est pas une console Nintendo ?',
    ['Game Boy', 'Wii', 'Dreamcast', 'Switch', 'GameCube'], 'Dreamcast'),
  intrus('Jeux vidéo', 2, 'Lequel n’est pas un personnage de l’univers Mario ?',
    ['Luigi', 'Yoshi', 'Kirby', 'Bowser', 'Peach'], 'Kirby'),
  association('Jeux vidéo', 1, 'Reliez chaque jeu à son studio', {
    'Minecraft': 'Mojang', 'The Legend of Zelda': 'Nintendo',
    'Fortnite': 'Epic Games', 'The Witcher': 'CD Projekt',
  }),
  association('Jeux vidéo', 2, 'Reliez chaque console à son constructeur', {
    'Switch': 'Nintendo', 'PlayStation 5': 'Sony',
    'Xbox Series X': 'Microsoft', 'Dreamcast': 'Sega',
  }),
  classement('Jeux vidéo', 2, 'Classez ces consoles de la plus ancienne à la plus récente',
    ['NES', 'Game Boy', 'PlayStation', 'Wii', 'Nintendo Switch'],
    'La plus ancienne', 'La plus récente'),

  // ═══ Petit bac ════════════════════════════════════════════════════════
  petitBac('Petit bac', 1, 'B', [
    'Un pays', 'Un animal', 'Un aliment', 'Un métier', 'Un prénom', 'Une ville',
  ]),
  petitBac('Petit bac', 1, 'M', [
    'Une ville', 'Un fruit ou légume', 'Un sport', 'Un prénom',
    'Un film', 'Une marque',
  ]),
  petitBac('Petit bac', 2, 'V', [
    'Un pays', 'Un légume', 'Un instrument de musique', 'Une couleur',
    'Un animal', 'Un métier',
  ]),
  petitBac('Petit bac', 2, 'C', [
    'Un animal', 'Une capitale', 'Un métier', 'Un film',
    'Une partie du corps', 'Un personnage célèbre',
  ]),
  petitBac('Petit bac', 2, 'S', [
    'Un pays', 'Un sport', 'Un aliment', 'Un prénom',
    'Un groupe de musique', 'Un objet de la maison',
  ]),
  petitBac('Petit bac', 3, 'L', [
    'Une ville', 'Un animal', 'Un métier', 'Un fleuve',
    'Un jeu vidéo', 'Une matière scolaire',
  ]),
  petitBac('Petit bac', 3, 'G', [
    'Un pays', 'Un fruit', 'Un instrument de musique', 'Un prénom',
    'Une marque de voiture', 'Un vêtement',
  ]),
]
