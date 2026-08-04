/**
 * Le dictionnaire français, source de vérité des clés.
 *
 * `en.ts` se déclare `satisfies typeof fr` : une clé oubliée dans la
 * traduction devient une erreur de compilation, pas une phrase française
 * qui traîne au milieu d'un écran anglais.
 *
 * Les valeurs sont soit des chaînes, soit des fonctions quand la phrase
 * dépend d'un nombre ou d'un nom. Écrire `joueurs(2)` plutôt que de
 * concaténer laisse chaque langue accorder à sa façon : l'anglais n'a pas
 * les mêmes règles de pluriel, et le français met une espace avant les
 * deux-points.
 *
 * Pas de `as const` ici : les types resteraient les chaînes françaises
 * elles-mêmes, et l'anglais ne pourrait alors satisfaire que… le français.
 * On veut vérifier la forme, pas le contenu.
 */
export const fr = {
  common: {
    loading: 'Chargement…',
    players: (n: number) => `${n} joueur${n > 1 ? 's' : ''}`,
    points: (n: number) => `${n} point${Math.abs(n) > 1 ? 's' : ''}`,
    soon: 'Bientôt',
    back: 'Retour',
    theme: { light: 'Passer en thème clair', dark: 'Passer en thème sombre' },
    lang: 'Changer de langue',
  },

  games: {
    quiz: {
      name: 'Quiz',
      tagline: 'Onze formes de questions, 413 au catalogue. L’hôte corrige à la fin.',
    },
    dub: {
      name: 'Doublage',
      tagline: 'Prêtez vos voix à une scène. On découvre le résultat ensemble.',
    },
    beast: {
      name: 'Animaux',
      tagline: 'Un cri, un animal à reconnaître. Plus dur qu’il n’y paraît.',
    },
    next: {
      name: 'La suite',
      tagline: 'Le son s’arrête net. À vous d’inventer ce qui vient après.',
    },
  },

  home: {
    title: 'Jouez ensemble. Amusez vous bien ;)',
    hoverHint: 'Survolez une piste',
    create: 'Créer un salon',
    join: 'J’ai un code',
  },

  create: {
    title: 'Ouvrir un salon.',
    lead: 'Vous recevrez un code à quatre lettres. Le jeu se choisit ensuite, à plusieurs.',
    nickname: 'Votre pseudo',
    nicknamePlaceholder: 'Tom',
    submit: 'Créer le salon',
    failed: 'Impossible de créer le salon.',
  },

  join: {
    title: 'Rejoindre une partie.',
    lead: 'Demandez le code à la personne qui a créé le salon.',
    nickname: 'Votre pseudo',
    nicknamePlaceholder: 'Tom',
    code: 'Code du salon',
    submit: 'Rejoindre',
    failed: 'Impossible de rejoindre.',
  },

  room: {
    code: 'Code du salon',
    copy: (code: string) => `Copier le code ${code}`,
    copied: 'Code copié',
    table: 'Autour de la table',
    hosting: 'Vous arbitrez',
    free: 'Place libre',
    host: 'Hôte',
    you: 'vous',
    game: 'Jeu',
    settings: 'Réglages',
    show: 'Afficher',
    hide: 'Masquer',
    start: 'Lancer la partie',
    waiting: 'En attente de l’hôte pour lancer la partie.',
    leave: 'Quitter le salon',
    connected: (n: number) => `${n} joueur${n > 1 ? 's' : ''} connecté${n > 1 ? 's' : ''}`,
  },

  options: {
    length: 'Longueur',
    pace: 'Rythme',
    kinds: 'Formes de questions',
    lengths: { 10: 'Courte', 20: 'Normale', 30: 'Longue' },
    paces: { calme: 'Tranquille', normal: 'Normal', rapide: 'Rapide' },
    shuffle: 'Ordre aléatoire',
    shuffleHint: 'Les questions ne tombent pas dans l’ordre',
    anonymousGrading: 'Correction anonyme',
    anonymousGradingHint: 'L’hôte ne voit pas qui a répondu quoi',
    allowBets: 'Paris',
    allowBetsHint: 'Chacun mise sur sa confiance avant de répondre',
    allowHints: 'Indices',
    allowHintsHint: 'Des indices tombent, la question perd de la valeur',
    allowSteal: 'Question volée',
    allowStealHint: 'Celui qui passe laisse la main aux autres',
  },

  quiz: {
    question: (step: number, total: number) => `Question ${step} sur ${total}`,
    progress: (step: number, total: number) => `Progression : ${step} / ${total}`,
    seconds: (n: number) => `${n} s`,
    hint: (text: string) => `Indice : ${text}`,
    validate: 'Valider ma réponse',
    validated: 'Réponse validée',
    timeUp: 'Temps écoulé',
    saved: 'Réponse enregistrée',
    saving: 'Enregistrement…',
    autoSaves: 'Votre réponse s’enregistre toute seule',
    validatedCount: (done: number, total: number) =>
      `${done} sur ${total} ont validé`,
    empty: 'Aucune question dans cette partie.',
    notSaved: 'Réponse non enregistrée.',
    difficulties: { 1: 'Facile', 2: 'Moyen', 3: 'Difficile' },
    kinds: {
      ecrite: 'Réponse écrite',
      liste: 'Citez',
      estimation: 'Estimation',
      classement: 'Classement',
      frise: 'Frise',
      carte: 'Carte',
      petit_bac: 'Petit bac',
      intrus: 'Intrus',
      association: 'Association',
      theme: 'Thème au choix',
      silhouette: 'Silhouette',
      media: 'Extrait',
    },
  },

  forms: {
    yourAnswer: 'Votre réponse',
    typeHere: 'Écrivez ici',
    typeYourAnswer: 'Tapez votre réponse',
    yourEstimate: 'Votre estimation',
    expectedAnswers: (n: number) => `${n} réponses attendues`,
    choices: 'Propositions',
    map: 'Carte',
    mapPlace: (target: string) => `Cliquez sur la carte pour placer ${target}.`,
    mapPlaceAny: 'Cliquez sur la carte pour placer votre réponse.',
    mapPlaced: 'Point posé. Cliquez ailleurs pour le déplacer.',
    mapCloser: 'Plus vous êtes proche, plus vous marquez.',
    mapLoading: 'Chargement de la carte…',
    pairsPick: 'Choisissez un élément de gauche, puis son partenaire à droite.',
    pairsPartner: (item: string) => `Choisissez le partenaire de « ${item} »`,
    silhouette: 'Silhouette d’un pays',
    whichCountry: 'Quel est ce pays ?',
    typeItsName: 'Écrivez son nom',
    theme: 'Thème',
    themePick: 'Choisissez votre difficulté pour découvrir la question. Le choix est définitif.',
    bacOneWord: 'Un mot par catégorie, commençant par',
    timelineWhen: (event: string) => `Quand ? ${event}`,
    bc: (year: number) => `${year} av. J.-C.`,
    rankUp: 'Monter',
    rankDown: 'Descendre',
  },

  grading: {
    title: (step: number, total: number) => `Correction ${step} sur ${total}`,
    expected: 'Réponse attendue',
    answer: 'Réponse',
    noExpected: 'Aucune correction attendue : c’est vous qui tranchez.',
    autoScored: 'Cette forme se note toute seule. Vous pouvez rectifier si besoin.',
    right: 'Juste',
    wrong: 'Faux',
    nobody: 'Personne n’a répondu à cette question.',
    next: 'Question suivante',
    toFix: 'Ajuster les points',
    keyboard: 'Entrée ou → pour avancer',
    watching: 'L’hôte passe les réponses en revue.',
    playersDot: 'les joueurs',
    amongst: (n: number, list: string) => `${n} attendues parmi : ${list}`,
    empty: '(vide)',
  },

  fix: {
    eyebrow: 'Avant le podium',
    title: 'Un point à rattraper ?',
    hostHelp:
      'Rattrapez une correction injuste, puis publiez. Les totaux restent cachés jusqu’au podium.',
    playerHelp: 'L’hôte rattrape les erreurs de correction avant le podium.',
    adjusted: (n: number) => `${n > 0 ? '+' : ''}${n} ajusté`,
    publish: 'Publier les résultats',
  },

  podium: {
    eyebrow: 'Résultats',
    title: 'Le podium',
    replay: 'Rejouer',
    back: 'Retour au salon',
  },
}
