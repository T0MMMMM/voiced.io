/**
 * Decoupage de la bande originale en repliques.
 *
 * Le probleme qu'on resout : arreter un enregistrement pile a la fin d'une
 * phrase demande un reflexe que personne n'a. On coupe toujours trop tot ou
 * trop tard, et il faut recommencer.
 *
 * Or l'information est deja la. Le spectre dit ou sont les silences, donc
 * ou commencent et finissent les repliques. On n'a jamais besoin de
 * demander a quelqu'un d'appuyer au bon moment : on connait le bon moment.
 */

export interface Segment {
  index: number
  start: number
  end: number
}

export interface SegmentOptions {
  /** En dessous, on considere qu'il ne se passe rien. */
  threshold: number
  /** Duree minimale d'un blanc pour qu'il separe deux repliques. */
  minSilenceSec: number
  /** En deca, ce n'est pas une replique mais un bruit. */
  minSpeechSec: number
  /**
   * Marge ajoutee de chaque cote. Une detection au ras coupe les attaques
   * douces et les fins de mot qui s'eteignent — mieux vaut mordre un peu
   * sur le silence.
   */
  padSec: number
}

export const DEFAULT_SEGMENT_OPTIONS: SegmentOptions = {
  threshold: 0.12,
  minSilenceSec: 0.28,
  minSpeechSec: 0.35,
  padSec: 0.12,
}

/**
 * Repere les repliques dans un spectre normalise.
 *
 * `peaks` couvre la duree entiere du clip, une valeur par tranche egale.
 */
export function findSegments(
  peaks: number[],
  duration: number,
  options: Partial<SegmentOptions> = {},
): Segment[] {
  const { threshold, minSilenceSec, minSpeechSec, padSec } = {
    ...DEFAULT_SEGMENT_OPTIONS,
    ...options,
  }

  if (peaks.length === 0 || duration <= 0) return []

  const bucketSec = duration / peaks.length
  const loud = peaks.map((peak) => peak >= threshold)

  // Premier passage : les plages continues au-dessus du seuil.
  const runs: { from: number; to: number }[] = []
  let start: number | null = null

  for (let i = 0; i < loud.length; i++) {
    if (loud[i] && start === null) start = i
    if (!loud[i] && start !== null) {
      runs.push({ from: start, to: i })
      start = null
    }
  }
  if (start !== null) runs.push({ from: start, to: loud.length })

  // Deuxieme passage : on recolle ce que separe un blanc trop court. Une
  // respiration au milieu d'une phrase ne doit pas la couper en deux.
  const merged: { from: number; to: number }[] = []
  for (const run of runs) {
    const previous = merged.at(-1)
    if (previous && (run.from - previous.to) * bucketSec < minSilenceSec) {
      previous.to = run.to
    } else {
      merged.push({ ...run })
    }
  }

  return merged
    .map(({ from, to }) => ({
      start: Math.max(0, from * bucketSec - padSec),
      end: Math.min(duration, to * bucketSec + padSec),
    }))
    .filter((segment) => segment.end - segment.start >= minSpeechSec)
    .map((segment, index) => ({ index, ...segment }))
}

/**
 * La replique a doubler depuis l'instant `time` : celle en cours si on est
 * dedans, sinon la suivante. Rien si la scene est finie.
 */
export function segmentFrom(segments: Segment[], time: number): Segment | null {
  return (
    segments.find((segment) => time < segment.end) ?? null
  )
}

/** L'instant ou commencer pour attaquer proprement la replique `segment`. */
export function cueFor(segment: Segment, leadInSec = 1.2): number {
  return Math.max(0, segment.start - leadInSec)
}
