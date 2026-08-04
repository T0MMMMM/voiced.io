import { clamp } from '@/lib/utils/time'

/**
 * Decoupage de la scene en segments, pose a la main.
 *
 * La detection automatique par les silences a ete essayee puis abandonnee :
 * dans une conversation, elle coupe au milieu d'un echange ou recolle deux
 * repliques, la ou l'oreille tranche sans hesiter. On ecoute donc, et on
 * pose un point quand une replique se termine.
 *
 * Un point de coupe est un instant, jamais un fichier : N points donnent
 * N+1 segments, et l'audio n'est ni decoupe ni recopie.
 */

/** En deca, un segment est trop court pour qu'on y double quoi que ce soit. */
export const MIN_SEGMENT_SEC = 0.4

export interface Segment {
  index: number
  start: number
  end: number
}

function normalize(points: number[]): number[] {
  return [...new Set(points.map((point) => Number(point.toFixed(3))))].sort(
    (a, b) => a - b,
  )
}

export function segmentsFrom(points: number[], duration: number): Segment[] {
  if (duration <= 0) return []
  const bounds = [0, ...normalize(points), duration]

  return bounds.slice(0, -1).map((start, index) => ({
    index,
    start,
    end: bounds[index + 1] ?? duration,
  }))
}

export function canAddBreakpoint(
  points: number[],
  at: number,
  duration: number,
): boolean {
  if (!Number.isFinite(at) || at <= 0 || at >= duration) return false

  // Les bords du clip comptent comme voisins : un point pose juste apres le
  // debut produirait un premier segment inexploitable.
  return [0, ...normalize(points), duration].every(
    (neighbour) => Math.abs(at - neighbour) >= MIN_SEGMENT_SEC,
  )
}

export function addBreakpoint(
  points: number[],
  at: number,
  duration: number,
): number[] {
  if (!canAddBreakpoint(points, at, duration)) return points
  return normalize([...points, at])
}

export function removeBreakpoint(points: number[], index: number): number[] {
  if (index < 0 || index >= points.length) return points
  return points.filter((_, i) => i !== index)
}

/**
 * Deplace un point en le retenant entre ses voisins. On borne plutot que de
 * refuser : pendant un glisser, un refus fige le point sous le curseur et
 * donne l'impression d'un bug.
 */
export function moveBreakpoint(
  points: number[],
  index: number,
  to: number,
  duration: number,
): number[] {
  const sorted = normalize(points)
  if (index < 0 || index >= sorted.length) return sorted

  const lower = (sorted[index - 1] ?? 0) + MIN_SEGMENT_SEC
  const upper = (sorted[index + 1] ?? duration) - MIN_SEGMENT_SEC
  if (lower > upper) return sorted

  const moved = [...sorted]
  moved[index] = Number(clamp(to, lower, upper).toFixed(3))
  return moved
}

/** Le segment qui contient `time`, ou le dernier si on est au bout. */
export function segmentAt(segments: Segment[], time: number): Segment | null {
  if (segments.length === 0) return null
  return (
    segments.find((segment) => time >= segment.start && time < segment.end) ??
    segments.at(-1) ??
    null
  )
}

/** Le segment voisin dans la direction donnee, ou celui d'origine au bout. */
export function stepSegment(
  segments: Segment[],
  current: Segment | null,
  direction: 1 | -1,
): Segment | null {
  if (!current) return segments[0] ?? null
  return segments[clamp(current.index + direction, 0, segments.length - 1)] ?? current
}
