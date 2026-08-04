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
    kind === 'association'
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
  intrus: 'Intrus',
  association: 'Association',
  media: 'Extrait',
}
