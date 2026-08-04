/**
 * Recouvrement entre prises.
 *
 * Refaire une prise remplace la precedente au lieu de s'empiler dessus :
 * sans cela, cinq essais donnent cinq voix superposees. Encore faut-il
 * savoir ce que « se recouvrir » veut dire.
 *
 * Deux prises consecutives se touchent bord a bord : la premiere finit ou
 * la seconde commence. Un test strict les declare pourtant chevauchantes
 * des que l'arithmetique flottante decale la borne d'un cheveu : et
 * enregistrer un segment effaçait celui d'avant. La tolerance ci-dessous
 * regle ce cas, et elle reste tres inferieure a un vrai recouvrement.
 */

/** En deca, deux prises sont adjacentes, pas superposees. */
export const OVERLAP_TOLERANCE_SEC = 0.12

export interface Span {
  startSec: number
  durationMs: number
}

export function overlaps(
  a: Span,
  b: Span,
  tolerance: number = OVERLAP_TOLERANCE_SEC,
): boolean {
  const aEnd = a.startSec + a.durationMs / 1000
  const bEnd = b.startSec + b.durationMs / 1000

  // On exige un recouvrement d'au moins `tolerance` de chaque cote, ce qui
  // annule aussi bien l'erreur flottante que les frolements sans importance.
  return a.startSec < bEnd - tolerance && b.startSec < aEnd - tolerance
}

/**
 * Parmi `existing`, celles que `incoming` remplace. On ne compare jamais
 * les prises de joueurs differents : deux personnes peuvent legitimement
 * parler par-dessus le meme passage.
 */
export function replacedBy<T extends Span>(existing: T[], incoming: Span): T[] {
  return existing.filter((take) => overlaps(take, incoming))
}
