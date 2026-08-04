/**
 * Le tirage des questions d'une partie.
 *
 * Tirer au hasard dans la banque ne suffit pas : certaines formes sont
 * savoureuses une fois et penibles trois fois. Un petit bac demande une
 * minute a remplir et une minute a corriger : deux dans la meme partie et
 * la table decroche. Le plafond vit donc ici, pas dans la banque.
 */

import type { QuestionKind } from '@/lib/quiz/kinds'

export interface Drawable {
  id: string
  kind: QuestionKind
}

/** Formes limitees, et pourquoi. Les autres n'ont pas de plafond. */
export const MAX_PER_KIND: Partial<Record<QuestionKind, number>> = {
  petit_bac: 1,
}

/** Melange de Fisher-Yates : chaque ordre est aussi probable. */
function shuffled<T>(items: T[], random: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const a = copy[i]
    const b = copy[j]
    if (a === undefined || b === undefined) continue
    copy[i] = b
    copy[j] = a
  }
  return copy
}

/**
 * Tire `count` questions au plus, plafonds respectes.
 *
 * On rend moins que demande plutot que de forcer : un salon qui n'autorise
 * qu'une forme plafonnee doit obtenir une partie courte, pas une partie
 * qui contourne son propre reglage.
 */
export function drawQuestions<T extends Drawable>(
  pool: T[],
  count: number,
  random: () => number = Math.random,
): T[] {
  const taken = new Map<QuestionKind, number>()
  const drawn: T[] = []

  for (const question of shuffled(pool, random)) {
    if (drawn.length >= count) break

    const cap = MAX_PER_KIND[question.kind]
    const already = taken.get(question.kind) ?? 0
    if (cap !== undefined && already >= cap) continue

    taken.set(question.kind, already + 1)
    drawn.push(question)
  }

  return drawn
}
