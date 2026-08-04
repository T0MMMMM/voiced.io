/**
 * Lecture du resultat : la video en muet, et toutes les prises declenchees
 * a leur place.
 *
 * On ne fabrique jamais de fichier. Ecouter un doublage complet, c'est
 * planifier des sources audio aux bons instants — instantane, gratuit, et
 * refaire une prise ne demande aucun recalcul.
 */

export interface Track {
  id: string
  startSec: number
  durationSec: number
  /** Correction de latence mesuree a l'enregistrement, en millisecondes. */
  offsetMs?: number
}

export interface Cue {
  id: string
  /** Delai avant declenchement, en secondes. Zero = tout de suite. */
  delaySec: number
  /** Point d'entree dans la prise : elle a deja commence avant `fromSec`. */
  seekSec: number
}

/**
 * Ce qu'il faut declencher, et quand, pour une lecture demarrant a `fromSec`.
 *
 * Trois cas : la prise est deja finie — on l'ignore ; elle est en cours — on
 * la demarre aussitot mais en plein milieu ; elle arrive — on la programme.
 */
export function cuesFor(tracks: Track[], fromSec: number): Cue[] {
  const cues: Cue[] = []

  for (const track of tracks) {
    const start = track.startSec + (track.offsetMs ?? 0) / 1000
    const end = start + track.durationSec

    if (end <= fromSec) continue

    if (start >= fromSec) {
      cues.push({ id: track.id, delaySec: start - fromSec, seekSec: 0 })
    } else {
      cues.push({ id: track.id, delaySec: 0, seekSec: fromSec - start })
    }
  }

  return cues.sort((a, b) => a.delaySec - b.delaySec)
}

export interface LoadedTrack extends Track {
  buffer: AudioBuffer
}

/**
 * Planifie les prises sur l'horloge de l'AudioContext plutot que sur des
 * minuteurs JavaScript : un `setTimeout` derive de plusieurs dizaines de
 * millisecondes, ce qui s'entend immediatement sur une voix posee sur une
 * image.
 */
export class DubMixer {
  private context: AudioContext | null = null
  private sources: AudioBufferSourceNode[] = []
  private gain: GainNode | null = null
  private loaded: LoadedTrack[] = []

  async load(
    tracks: (Track & { url: string })[],
    fetcher: typeof fetch = fetch,
  ): Promise<void> {
    this.dispose()
    if (tracks.length === 0) return

    const context = new AudioContext()
    this.context = context
    this.gain = context.createGain()
    this.gain.connect(context.destination)

    type Decoded = LoadedTrack & { url: string }

    const decoded: (Decoded | null)[] = await Promise.all(
      tracks.map(async (track) => {
        try {
          const response = await fetcher(track.url)
          const buffer = await context.decodeAudioData(await response.arrayBuffer())
          return { ...track, buffer }
        } catch {
          // Une prise illisible ne doit pas empecher d'entendre les autres.
          return null
        }
      }),
    )

    this.loaded = decoded.filter((track): track is Decoded => track !== null)
  }

  get ready(): boolean {
    return this.loaded.length > 0
  }

  async start(fromSec: number): Promise<void> {
    const context = this.context
    const gain = this.gain
    if (!context || !gain) return

    this.stop()

    // Un AudioContext cree hors d'un geste utilisateur demarre suspendu, et
    // son horloge n'avance pas. Programmer avant la reprise reviendrait a
    // caler toutes les prises sur un temps qui ne s'ecoule pas.
    if (context.state === 'suspended') await context.resume()

    const now = context.currentTime
    const byId = new Map(this.loaded.map((track) => [track.id, track]))

    for (const cue of cuesFor(this.loaded, fromSec)) {
      const track = byId.get(cue.id)
      if (!track) continue

      const source = context.createBufferSource()
      source.buffer = track.buffer
      source.connect(gain)
      // La duree declaree fait foi : le fichier deborde toujours un peu du
      // segment, on ne joue pas cette queue.
      source.start(now + cue.delaySec, cue.seekSec, track.durationSec - cue.seekSec)
      this.sources.push(source)
    }
  }

  stop(): void {
    for (const source of this.sources) {
      try {
        source.stop()
      } catch {
        // Deja arretee : rien a faire.
      }
    }
    this.sources = []
  }

  dispose(): void {
    this.stop()
    void this.context?.close()
    this.context = null
    this.gain = null
    this.loaded = []
  }
}
