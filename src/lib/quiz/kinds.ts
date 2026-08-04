/**
 * Les formes de questions.
 *
 * Chaque forme est un composant autonome qui ignore tout du salon, du
 * minuteur et du score : il recoit son contenu, il rend une reponse. C'est
 * ce contrat qui permettra d'en ajouter six de plus sans toucher au moteur.
 */

export type QuestionKind =
  | 'ecrite'
  | 'liste'
  | 'estimation'
  | 'classement'
  | 'frise'
  | 'carte'
  | 'petit_bac'
  | 'intrus'
  | 'association'
  | 'theme'
  | 'silhouette'
  | 'media'

/** Contenu propre a chaque forme, tel qu'il est stocke en base. */
export interface WrittenPayload {
  placeholder?: string
}
export interface ListPayload {
  /** Nombre de reponses demandees. */
  count: number
}
export interface EstimatePayload {
  unit?: string
}
export interface RankingPayload {
  items: string[]
  /** Ce que signifie « en premier » : sans quoi la consigne est ambigue. */
  topLabel: string
  bottomLabel: string
}
export interface OddOneOutPayload {
  items: string[]
}
export interface PairsPayload {
  left: string[]
  right: string[]
}
export interface PetitBacPayload {
  letter: string
  categories: string[]
}
/**
 * Frise : un axe du temps qu'on parcourt pour designer une annee. Les
 * reperes servent d'echelle, sans quoi un axe nu ne veut rien dire.
 */
export interface TimelinePayload {
  event: string
  from: number
  to: number
  marks?: { label: string; year: number }[]
}
export interface MapPayload {
  /** Le cadrage : le monde entier ne sert a rien pour situer un departement. */
  region: 'monde' | 'europe' | 'france' | 'pays'
  /**
   * Cadrage explicite en degres, pour un pays qui n'a pas son entree.
   * `x` est la longitude du bord gauche, `y` l'oppose de la latitude du
   * bord haut, comme dans le fond de carte.
   */
  box?: { x: number; y: number; w: number; h: number }
  /** Ce qu'il faut placer, si l'enonce ne suffit pas. */
  target?: string
}

/**
 * Silhouette : les frontieres d'un pays, seules et souvent tournees. Le
 * trace voyage avec la question, sans son nom : l'envoyer reviendrait a
 * livrer la reponse dans le navigateur.
 */
export interface SilhouettePayload {
  shape: string
  /** Rotation en degres. Elle interdit de reconnaitre par l'orientation. */
  rotate: number
}
/**
 * Theme a difficulte choisie : trois questions du meme sujet, le joueur
 * decide laquelle il affronte et combien elle vaut.
 */
export interface ThemePayload {
  theme: string
  levels: { level: number; prompt: string; points: number }[]
}

export interface Question {
  id: string
  idx: number
  kind: QuestionKind
  prompt: string
  hint: string | null
  points: number
  /** 1 facile, 2 moyen, 3 difficile. */
  difficulty: number
  payload: unknown
  /** Jamais envoye au navigateur pendant la partie. */
  answer?: unknown
}

/** Ce que le joueur a soumis, forme-dependant. */
export type AnswerPayload =
  | { kind: 'ecrite'; text: string }
  | { kind: 'liste'; items: string[] }
  | { kind: 'estimation'; value: number }
  | { kind: 'classement'; order: string[] }
  | { kind: 'intrus'; choice: string }
  | { kind: 'association'; pairs: Record<string, string> }
  | { kind: 'petit_bac'; words: Record<string, string> }
  | { kind: 'frise'; year: number }
  | { kind: 'carte'; lat: number; lng: number }
  | { kind: 'theme'; level: number; text: string }
  | { kind: 'silhouette'; text: string }

/**
 * Contrat commun a toutes les formes. `disabled` couvre aussi bien le
 * minuteur ecoule que la reponse deja envoyee : le composant n'a pas a
 * savoir laquelle des deux.
 */
export interface QuestionComponentProps<P, A> {
  payload: P
  value: A | null
  disabled: boolean
  onChange: (answer: A) => void
}

/**
 * Une forme est-elle notable sans intervention de l'hote ?
 *
 * L'ecrite et la liste en font partie depuis qu'elles portent leurs
 * variantes acceptees : la machine reconnait ce qu'elle peut, l'hote ne
 * tranche plus que le reste. C'est ce qui fait tenir la correction en
 * quelques minutes.
 */
export function isAutoScored(kind: QuestionKind): boolean {
  return (
    kind === 'ecrite' ||
    kind === 'liste' ||
    kind === 'estimation' ||
    kind === 'classement' ||
    kind === 'frise' ||
    kind === 'carte' ||
    kind === 'intrus' ||
    kind === 'association' ||
    kind === 'theme' ||
    kind === 'silhouette'
  )
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Facile',
  2: 'Moyen',
  3: 'Difficile',
}

export const KIND_LABELS: Record<QuestionKind, string> = {
  ecrite: 'Réponse écrite',
  liste: 'Citez',
  estimation: 'Estimation',
  classement: 'Classement',
  frise: 'Frise',
  carte: 'Carte',
  petit_bac: 'Petit bac',
  theme: 'Thème au choix',
  silhouette: 'Silhouette',
  intrus: 'Intrus',
  association: 'Association',
  media: 'Extrait',
}
