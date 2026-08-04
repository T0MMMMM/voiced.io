/**
 * Champ d'onde de la piste de reference.
 *
 * Le piege d'une piste animee est de faire osciller chaque barre pour elle
 * meme : on obtient un scintillement, pas une vague. Ici l'amplitude est
 * une fonction *continue* de la position — deux barres voisines lisent deux
 * points proches de la meme courbe, donc leurs hauteurs se ressemblent
 * forcement. C'est cette continuite qui fait la vague.
 *
 * Trois sinusoides de longueurs, vitesses et sens differents se superposent :
 * aucune ne domine, leur somme ne se repete pas a l'oeil, et le mouvement
 * traverse la piste dans les deux sens a la fois.
 */

/** Ecartement entre deux barres dans le champ. Regle la taille des vagues. */
const SPACING = 0.24

/** Plancher : une piste n'est jamais tout a fait plate. */
export const FLOOR = 0.045

type Wave = { length: number; speed: number; weight: number }

/**
 * Trois ondes suffisent : au-dela, les vagues se croisent trop et le trace
 * redevient du bruit. Les longueurs sont choisies pour qu'on en compte deux
 * a quatre sur la largeur de la piste — assez pour voir le mouvement
 * traverser, pas assez pour qu'il s'emmele.
 */
const CARRIER: Wave[] = [
  { length: 0.62, speed: -2.4, weight: 0.5 },
  { length: 1.15, speed: 3.1, weight: 0.3 },
  { length: 0.33, speed: 1.6, weight: 0.35 },
]

/** Ondes lentes qui creusent des zones fortes et des zones calmes. */
const ENVELOPE: Wave[] = [
  { length: 0.28, speed: -1.15, weight: 0.6 },
  { length: 0.15, speed: 0.7, weight: 0.4 },
]

const CARRIER_SUM = CARRIER.reduce((total, wave) => total + wave.weight, 0)

function sum(waves: Wave[], x: number, t: number): number {
  let value = 0
  for (const wave of waves) {
    value += Math.sin(x * wave.length + t * wave.speed) * wave.weight
  }
  return value
}

/**
 * Amplitude de la barre `index` a l'instant `t`, en secondes.
 * Deterministe : le meme couple donne toujours la meme valeur, ce qui
 * permet de rendre la piste cote serveur sans divergence d'hydratation.
 */
export function amplitudeAt(index: number, t: number): number {
  const x = index * SPACING

  // La valeur absolue donne au trace des pics francs et des creux proches
  // de zero, comme une vraie forme d'onde — une sinusoide signee ondulerait
  // mollement autour du milieu.
  const carrier = Math.abs(sum(CARRIER, x, t)) / CARRIER_SUM

  // L'enveloppe ne descend pas a zero : une zone totalement muette
  // ressemblerait a un trou dans l'affichage.
  const envelope = 0.28 + 0.72 * (0.5 + 0.5 * sum(ENVELOPE, x, t))

  const shaped = Math.min(1, carrier ** 1.25 * envelope)
  return FLOOR + (1 - FLOOR) * shaped
}
