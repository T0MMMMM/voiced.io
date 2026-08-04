/**
 * Reglages d'un salon.
 *
 * Ils vivent dans une colonne `jsonb` : ces options changeront souvent et
 * aucune n'a besoin d'etre filtree en SQL. Le prix de cette souplesse est
 * qu'une ligne peut contenir n'importe quoi : une version anterieure, une
 * cle supprimee, un type inattendu. `mergeOptions` est la porte qui
 * referme ce risque : tout ce qui entre dans l'application passe par elle.
 */

import type { QuestionKind } from '@/lib/quiz/kinds'
import { PACE_CHOICES, type Pace } from '@/lib/quiz/timing'

export { PACE_CHOICES, type Pace }

/** Assez pour une soiree ; au-dela, plus personne ne suit. */
export const MAX_PLAYERS = 8

/** Longueur d'une partie de quiz. */
export type QuestionCount = 10 | 20 | 30

/**
 * Les formes qu'un salon peut tirer.
 *
 * Seules celles que la banque alimente sont proposees : offrir « Extrait »
 * dans le salon alors qu'aucune question sonore n'existe reviendrait a
 * promettre une partie qui ne tomberait jamais.
 */
export const KIND_CHOICES: { value: QuestionKind; label: string }[] = [
  { value: 'ecrite', label: 'Réponse écrite' },
  { value: 'liste', label: 'Citez' },
  { value: 'estimation', label: 'Estimation' },
  { value: 'intrus', label: 'Intrus' },
  { value: 'classement', label: 'Classement' },
  { value: 'frise', label: 'Frise' },
  { value: 'association', label: 'Association' },
  { value: 'carte', label: 'Carte' },
  { value: 'silhouette', label: 'Silhouette' },
  { value: 'theme', label: 'Thème au choix' },
  { value: 'petit_bac', label: 'Petit bac' },
]

export interface RoomOptions {
  /**
   * Le rythme, et non plus une duree fixe : chaque question tire son temps
   * de sa forme et de sa difficulte, ce reglage ne fait que l'etirer ou le
   * resserrer pour toute la table.
   */
  pace: Pace
  /** Nombre de questions tirees pour la partie. */
  questionCount: QuestionCount
  /** Formes de questions autorisees dans le tirage. */
  kinds: QuestionKind[]
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

export const DEFAULT_OPTIONS: RoomOptions = {
  pace: 'normal',
  questionCount: 20,
  // Toutes les formes par defaut : une premiere partie doit montrer ce que
  // le quiz sait faire, pas la version la plus sage.
  kinds: KIND_CHOICES.map((choice) => choice.value),
  shuffle: false,
  anonymousGrading: false,
  allowBets: false,
  allowHints: false,
  allowSteal: false,
}

const PACE_VALUES = PACE_CHOICES.map((choice) => choice.value)
const COUNT_VALUES = COUNT_CHOICES.map((choice) => choice.value)
const KIND_VALUES = KIND_CHOICES.map((choice) => choice.value)

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
    'pace',
    'kinds',
    'shuffle',
    'anonymousGrading',
    'allowBets',
    'allowHints',
    'allowSteal',
  ],
  beast: ['pace', 'shuffle'],
  next: ['pace'],
  dub: [],
}

export function optionsFor(game: string): (keyof RoomOptions)[] {
  return OPTIONS_BY_GAME[game] ?? []
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function pace(value: unknown): Pace {
  return PACE_VALUES.includes(value as Pace)
    ? (value as Pace)
    : DEFAULT_OPTIONS.pace
}

/**
 * Les formes retenues.
 *
 * Une liste vide n'est pas une erreur a corriger en silence : c'est un
 * salon qui n'aurait aucune question a tirer. On retombe alors sur tout,
 * ce que le tirage confirmera de son cote.
 */
function kindList(value: unknown): QuestionKind[] {
  if (!Array.isArray(value)) return DEFAULT_OPTIONS.kinds
  const kept = KIND_VALUES.filter((kind) => value.includes(kind))
  return kept.length > 0 ? kept : DEFAULT_OPTIONS.kinds
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
    pace: pace(source.pace),
    questionCount: count(source.questionCount),
    kinds: kindList(source.kinds),
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
