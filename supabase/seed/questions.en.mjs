/**
 * The English question bank.
 *
 * Three of the eleven forms carry almost no language: a map is a pair of
 * coordinates, a silhouette is a shape, a timeline is a year. Rewriting
 * those by hand would have meant retyping two hundred coordinates and
 * getting one of them wrong. They are derived from the French bank
 * instead, with only their labels translated — and a missing translation
 * stops the seed rather than shipping a French word into an English game.
 *
 * Everything else is written here, because it does not translate: naming
 * four French cheeses means nothing to an English-speaking table.
 */
import { QUESTIONS as FR } from './questions.mjs'
import { SHAPES } from './shapes.mjs'

const POINTS = { 1: 1, 2: 2, 3: 3 }

const written = (theme, difficulty, prompt, accepted, hint = null) => ({
  theme, kind: 'ecrite', prompt, difficulty, points: POINTS[difficulty], hint,
  payload: {}, answer: { accepted },
})

const list = (theme, difficulty, prompt, count, accepted, hint = null) => ({
  theme, kind: 'liste', prompt, difficulty, points: POINTS[difficulty], hint,
  payload: { count }, answer: { accepted, count },
})

const estimate = (theme, difficulty, prompt, value, unit, hint = null) => ({
  theme, kind: 'estimation', prompt, difficulty, points: POINTS[difficulty], hint,
  payload: { unit }, answer: value,
})

const ranking = (theme, difficulty, prompt, order, topLabel, bottomLabel) => ({
  theme, kind: 'classement', prompt, difficulty, points: POINTS[difficulty],
  hint: null,
  payload: { items: [...order].reverse(), topLabel, bottomLabel },
  answer: order,
})

const matching = (theme, difficulty, prompt, pairs) => ({
  theme, kind: 'association', prompt, difficulty, points: POINTS[difficulty],
  hint: null,
  payload: {
    left: Object.keys(pairs),
    right: [...Object.values(pairs)].reverse(),
  },
  answer: pairs,
})

const oddOneOut = (theme, difficulty, prompt, items, odd, hint = null) => ({
  theme, kind: 'intrus', prompt, difficulty, points: POINTS[difficulty], hint,
  payload: { items }, answer: odd,
})

const wordGame = (difficulty, letter, categories) => ({
  theme: 'Word game', kind: 'petit_bac',
  prompt: `Word game — letter ${letter}`,
  difficulty, points: POINTS[difficulty], hint: null,
  payload: { letter, categories },
  answer: null,
})

const pickYourLevel = (theme, levels) => ({
  theme, kind: 'theme',
  prompt: `Pick your level: ${theme.toLowerCase()}`,
  difficulty: 2, points: 3, hint: null,
  payload: {
    theme,
    levels: levels.map(([prompt], index) => ({
      level: index + 1, prompt, points: index + 1,
    })),
  },
  answer: {
    max: 3,
    levels: Object.fromEntries(
      levels.map(([, accepted], index) => [
        index + 1, { accepted, points: index + 1 },
      ]),
    ),
  },
})

/**
 * Place names, French to English.
 *
 * Most need no translation at all — Paris is Paris. Only the ones that
 * differ are listed, and anything missing throws: a French city name in an
 * English game is exactly the silent failure this file exists to prevent.
 */
const PLACES = {
  'l’Italie': 'Italy', 'le Brésil': 'Brazil', 'l’Australie': 'Australia',
  'le Japon': 'Japan', 'l’Égypte': 'Egypt', 'l’Inde': 'India',
  'la Corse': 'Corsica', 'le Canada': 'Canada', 'la Norvège': 'Norway',
  'le Pérou': 'Peru', 'la Thaïlande': 'Thailand', 'Londres': 'London',
  'Lisbonne': 'Lisbon', 'Athènes': 'Athens', 'Varsovie': 'Warsaw',
  'Bucarest': 'Bucharest', 'Vienne': 'Vienna', 'Moscou': 'Moscow',
  'Le Caire': 'Cairo', 'Pékin': 'Beijing', 'Le Cap': 'Cape Town',
  'New Delhi': 'New Delhi', 'Édimbourg': 'Edinburgh', 'Séville': 'Seville',
  'Hambourg': 'Hamburg', 'Cracovie': 'Krakow', 'Bombay': 'Mumbai',
  'Mexico': 'Mexico City', 'Montréal': 'Montreal', 'Venise': 'Venice',
  'Naples': 'Naples', 'Rome': 'Rome', 'Madrid': 'Madrid', 'Berlin': 'Berlin',
  'Paris': 'Paris', 'Marseille': 'Marseille', 'Bordeaux': 'Bordeaux',
  'Strasbourg': 'Strasbourg', 'Clermont-Ferrand': 'Clermont-Ferrand',
  'Tokyo': 'Tokyo', 'Stockholm': 'Stockholm', 'Istanbul': 'Istanbul',
  'Dublin': 'Dublin', 'New York': 'New York', 'Los Angeles': 'Los Angeles',
  'Miami': 'Miami', 'Chicago': 'Chicago', 'Sydney': 'Sydney',
  'Rio de Janeiro': 'Rio de Janeiro', 'Buenos Aires': 'Buenos Aires',
  'Nairobi': 'Nairobi', 'Madagascar': 'Madagascar', 'Munich': 'Munich',
  'Barcelone': 'Barcelona', 'Porto': 'Porto', 'Ankara': 'Ankara',
  'Marrakech': 'Marrakesh', 'Casablanca': 'Casablanca', 'Louxor': 'Luxor',
  'Osaka': 'Osaka', 'Shanghai': 'Shanghai', 'Hong Kong': 'Hong Kong',
  'São Paulo': 'São Paulo', 'Brasília': 'Brasília', 'Perth': 'Perth',
  'Vancouver': 'Vancouver', 'Liverpool': 'Liverpool',
}

const COUNTRIES = {
  'Italie': 'Italy', 'Espagne': 'Spain', 'Allemagne': 'Germany',
  'Royaume-Uni': 'United Kingdom', 'Portugal': 'Portugal', 'Grèce': 'Greece',
  'Pologne': 'Poland', 'Suède': 'Sweden', 'Turquie': 'Türkiye',
  'Maroc': 'Morocco', 'Égypte': 'Egypt', 'Japon': 'Japan', 'Inde': 'India',
  'Chine': 'China', 'États-Unis': 'United States', 'Mexique': 'Mexico',
  'Brésil': 'Brazil', 'Argentine': 'Argentina', 'Australie': 'Australia',
  'Canada': 'Canada',
}

/** Timeline events and their reference marks. */
const EVENTS = {
  'La Révolution française': 'The French Revolution',
  'Le premier pas de l’homme sur la Lune': 'The first steps on the Moon',
  'Le début de la Première Guerre mondiale': 'The start of the First World War',
  'La chute du mur de Berlin': 'The fall of the Berlin Wall',
  'La découverte de l’Amérique par Christophe Colomb': 'Columbus reaching the Americas',
  'L’inauguration de la tour Eiffel': 'The opening of the Eiffel Tower',
  'La signature du traité de Versailles': 'The signing of the Treaty of Versailles',
  'La construction de la pyramide de Khéops': 'The building of the Great Pyramid of Giza',
  'Le couronnement de Charlemagne': 'The crowning of Charlemagne',
  'La chute de l’Empire romain d’Occident': 'The fall of the Western Roman Empire',
  'La sortie du premier iPhone': 'The first iPhone',
  'La création du Web': 'The invention of the Web',
  'La première automobile à essence': 'The first petrol car',
  'La sortie du premier Star Wars': 'The first Star Wars film',
  'La première projection publique des frères Lumière': 'The Lumière brothers’ first public screening',
  'La théorie de la relativité d’Einstein': 'Einstein’s theory of relativity',
  'La découverte de la pénicilline': 'The discovery of penicillin',
  'Les premiers Jeux olympiques modernes': 'The first modern Olympic Games',
  'La première Coupe du monde de football': 'The first football World Cup',
  'La sortie de la première PlayStation': 'The first PlayStation',
  'La sortie de la Nintendo Switch': 'The Nintendo Switch',
  'La séparation des Beatles': 'The Beatles breaking up',
  'L’invention du papier toilette moderne': 'The invention of modern toilet paper',
  'La pomme de terre imposée à la table française par Parmentier':
    'Parmentier making the potato respectable in France',
  'L’ascension de l’Everest': 'The first ascent of Everest',
  'La première ascension de l’Everest': 'The first ascent of Everest',

  'Règne de Louis XIV': 'Louis XIV’s reign',
  'Première Guerre mondiale': 'First World War',
  'Seconde Guerre mondiale': 'Second World War',
  'Chute du mur de Berlin': 'Fall of the Berlin Wall',
  'Inauguration de la tour Eiffel': 'The Eiffel Tower opens',
  'Débarquement de Normandie': 'D-Day landings',
  'Premier homme dans l’espace': 'First man in space',
  'Passage à l’euro': 'The euro arrives',
  'Première croisade': 'First Crusade',
  'Révolution française': 'French Revolution',
  'Début de la Première Guerre mondiale': 'Start of the First World War',
  'Naissance de l’écriture': 'Writing invented',
  'Mort de Jules César': 'Death of Julius Caesar',
  'Chute de l’Empire romain d’Occident': 'Fall of the Western Roman Empire',
  'Couronnement de Charlemagne': 'Charlemagne crowned',
  'Sortie de Windows 95': 'Windows 95 released',
  'Création de Facebook': 'Facebook founded',
  'Premier ordinateur ENIAC': 'The ENIAC computer',
  'Machine à vapeur de Watt': 'Watt’s steam engine',
  'Premier vol des frères Wright': 'The Wright brothers’ first flight',
  'Blanche-Neige et les Sept Nains': 'Snow White and the Seven Dwarfs',
  'Titanic': 'Titanic',
  'Premier film parlant': 'The first talkie',
  'Loi de la gravitation de Newton': 'Newton’s law of gravitation',
  'Structure de l’ADN': 'The structure of DNA',
  'Théorie de l’évolution de Darwin': 'Darwin’s theory of evolution',
  'Premiers Jeux olympiques modernes': 'First modern Olympics',
  'Première Coupe du monde de football': 'First football World Cup',
  'Sortie de la NES': 'The NES released',
  'Sortie de la Wii': 'The Wii released',
  'Sortie du Game Boy': 'The Game Boy released',
  'Premier disque des Beatles': 'The Beatles’ first record',
  'Premier pas sur la Lune': 'First steps on the Moon',
  'Première ampoule électrique': 'The first light bulb',
  'Première photographie': 'The first photograph',
  'Sortie du premier iPhone': 'The first iPhone',
  'Premier microprocesseur': 'The first microprocessor',
  'Premier homme sur la Lune': 'First man on the Moon',
  'Sortie de Pong': 'Pong released',
  'Sortie de la Switch': 'The Switch released',
  'Louis XIV monte sur le trône': 'Louis XIV takes the throne',
  'Imprimerie de Gutenberg': 'Gutenberg’s printing press',
  'Découverte de l’Amérique': 'Columbus reaching the Americas',
  'Attentats du 11 septembre': 'The 11 September attacks',
  'Pandémie de Covid-19': 'The Covid-19 pandemic',
  'Construction de la pyramide de Khéops': 'The Great Pyramid built',
  'Première Coupe du monde de rugby': 'First Rugby World Cup',
  'Jeux olympiques de Paris': 'The Paris Olympics',
  'Séquençage du génome humain': 'The human genome sequenced',
  'Invention du transistor': 'The transistor invented',
  'L’invention de l’imprimerie par Gutenberg': 'Gutenberg inventing the printing press',
  'La première automobile à essence': 'The first petrol car',
  'Le début de la Première Guerre mondiale': 'The start of the First World War',
}

function translate(table, value, what) {
  const found = table[value]
  if (!found) throw new Error(`Traduction manquante (${what}) : ${value}`)
  return found
}

/** Maps, silhouettes and timelines, derived from the French bank. */
function derived() {
  const out = []

  for (const question of FR) {
    if (question.kind === 'carte') {
      const target = translate(PLACES, question.payload.target, 'lieu')
      const country = question.payload.region === 'pays'
        ? translate(COUNTRIES, question.prompt.split(' : ')[0], 'pays')
        : null

      out.push({
        ...question,
        theme: 'Geography',
        prompt: country ? `${country}: place ${target}` : `Place ${target} on the map`,
        payload: { ...question.payload, target },
      })
      continue
    }

    if (question.kind === 'silhouette') {
      const shape = Object.values(SHAPES).find(
        (candidate) => candidate.path === question.payload.shape,
      )
      if (!shape) continue

      out.push({
        ...question,
        theme: 'Geography',
        prompt: 'Which country is this?',
        answer: { accepted: shape.names.en },
      })
      continue
    }

    if (question.kind === 'frise') {
      out.push({
        ...question,
        theme: 'History',
        prompt: 'Place this event on the timeline',
        payload: {
          ...question.payload,
          event: translate(EVENTS, question.payload.event, 'évènement'),
          marks: question.payload.marks.map((mark) => ({
            ...mark,
            label: translate(EVENTS, mark.label, 'repère'),
          })),
        },
      })
    }
  }

  return out
}

export const QUESTIONS_EN = [
  ...derived(),

  // ═══ General knowledge ════════════════════════════════════════════════
  written('Geography', 1, 'What is the capital of Italy?', ['Rome']),
  written('Geography', 1, 'What is the capital of Japan?', ['Tokyo']),
  written('Geography', 1, 'Which ocean lies between Europe and America?',
    ['Atlantic', 'The Atlantic', 'Atlantic Ocean']),
  written('Geography', 1, 'What is the largest hot desert on Earth?', ['Sahara']),
  written('Geography', 1, 'What is the highest mountain in the world?',
    ['Everest', 'Mount Everest']),
  written('Geography', 2, 'What is the capital of Australia?', ['Canberra'],
    'It is neither Sydney nor Melbourne'),
  written('Geography', 2, 'What is the largest island in the world?', ['Greenland']),
  written('Geography', 2, 'Which country has the most time zones?',
    ['France'], 'Thanks to its overseas territories'),
  written('History', 1, 'Which wall came down in 1989?',
    ['Berlin Wall', 'The Berlin Wall', 'Berlin']),
  written('History', 2, 'Which Roman emperor supposedly made his horse a senator?',
    ['Caligula']),
  written('History', 2, 'How long did the Hundred Years’ War actually last?',
    ['116 years', '116']),
  written('Science', 1, 'Which planet is closest to the Sun?', ['Mercury']),
  written('Science', 1, 'What gas do we breathe in to stay alive?',
    ['Oxygen', 'O2']),
  written('Science', 2, 'Which human organ can fully regrow itself?',
    ['Liver', 'The liver']),
  written('Science', 2, 'Which planet spins the opposite way to all the others?',
    ['Venus']),
  written('Science', 2, 'How long does sunlight take to reach us?',
    ['8 minutes', 'Eight minutes', '8 min']),
  written('Science', 2, 'What is the chemical symbol for gold?', ['Au']),
  written('Cinema', 1, 'Which film gave us the line “I am your father”?',
    ['Star Wars', 'The Empire Strikes Back']),
  written('Cinema', 2, 'Who directed E.T. and Jurassic Park?',
    ['Spielberg', 'Steven Spielberg']),
  written('Cinema', 2, 'What was Disney’s first feature-length animated film?',
    ['Snow White', 'Snow White and the Seven Dwarfs']),
  written('Music', 1, 'Which British band recorded “Hey Jude”?',
    ['The Beatles', 'Beatles']),
  written('Music', 2, 'Which instrument has eighty-eight keys?',
    ['Piano', 'The piano']),
  written('Sport', 1, 'How many players does a football team field?',
    ['11', 'Eleven']),
  written('Sport', 2, 'How many holes are there on a full golf course?',
    ['18', 'Eighteen']),
  written('Sport', 2, 'In which sport can you score a strike?',
    ['Bowling', 'Ten-pin bowling']),
  written('Food', 1, 'What is the main ingredient of guacamole?',
    ['Avocado', 'Avocados']),
  written('Food', 2, 'Which spice is the most expensive in the world?',
    ['Saffron']),
  written('Technology', 1, 'What does the “www” in a web address stand for?',
    ['World Wide Web']),
  written('Technology', 2, 'Which Japanese company created the PlayStation?', ['Sony']),
  written('Animals', 1, 'What is the fastest land animal?', ['Cheetah']),
  written('Animals', 1, 'How many legs does a spider have?', ['8', 'Eight']),
  written('Animals', 1, 'What is the largest animal on Earth?',
    ['Blue whale', 'The blue whale']),
  written('Animals', 2, 'What colour is an octopus’s blood?', ['Blue']),
  written('Animals', 2, 'Which mammal is the only one that truly flies?',
    ['Bat', 'Bats']),
  written('Video games', 1, 'In which game do you build a world out of cubes?',
    ['Minecraft']),
  written('Video games', 1, 'Which blue hedgehog is Sega’s mascot?', ['Sonic']),
  written('Video games', 2, 'Which princess is Link trying to rescue?', ['Zelda']),
  written('Video games', 2, 'In which year did the Nintendo Switch come out?',
    ['2017']),

  // ═══ Odd one out, funny and otherwise ═════════════════════════════════
  written('Curiosities', 1, 'What colour was Napoleon’s white horse?',
    ['White']),
  written('Curiosities', 1, 'How many months of the year have 28 days?',
    ['12', 'Twelve', 'All of them'], 'Read the question again'),
  written('Curiosities', 2, 'A plane crashes right on the border. Where are the survivors buried?',
    ['Nowhere', 'You don’t bury survivors', 'They are not buried'],
    'The survivors are doing rather well'),
  written('Curiosities', 2, 'Which animal cannot walk backwards?',
    ['Kangaroo', 'Emu']),
  written('Curiosities', 2, 'Which food never goes off?', ['Honey']),
  written('Curiosities', 2, 'Which mammal sleeps up to twenty hours a day?',
    ['Koala']),
  oddOneOut('Curiosities', 2, 'Which of these phobias does not exist?',
    ['Arachnophobia', 'Claustrophobia', 'Anatidaephobia', 'Agoraphobia', 'Acrophobia'],
    'Anatidaephobia', 'It would involve ducks'),
  oddOneOut('Curiosities', 2, 'Which of these animals is made up?',
    ['Platypus', 'Axolotl', 'Blobfish', 'Tarsier', 'Grumblefox'], 'Grumblefox'),
  oddOneOut('Geography', 1, 'Which one is not an island?',
    ['Madagascar', 'Sri Lanka', 'Mongolia', 'Iceland', 'Cuba'], 'Mongolia'),
  oddOneOut('Geography', 2, 'Which one is not a capital city?',
    ['Lima', 'Quito', 'Rio de Janeiro', 'Bogotá', 'Santiago'], 'Rio de Janeiro'),
  oddOneOut('Science', 2, 'Which one is not a state of matter?',
    ['Solid', 'Liquid', 'Gas', 'Plasma', 'Crystalline'], 'Crystalline'),
  oddOneOut('Animals', 1, 'Which one is not a big cat?',
    ['Lion', 'Tiger', 'Hyena', 'Leopard', 'Jaguar'], 'Hyena'),
  oddOneOut('Animals', 1, 'Which one is not a bird?',
    ['Penguin', 'Ostrich', 'Bat', 'Kiwi', 'Emu'], 'Bat'),
  oddOneOut('Cinema', 2, 'Which one is not a Pixar film?',
    ['Up', 'Inside Out', 'Shrek', 'Ratatouille', 'Coco'], 'Shrek'),
  oddOneOut('Food', 2, 'Which one is not an Italian dish?',
    ['Risotto', 'Osso buco', 'Paella', 'Tiramisu', 'Focaccia'], 'Paella'),
  oddOneOut('Video games', 1, 'Which one is not a Nintendo console?',
    ['Game Boy', 'Wii', 'Dreamcast', 'Switch', 'GameCube'], 'Dreamcast'),

  // ═══ Name a few ═══════════════════════════════════════════════════════
  list('Geography', 1, 'Name 4 countries in South America', 4, [
    'Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Bolivia', 'Ecuador',
    'Venezuela', 'Paraguay', 'Uruguay', 'Guyana', 'Suriname',
  ]),
  list('Geography', 2, 'Name 5 countries in Oceania', 5, [
    'Australia', 'New Zealand', 'Papua New Guinea', 'Fiji', 'Samoa', 'Tonga',
    'Vanuatu', 'Palau', 'Nauru', 'Tuvalu', 'Kiribati', 'Micronesia',
    'Marshall Islands', 'Solomon Islands',
  ]),
  list('Science', 2, 'Name 4 planets of the solar system', 4, [
    'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune',
  ]),
  list('Animals', 1, 'Name 3 animals of the African savannah', 3, [
    'Lion', 'Elephant', 'Giraffe', 'Zebra', 'Hippo', 'Hippopotamus', 'Rhino',
    'Rhinoceros', 'Cheetah', 'Wildebeest', 'Hyena', 'Baboon', 'Crocodile',
    'Ostrich', 'Leopard', 'Buffalo', 'Antelope', 'Meerkat',
  ]),
  list('Animals', 2, 'Name 5 sea creatures', 5, [
    'Dolphin', 'Whale', 'Shark', 'Orca', 'Seal', 'Jellyfish', 'Octopus',
    'Turtle', 'Walrus', 'Ray', 'Sea lion', 'Narwhal', 'Seahorse', 'Coral',
    'Starfish', 'Crab', 'Lobster', 'Tuna',
  ]),
  list('Sport', 2, 'Name 4 sports played with a racket', 4, [
    'Tennis', 'Badminton', 'Squash', 'Table tennis', 'Ping-pong', 'Padel',
    'Racquetball', 'Beach tennis',
  ]),
  list('Music', 2, 'Name 4 wind instruments', 4, [
    'Flute', 'Trumpet', 'Saxophone', 'Clarinet', 'Oboe', 'Bassoon', 'Trombone',
    'Tuba', 'French horn', 'Harmonica', 'Bagpipes', 'Recorder',
  ]),
  list('Cinema', 2, 'Name 4 Star Wars films', 4, [
    'A New Hope', 'The Empire Strikes Back', 'Return of the Jedi',
    'The Phantom Menace', 'Attack of the Clones', 'Revenge of the Sith',
    'The Force Awakens', 'The Last Jedi', 'The Rise of Skywalker',
    'Rogue One', 'Solo',
  ]),
  list('Video games', 1, 'Name 3 home consoles', 3, [
    'PlayStation', 'Xbox', 'Nintendo Switch', 'Wii', 'GameCube', 'Nintendo 64',
    'Mega Drive', 'Genesis', 'Super Nintendo', 'Dreamcast', 'PlayStation 2',
    'Atari 2600', 'NES', 'Wii U', 'PlayStation 5', 'Xbox 360',
  ]),
  list('Curiosities', 2, 'Name 4 things a polar bear never eats', 4, [
    'Penguin', 'Bamboo', 'Cactus', 'Pineapple', 'Banana', 'Pizza', 'Cheese',
    'Chocolate', 'Salad', 'Bread', 'Rice', 'Pasta',
  ], 'Penguins live at the other pole'),

  // ═══ Estimates ════════════════════════════════════════════════════════
  estimate('Geography', 1, 'How many member states does the UN have?', 193, 'countries'),
  estimate('Geography', 2, 'How tall is Mount Everest?', 8849, 'metres'),
  estimate('Science', 2, 'How many bones are there in an adult human body?', 206, 'bones'),
  estimate('Sport', 2, 'How long is a marathon?', 42, 'kilometres'),
  estimate('Animals', 2, 'How fast can a cheetah run at full sprint?', 110, 'km/h'),
  estimate('Animals', 1, 'How long does an elephant live, on average?', 65, 'years'),
  estimate('Curiosities', 2, 'How many times does a person blink in a day?', 15000, 'times'),
  estimate('Curiosities', 2, 'How many litres of saliva do we produce in a year?', 500, 'litres'),
  estimate('Technology', 2, 'How many hours of video are uploaded to YouTube every minute?',
    500, 'hours'),
  estimate('Nature', 2, 'How tall is the tallest tree in the world?', 116, 'metres'),

  // ═══ Ranking ══════════════════════════════════════════════════════════
  ranking('Geography', 1, 'Rank these countries from most to least populated',
    ['India', 'China', 'United States', 'Indonesia', 'Brazil'],
    'Most populated', 'Least populated'),
  ranking('Animals', 1, 'Rank these animals from fastest to slowest',
    ['Peregrine falcon', 'Cheetah', 'Horse', 'Human', 'Snail'],
    'Fastest', 'Slowest'),
  ranking('Curiosities', 2, 'Rank these animals from sleepiest to most awake',
    ['Koala', 'Cat', 'Human', 'Elephant', 'Giraffe'],
    'Sleepiest', 'Least sleepy'),
  ranking('Technology', 2, 'Rank these networks from oldest to newest',
    ['Facebook', 'Twitter', 'Instagram', 'Snapchat', 'TikTok'],
    'Oldest', 'Newest'),
  ranking('Video games', 2, 'Rank these consoles from oldest to newest',
    ['NES', 'Game Boy', 'PlayStation', 'Wii', 'Nintendo Switch'],
    'Oldest', 'Newest'),

  // ═══ Matching ═════════════════════════════════════════════════════════
  matching('Geography', 1, 'Match each country to its capital', {
    'Italy': 'Rome', 'Spain': 'Madrid', 'Portugal': 'Lisbon', 'Greece': 'Athens',
  }),
  matching('Geography', 2, 'Match each country to its currency', {
    'Japan': 'Yen', 'United Kingdom': 'Pound sterling', 'Switzerland': 'Swiss franc',
    'India': 'Rupee',
  }),
  matching('Science', 1, 'Match each element to its symbol', {
    'Gold': 'Au', 'Iron': 'Fe', 'Oxygen': 'O', 'Sodium': 'Na',
  }),
  matching('Cinema', 1, 'Match each film to its director', {
    'Pulp Fiction': 'Quentin Tarantino', 'Inception': 'Christopher Nolan',
    'Jurassic Park': 'Steven Spielberg', 'The Godfather': 'Francis Ford Coppola',
  }),
  matching('Animals', 2, 'Match each animal to its family', {
    'Dolphin': 'Mammal', 'Frog': 'Amphibian', 'Shark': 'Fish', 'Turtle': 'Reptile',
  }),
  matching('Food', 2, 'Match each dish to its country', {
    'Sushi': 'Japan', 'Paella': 'Spain', 'Goulash': 'Hungary', 'Moussaka': 'Greece',
  }),
  matching('Video games', 1, 'Match each game to its studio', {
    'Minecraft': 'Mojang', 'The Legend of Zelda': 'Nintendo',
    'Fortnite': 'Epic Games', 'The Witcher': 'CD Projekt',
  }),

  // ═══ Pick your level ══════════════════════════════════════════════════
  pickYourLevel('Geography', [
    ['What is the capital of Portugal?', ['Lisbon']],
    ['What is the longest river in Africa?', ['Nile', 'The Nile']],
    ['What is the capital of Kazakhstan?', ['Astana', 'Nur-Sultan']],
  ]),
  pickYourLevel('Cinema', [
    ['Who directed E.T. and Jurassic Park?', ['Spielberg', 'Steven Spielberg']],
    ['Which actor plays Jack in Titanic?',
      ['Leonardo DiCaprio', 'DiCaprio']],
    ['What was Disney’s first feature-length animated film?',
      ['Snow White', 'Snow White and the Seven Dwarfs']],
  ]),
  pickYourLevel('Curiosities', [
    ['How many legs does a millipede have, at the very least?', ['30', 'Thirty']],
    ['Which continent has no snakes at all?', ['Antarctica']],
    ['Which animal kills the most humans every year?', ['Mosquito', 'Mosquitoes']],
  ]),

  // ═══ Word game ════════════════════════════════════════════════════════
  wordGame(1, 'B', ['A country', 'An animal', 'A food', 'A job', 'A first name', 'A city']),
  wordGame(1, 'M', ['A city', 'A fruit or vegetable', 'A sport', 'A first name', 'A film', 'A brand']),
  wordGame(2, 'S', ['A country', 'A sport', 'A food', 'A first name', 'A band', 'A household object']),
  wordGame(2, 'C', ['An animal', 'A capital city', 'A job', 'A film', 'A body part', 'A famous person']),
]
