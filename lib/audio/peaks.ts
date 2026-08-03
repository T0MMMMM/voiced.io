/**
 * Le spectre n'est pas une decoration : la video est muette pendant
 * l'enregistrement, donc la forme d'onde est la SEULE information de
 * timing dont disposent les joueurs. C'est une partition.
 */

/**
 * Reduit un signal a N valeurs normalisees entre 0 et 1.
 *
 * On prend le maximum absolu par tranche, pas la moyenne : une moyenne
 * ecrase les attaques, et ce sont precisement les attaques qui disent
 * quand quelqu'un se met a parler.
 */
export function bucketPeaks(samples: Float32Array, buckets: number): number[] {
  if (buckets <= 0 || samples.length === 0) return []

  const size = samples.length / buckets
  const peaks = new Array<number>(buckets)
  let loudest = 0

  for (let bucket = 0; bucket < buckets; bucket++) {
    const from = Math.floor(bucket * size)
    const to = Math.min(Math.floor((bucket + 1) * size), samples.length)

    let peak = 0
    for (let i = from; i < to; i++) {
      const value = Math.abs(samples[i] ?? 0)
      if (value > peak) peak = value
    }

    peaks[bucket] = peak
    if (peak > loudest) loudest = peak
  }

  // Normalisation sur le maximum du clip : un extrait enregistre bas
  // doit remplir la partition autant qu'un extrait fort.
  if (loudest === 0) return peaks
  return peaks.map((peak) => peak / loudest)
}

export const PEAK_BUCKETS = 900

/**
 * Decode la piste audio du clip et en tire la partition.
 *
 * Chrome et Safari decodent l'audio d'un MP4 sans probleme ; Firefox est
 * plus capricieux. L'appelant doit donc prevoir le cas d'echec plutot que
 * de supposer que la partition existe toujours.
 */
export async function extractPeaks(
  url: string,
  buckets: number = PEAK_BUCKETS,
): Promise<number[]> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Clip inaccessible')

  const encoded = await response.arrayBuffer()
  const context = new AudioContext()

  try {
    const decoded = await context.decodeAudioData(encoded)
    return bucketPeaks(decoded.getChannelData(0), buckets)
  } finally {
    void context.close()
  }
}
