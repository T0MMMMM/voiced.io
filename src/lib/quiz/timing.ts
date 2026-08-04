/**
 * Combien de temps donner a une question.
 *
 * Un minuteur unique pour toute la partie etait le plus mauvais des
 * reglages : trente secondes noient une question a un mot et etranglent un
 * petit bac a quatre categories. Le temps se deduit donc de la question
 * elle-meme, et le salon ne choisit plus qu'un rythme general.
 *
 * Deux choses le determinent :
 *   · la forme, qui dit combien de gestes la reponse demande : ecrire un
 *     mot n'a rien a voir avec relier quatre paires ;
 *   · la difficulte, parce qu'une question qu'on cherche merite qu'on la
 *     cherche.
 */

import type { QuestionKind } from '@/lib/quiz/kinds'

/** Le rythme choisi dans le salon, seul reglage de temps qui subsiste. */
export type Pace = 'calme' | 'normal' | 'rapide'

/**
 * Secondes accordees a une question facile, forme par forme.
 *
 * Ces valeurs viennent du temps de saisie, pas du temps de reflexion :
 * c'est ce dernier que la difficulte ajoute ensuite.
 */
const BASE: Record<QuestionKind, number> = {
  ecrite: 18,
  intrus: 18,
  estimation: 22,
  media: 25,
  frise: 26,
  silhouette: 24,
  carte: 30,
  // On peut demander jusqu'a six reponses : trente secondes suffisaient
  // pour trois, elles etranglaient les listes longues.
  liste: 40,
  theme: 34,
  classement: 38,
  association: 42,
  // Six categories a remplir : c'est la seule forme ou le temps de saisie
  // depasse largement le temps de reflexion.
  petit_bac: 90,
}

/** Ce qu'un cran de difficulte ajoute, en secondes. */
const PER_LEVEL = 6

const FACTORS: Record<Pace, number> = {
  calme: 1.35,
  normal: 1,
  rapide: 0.7,
}

/** En dessous, on ne lit meme plus l'enonce. */
const FLOOR_SEC = 10

export const PACE_CHOICES: { value: Pace; label: string }[] = [
  { value: 'calme', label: 'Tranquille' },
  { value: 'normal', label: 'Normal' },
  { value: 'rapide', label: 'Rapide' },
]

export function secondsFor(
  kind: QuestionKind,
  difficulty: number,
  pace: Pace,
): number {
  const base = BASE[kind] ?? BASE.ecrite
  const level = Math.min(3, Math.max(1, Math.round(difficulty || 1)))
  const factor = FACTORS[pace] ?? FACTORS.normal

  return Math.max(FLOOR_SEC, Math.round((base + (level - 1) * PER_LEVEL) * factor))
}
