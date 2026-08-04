import type { fr } from './fr'

/**
 * The English dictionary.
 *
 * `satisfies typeof fr` is the whole point: forget a key and the build
 * stops, rather than leaving a French sentence in the middle of an English
 * screen where nobody will notice it.
 */
export const en = {
  common: {
    loading: 'Loading…',
    players: (n: number) => `${n} player${n > 1 ? 's' : ''}`,
    points: (n: number) => `${n} point${Math.abs(n) > 1 ? 's' : ''}`,
    soon: 'Soon',
    back: 'Back',
    theme: { light: 'Switch to light theme', dark: 'Switch to dark theme' },
    lang: 'Change language',
  },

  games: {
    quiz: {
      name: 'Quiz',
      tagline: 'Eleven question forms, 413 in the bank. The host grades at the end.',
    },
    dub: {
      name: 'Dubbing',
      tagline: 'Lend your voice to a scene. We all hear the result together.',
    },
    beast: {
      name: 'Animals',
      tagline: 'One call, one animal to name. Harder than it sounds.',
    },
    next: {
      name: 'What’s next',
      tagline: 'The sound cuts out. Make up whatever comes after.',
    },
  },

  home: {
    title: 'Play together. Have fun ;)',
    hoverHint: 'Hover a track',
    create: 'Create a room',
    join: 'I have a code',
  },

  create: {
    title: 'Create a room',
    nickname: 'Your nickname',
    nicknamePlaceholder: 'What should we call you?',
    submit: 'Create the room',
  },

  join: {
    title: 'Join a room',
    code: 'Room code',
    nickname: 'Your nickname',
    submit: 'Join',
  },

  room: {
    code: 'Room code',
    copy: (code: string) => `Copy code ${code}`,
    copied: 'Code copied',
    table: 'Around the table',
    hosting: 'You referee',
    free: 'Free seat',
    host: 'Host',
    you: 'you',
    game: 'Game',
    settings: 'Settings',
    show: 'Show',
    hide: 'Hide',
    start: 'Start the game',
    waiting: 'Waiting for the host to start the game.',
    leave: 'Leave the room',
    connected: (n: number) => `${n} player${n > 1 ? 's' : ''} connected`,
  },

  options: {
    length: 'Length',
    pace: 'Pace',
    kinds: 'Question forms',
    lengths: { 10: 'Short', 20: 'Normal', 30: 'Long' },
    paces: { calme: 'Relaxed', normal: 'Normal', rapide: 'Fast' },
    shuffle: 'Random order',
    shuffleHint: 'Questions do not follow the bank’s order',
    anonymousGrading: 'Anonymous grading',
    anonymousGradingHint: 'The host cannot see who wrote what',
    allowBets: 'Bets',
    allowBetsHint: 'Everyone bets on their confidence before answering',
    allowHints: 'Hints',
    allowHintsHint: 'Hints drop in, and the question is worth less',
    allowSteal: 'Stolen question',
    allowStealHint: 'Whoever passes hands it to the others',
  },

  quiz: {
    question: (step: number, total: number) => `Question ${step} of ${total}`,
    progress: (step: number, total: number) => `Progress: ${step} / ${total}`,
    seconds: (n: number) => `${n}s`,
    hint: (text: string) => `Hint: ${text}`,
    validate: 'Submit my answer',
    validated: 'Answer submitted',
    timeUp: 'Time’s up',
    saved: 'Answer saved',
    saving: 'Saving…',
    autoSaves: 'Your answer saves itself',
    validatedCount: (done: number, total: number) =>
      `${done} of ${total} have submitted`,
    empty: 'No question in this game.',
    notSaved: 'Answer not saved.',
    difficulties: { 1: 'Easy', 2: 'Medium', 3: 'Hard' },
    kinds: {
      ecrite: 'Written answer',
      liste: 'Name a few',
      estimation: 'Estimate',
      classement: 'Ranking',
      frise: 'Timeline',
      carte: 'Map',
      petit_bac: 'Word game',
      intrus: 'Odd one out',
      association: 'Matching',
      theme: 'Pick your level',
      silhouette: 'Silhouette',
      media: 'Clip',
    },
  },

  grading: {
    title: (step: number, total: number) => `Grading ${step} of ${total}`,
    expected: 'Expected answer',
    answer: 'Answer',
    noExpected: 'Nothing to compare against: this one is yours to call.',
    autoScored: 'This form grades itself. Override it if needed.',
    right: 'Right',
    wrong: 'Wrong',
    nobody: 'Nobody answered this question.',
    next: 'Next question',
    toFix: 'Adjust the points',
    keyboard: 'Enter or → to move on',
    watching: 'The host is going through the answers.',
    empty: '(empty)',
  },

  fix: {
    eyebrow: 'Before the podium',
    title: 'Anything to make up for?',
    hostHelp:
      'Fix an unfair call, then publish. Totals stay hidden until the podium.',
    playerHelp: 'The host is fixing grading mistakes before the podium.',
    adjusted: (n: number) => `${n > 0 ? '+' : ''}${n} adjusted`,
    publish: 'Publish the results',
  },

  podium: {
    eyebrow: 'Results',
    title: 'The podium',
    replay: 'Play again',
    back: 'Back to the room',
  },
} satisfies typeof fr
