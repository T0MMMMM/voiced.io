/**
 * Notation automatique.
 *
 * La machine propose, l'hote dispose. Tout ce qui est objectif est calcule
 * ici pour que l'hote n'ait a trancher que ce qui demande vraiment du
 * jugement : sinon vingt questions a six joueurs font cent vingt
 * arbitrages a la main, et la correction devient une corvee.
 *
 * Toutes les fonctions rendent une fraction entre 0 et 1, que l'appelant
 * multiplie par la valeur de la question.
 */

import { areClose, normalizeAnswer } from './similarity'

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Reponse ecrite : juste si elle rejoint l'une des variantes acceptees.
 *
 * Une question a rarement une seule formulation valable : « Leonard de
 * Vinci », « De Vinci » et « Vinci » designent la meme personne. On liste
 * donc les variantes, et le rapprochement tolere fautes de frappe et
 * accents. L'hote garde le dernier mot sur ce que la machine n'a pas su
 * reconnaitre.
 */
export function scoreWritten(given: string, accepted: string[]): number {
  const answer = normalizeAnswer(given)
  if (answer.length === 0) return 0
  return accepted.some((variant) => areClose(answer, normalizeAnswer(variant)))
    ? 1
    : 0
}

/**
 * « Citez N » : une fraction par bonne reponse distincte.
 *
 * Les doublons ne comptent qu'une fois : citer quatre fois l'Australie ne
 * vaut pas quatre pays. En donner plus que demande ne rapporte rien de
 * plus : on ne recompense pas l'arrosage.
 */
export function scoreList(
  given: string[],
  accepted: string[],
  needed: number,
): number {
  if (needed <= 0) return 0

  const found = new Set<string>()

  for (const raw of given) {
    const answer = normalizeAnswer(raw)
    if (answer.length === 0) continue

    const match = accepted.find((variant) => areClose(answer, normalizeAnswer(variant)))
    if (match) found.add(normalizeAnswer(match))
  }

  return clamp01(found.size / needed)
}

/**
 * Estimation : l'ecart relatif decide de la fraction obtenue.
 *
 * Degressif et non binaire : sur « combien d'habitants ? », rater de 5 %
 * n'est pas la meme chose que rater de mille pour cent, et une note tout ou
 * rien rendrait la forme frustrante au point qu'on ne la rejoue pas.
 */
export function scoreEstimate(given: number, expected: number): number {
  if (!Number.isFinite(given) || !Number.isFinite(expected)) return 0
  if (expected === 0) return given === 0 ? 1 : 0

  const error = Math.abs(given - expected) / Math.abs(expected)
  if (error <= 0.02) return 1
  // Au-dela du double ou de la moitie, la reponse n'apprend plus rien.
  if (error >= 1) return 0
  return clamp01(1 - error)
}

/**
 * Classement : on compte les paires dans le bon ordre relatif.
 *
 * Le tout ou rien serait absurde ici : avoir quatre films sur cinq bien
 * places doit rapporter beaucoup plus que zero. La distance de Kendall
 * normalisee mesure exactement cela : la proportion de couples dont l'ordre
 * est respecte.
 */
export function scoreRanking(given: string[], expected: string[]): number {
  const positions = new Map(expected.map((item, index) => [item, index]))
  const ranked = given.filter((item) => positions.has(item))
  if (ranked.length < 2) return ranked.length === expected.length ? 1 : 0

  let correct = 0
  let total = 0

  for (let i = 0; i < ranked.length; i++) {
    for (let j = i + 1; j < ranked.length; j++) {
      total++
      const a = positions.get(ranked[i] ?? '')
      const b = positions.get(ranked[j] ?? '')
      if (a !== undefined && b !== undefined && a < b) correct++
    }
  }

  const pairs = total === 0 ? 0 : correct / total
  // Une reponse incomplete ne peut pas valoir une reponse complete, meme
  // si le peu qui est place l'est bien.
  return clamp01(pairs * (ranked.length / expected.length))
}

export interface LatLng {
  lat: number
  lng: number
}

const EARTH_RADIUS_KM = 6371

/** Distance orthodromique, en kilometres. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Carte : degressif a la distance, nul au-dela du rayon.
 *
 * Le rayon depend de l'echelle de la question : reconnaitre un pays tolere
 * bien plus d'erreur que placer une rue.
 */
export function scoreDistance(given: LatLng, expected: LatLng, maxKm: number): number {
  if (maxKm <= 0) return 0
  return clamp01(1 - distanceKm(given, expected) / maxKm)
}

/**
 * Frise : on place un evenement entre deux reperes deja dates.
 *
 * Le voisin immediat rapporte une part : viser le bon siecle et se tromper
 * d'un cran n'est pas la meme erreur que placer la Revolution avant les
 * pyramides, et une note tout ou rien confondait les deux.
 */
const NEIGHBOUR_CREDIT = 0.35

export function scoreTimeline(
  given: number,
  expected: number,
  slots: number,
): number {
  if (!Number.isFinite(given) || given < 0 || given >= slots) return 0
  const gap = Math.abs(Math.round(given) - expected)
  if (gap === 0) return 1
  if (gap === 1) return NEIGHBOUR_CREDIT
  return 0
}

/** Association : une fraction des paires justes, sans notion d'ordre. */
export function scorePairs(
  given: Record<string, string>,
  expected: Record<string, string>,
): number {
  const keys = Object.keys(expected)
  if (keys.length === 0) return 0

  const correct = keys.filter((key) => given[key] === expected[key]).length
  return clamp01(correct / keys.length)
}

/** Intrus : une seule bonne reponse, donc tout ou rien. */
export function scoreOddOneOut(given: string, expected: string): number {
  return given === expected ? 1 : 0
}
