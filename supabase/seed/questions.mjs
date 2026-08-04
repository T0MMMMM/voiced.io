/**
 * Banque de questions.
 *
 * Le contenu vit dans un fichier plutôt qu'en SQL : on le relit, on le
 * corrige et on l'étend sans quitter l'éditeur, et les variantes acceptées
 * se listent naturellement.
 *
 * Quatre règles de rédaction tenues partout :
 *   · l'énoncé se comprend à la première lecture — une question qu'il faut
 *     relire est déjà ratée, même si la réponse est connue ;
 *   · toute réponse écrite porte ses variantes acceptées, sans quoi la
 *     machine ne peut rien noter et l'hôte arbitre tout ;
 *   · une estimation ne porte jamais sur un chiffre invérifiable, sinon la
 *     partie tourne à la dispute ;
 *   · une question « citez N » a toujours bien plus de réponses valables
 *     que le nombre demandé — sinon ce n'est plus une liste, c'est un piège.
 *
 * La difficulté est annoncée au joueur : 1 vert, 2 orange, 3 rouge. La
 * majorité est verte à dessein — on joue entre amis, pas à un concours.
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
  ecrite('Histoire', 1, 'En quelle année a commencé la Révolution française ?', ['1789']),
  ecrite('Histoire', 1, 'En quelle année l’homme a-t-il marché sur la Lune ?', ['1969']),
  ecrite('Histoire', 1, 'Quel mur est tombé en 1989 ?', ['Mur de Berlin', 'Berlin']),
  ecrite('Histoire', 1, 'Qui était le premier président de la Ve République ?',
    ['Charles de Gaulle', 'De Gaulle', 'Gaulle']),
  ecrite('Histoire', 1, 'Quelle bataille Napoléon a-t-il perdue en 1815 ?', ['Waterloo']),
  ecrite('Histoire', 1, 'En quelle année a éclaté la Première Guerre mondiale ?', ['1914']),
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
  estimation('Histoire', 1, 'En quelle année a été inaugurée la tour Eiffel ?', 1889, ''),
  estimation('Histoire', 2, 'Combien de temps a duré la guerre de Cent Ans ?', 116, 'ans'),
  estimation('Histoire', 2, 'En quelle année a été signé le traité de Versailles ?',
    1919, ''),
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
  estimation('Cinéma', 2, 'En quelle année est sorti le premier film Star Wars ?',
    1977, ''),
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
  estimation('Technologie', 1, 'En quelle année est sorti le premier iPhone ?', 2007, ''),
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
]
