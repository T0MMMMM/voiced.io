import { clamp } from '@/lib/utils/time'

/**
 * Le decoupage est non destructif : on ne touche jamais au fichier video.
 * Un marqueur est un simple instant, et les scenes s'en deduisent. Poser
 * huit coupes coute huit nombres et zero seconde de calcul.
 *
 * Les marqueurs sont des points de coupe *interieurs* : les bords du clip
 * n'en sont pas. N marqueurs donnent donc N + 1 scenes.
 */

/** En dessous, une scene est trop courte pour qu'on y double quoi que ce soit. */
export const MIN_SCENE_SEC = 0.5

/** Au-dela, la partie devient interminable bien avant d'etre finie. */
export const MAX_SCENES = 30

export interface Scene {
  index: number
  start: number
  end: number
}

function normalize(markers: number[]): number[] {
  return [...new Set(markers)].sort((a, b) => a - b)
}

export function markersToScenes(markers: number[], duration: number): Scene[] {
  const bounds = [0, ...normalize(markers), duration]

  return bounds.slice(0, -1).map((start, index) => ({
    index,
    start,
    end: bounds[index + 1] ?? duration,
  }))
}

export function canAddMarker(
  markers: number[],
  at: number,
  duration: number,
): boolean {
  if (!Number.isFinite(at)) return false
  if (at <= 0 || at >= duration) return false
  if (markers.length + 1 >= MAX_SCENES) return false

  // Les bords du clip comptent comme des voisins : une coupe posee juste
  // apres le debut produirait une premiere scene inexploitable.
  const neighbours = [0, ...normalize(markers), duration]
  return neighbours.every(
    (neighbour) => Math.abs(at - neighbour) >= MIN_SCENE_SEC,
  )
}

export function addMarker(
  markers: number[],
  at: number,
  duration: number,
): number[] {
  if (!canAddMarker(markers, at, duration)) return markers
  return normalize([...markers, at])
}

export function removeMarker(markers: number[], index: number): number[] {
  if (index < 0 || index >= markers.length) return markers
  return markers.filter((_, i) => i !== index)
}

/**
 * Deplace un marqueur en le retenant entre ses voisins immediats. On borne
 * plutot que de refuser : pendant un glisser, un refus fige le marqueur
 * sous le curseur et donne l'impression d'un bug.
 */
export function moveMarker(
  markers: number[],
  index: number,
  to: number,
  duration: number,
): number[] {
  if (index < 0 || index >= markers.length) return markers

  const previous = markers[index - 1] ?? 0
  const next = markers[index + 1] ?? duration

  const lower = previous + MIN_SCENE_SEC
  const upper = next - MIN_SCENE_SEC
  if (lower > upper) return markers

  const moved = [...markers]
  moved[index] = clamp(to, lower, upper)
  return moved
}
