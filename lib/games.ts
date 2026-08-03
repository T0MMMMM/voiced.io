export type GameId = 'quiz' | 'dub' | 'beast' | 'next'

/**
 * Metadonnees serialisables. Elles traversent la frontiere serveur/client :
 * la fonction de trace, elle, ne le peut pas — d'ou `getShape`, que le
 * composant client importe de son cote.
 */
export interface Game {
  id: GameId
  name: string
  tagline: string
  href: string | null
}

export type ShapeFn = (index: number, total: number) => number

/** Une piste n'est jamais tout a fait plate, sauf quand c'est le propos. */
export const FLOOR = 0.06

const wrap = (value: number) => FLOOR + (1 - FLOOR) * Math.min(Math.max(value, 0), 1)

/**
 * La forme d'onde de chaque jeu en dit la regle avant le nom.
 *
 * C'est le pari de la page d'accueil : quatre pistes d'une console, dont le
 * trace seul suffit a distinguer un quiz d'un doublage.
 */
const SHAPES: Record<GameId, ShapeFn> = {
  // Question, reponse, question, reponse : des impulsions regulieres,
  // franchement separees.
  quiz: (i) => wrap(Math.abs(Math.sin(i * 0.4 + 0.3)) ** 6),

  // De la parole continue : dense, irreguliere, sans vrai silence.
  dub: (i) =>
    wrap(
      (0.45 + 0.55 * Math.abs(Math.sin(i * 0.95 + Math.cos(i * 0.41)))) *
        (0.55 + 0.45 * Math.abs(Math.sin(i * 0.11))),
    ),

  // Un cri, puis rien pendant longtemps. Les silences font le jeu.
  beast: (i) => {
    const burst = Math.max(0, Math.sin(i * 0.19 + 1.1) - 0.55) / 0.45
    return wrap(burst * (0.5 + 0.5 * Math.abs(Math.sin(i * 1.7))))
  },

  // Le trace s'arrete net a mi-parcours. C'est litteralement la regle du
  // jeu : le son se coupe, et c'est a vous d'inventer la suite.
  next: (i, total) => {
    if (i / total > 0.52) return 0
    return wrap(
      (0.5 + 0.5 * Math.abs(Math.sin(i * 0.9 + Math.cos(i * 0.35)))) *
        (0.6 + 0.4 * Math.abs(Math.sin(i * 0.14))),
    )
  },
}

export function getShape(id: GameId): ShapeFn {
  return SHAPES[id]
}

export const GAMES: Game[] = [
  {
    id: 'quiz',
    name: 'Quiz',
    tagline: 'Sept formes de questions. L’hôte corrige à la main, tout le monde regarde.',
    href: null,
  },
  {
    id: 'dub',
    name: 'Doublage',
    tagline: 'Prêtez vos voix à une scène. On découvre le résultat ensemble.',
    href: '/create',
  },
  {
    id: 'beast',
    name: 'Animaux',
    tagline: 'Un cri, un animal à reconnaître. Plus dur qu’il n’y paraît.',
    href: null,
  },
  {
    id: 'next',
    name: 'La suite',
    tagline: 'Le son s’arrête net. À vous d’inventer ce qui vient après.',
    href: null,
  },
]
