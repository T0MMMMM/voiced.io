/**
 * Reglages d'un salon.
 *
 * Ils vivent dans une colonne `jsonb` : ces options changeront souvent et
 * aucune n'a besoin d'etre filtree en SQL. Le prix de cette souplesse est
 * qu'une ligne peut contenir n'importe quoi — une version anterieure, une
 * cle supprimee, un type inattendu. `mergeOptions` est la porte qui
 * referme ce risque : tout ce qui entre dans l'application passe par elle.
 */

/** Assez pour une soiree ; au-dela, plus personne ne suit. */
export const MAX_PLAYERS = 8

export type TimerSec = 0 | 15 | 30 | 60

/** Longueur d'une partie de quiz. */
export type QuestionCount = 10 | 20 | 30

export interface RoomOptions {
  /** 0 = pas de minuteur. */
  timerSec: TimerSec
  /** Nombre de questions tirees pour la partie. */
  questionCount: QuestionCount
  /** Ordre des questions tire au hasard. */
  shuffle: boolean
  /** L'hote corrige sans voir qui a repondu quoi. */
  anonymousGrading: boolean
  /** Chacun mise sur sa confiance avant de repondre. */
  allowBets: boolean
  /** Des indices tombent, et la question perd de la valeur. */
  allowHints: boolean
  /** Celui qui passe laisse la main aux autres. */
  allowSteal: boolean
}

export const COUNT_CHOICES: { value: QuestionCount; label: string }[] = [
  { value: 10, label: 'Courte' },
  { value: 20, label: 'Normale' },
  { value: 30, label: 'Longue' },
]

export const TIMER_CHOICES: { value: TimerSec; label: string }[] = [
  { value: 0, label: 'Aucun' },
  { value: 15, label: '15 s' },
  { value: 30, label: '30 s' },
  { value: 60, label: '60 s' },
]

export const DEFAULT_OPTIONS: RoomOptions = {
  timerSec: 30,
  questionCount: 20,
  shuffle: false,
  anonymousGrading: false,
  allowBets: false,
  allowHints: false,
  allowSteal: false,
}

const TIMER_VALUES = TIMER_CHOICES.map((choice) => choice.value)
const COUNT_VALUES = COUNT_CHOICES.map((choice) => choice.value)

/**
 * Reglages qui ont un sens pour chaque jeu.
 *
 * Le doublage n'en a aucun : il se joue au micro, sans minuteur ni mise, et
 * afficher une section vide reviendrait a promettre des reglages qui
 * n'existent pas. La section disparait alors completement.
 */
export const OPTIONS_BY_GAME: Record<string, (keyof RoomOptions)[]> = {
  quiz: [
    'questionCount',
    'timerSec',
    'shuffle',
    'anonymousGrading',
    'allowBets',
    'allowHints',
    'allowSteal',
  ],
  beast: ['timerSec', 'shuffle'],
  next: ['timerSec'],
  dub: [],
}

export function optionsFor(game: string): (keyof RoomOptions)[] {
  return OPTIONS_BY_GAME[game] ?? []
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function timer(value: unknown): TimerSec {
  return TIMER_VALUES.includes(value as TimerSec)
    ? (value as TimerSec)
    : DEFAULT_OPTIONS.timerSec
}

function count(value: unknown): QuestionCount {
  return COUNT_VALUES.includes(value as QuestionCount)
    ? (value as QuestionCount)
    : DEFAULT_OPTIONS.questionCount
}

export function mergeOptions(stored: unknown): RoomOptions {
  // `typeof null === 'object'`, et un tableau aussi : les deux sont exclus.
  const source =
    stored !== null && typeof stored === 'object' && !Array.isArray(stored)
      ? (stored as Record<string, unknown>)
      : {}

  return {
    timerSec: timer(source.timerSec),
    questionCount: count(source.questionCount),
    shuffle: bool(source.shuffle, DEFAULT_OPTIONS.shuffle),
    anonymousGrading: bool(
      source.anonymousGrading,
      DEFAULT_OPTIONS.anonymousGrading,
    ),
    allowBets: bool(source.allowBets, DEFAULT_OPTIONS.allowBets),
    allowHints: bool(source.allowHints, DEFAULT_OPTIONS.allowHints),
    allowSteal: bool(source.allowSteal, DEFAULT_OPTIONS.allowSteal),
  }
}
