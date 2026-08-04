export interface Recording {
  blob: Blob
  mimeType: string
  durationMs: number
}

export interface RecorderHandle {
  stop: () => Promise<Recording>
  cancel: () => void
}

export interface MicrophoneHandle {
  /** Flux ouvert, utilisable pour mesurer le niveau avant meme d'enregistrer. */
  stream: MediaStream
  /** Demarre la capture. Le flux est deja chaud a cet instant. */
  record: () => RecorderHandle
  /** Rend le micro sans avoir enregistre. */
  close: () => void
}

/** Chrome et Firefox produisent du webm/opus, Safari du mp4/aac. */
const PREFERRED = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/ogg;codecs=opus',
]

export function pickMimeType(
  isSupported: (type: string) => boolean = (type) =>
    typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type),
): string {
  return PREFERRED.find(isSupported) ?? ''
}

/**
 * Ouvre le micro sans encore enregistrer.
 *
 * C'est cette separation qui compte. Un flux audio n'est pas exploitable a
 * l'instant ou le navigateur le rend : la chaine de traitement met des
 * centaines de millisecondes a se stabiliser, et les premiers echantillons
 * sortent quasi muets. Ouvrir le micro au moment de capturer revient donc a
 * perdre le debut de chaque prise — invisible sur une longue replique,
 * fatal sur une replique d'une seconde.
 *
 * On ouvre pendant le decompte, et on capture une fois le flux chaud.
 */
export async function openMicrophone(): Promise<MicrophoneHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      // Les trois traitements sont desactives a dessein. Ils sont concus
      // pour la visioconference, pas pour le doublage : la correction de
      // gain met une seconde a trouver son niveau, et la reduction de bruit
      // prend une attaque douce pour du souffle et la supprime. Il n'y a par
      // ailleurs rien a annuler, la video est muette pendant la prise.
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  })

  function releaseMicrophone() {
    for (const track of stream.getTracks()) track.stop()
  }

  return {
    stream,
    close: releaseMicrophone,
    record() {
      const mimeType = pickMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      const chunks: Blob[] = []
      let startedAt = performance.now()

      recorder.addEventListener('start', () => {
        startedAt = performance.now()
      })
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      })

      recorder.start()

      return {
        cancel() {
          if (recorder.state !== 'inactive') recorder.stop()
          releaseMicrophone()
        },
        stop() {
          return new Promise<Recording>((resolve) => {
            recorder.addEventListener(
              'stop',
              () => {
                const stoppedAt = performance.now()
                releaseMicrophone()
                resolve({
                  blob: new Blob(chunks, { type: recorder.mimeType || mimeType }),
                  mimeType: recorder.mimeType || mimeType || 'audio/webm',
                  durationMs: Math.round(stoppedAt - startedAt),
                })
              },
              { once: true },
            )
            if (recorder.state !== 'inactive') recorder.stop()
          })
        },
      }
    },
  }
}

/**
 * Niveau d'entree instantane, entre 0 et 1.
 *
 * Il ne decore pas : il repond a la seule question qu'on se pose quand une
 * prise sort muette — est-ce que le micro capte quelque chose ?
 */
export function meterFor(stream: MediaStream): {
  read: () => number
  close: () => void
} {
  const context = new AudioContext()
  const analyser = context.createAnalyser()
  analyser.fftSize = 1024
  context.createMediaStreamSource(stream).connect(analyser)

  const samples = new Float32Array(analyser.fftSize)

  return {
    read() {
      analyser.getFloatTimeDomainData(samples)
      let peak = 0
      for (const sample of samples) {
        const value = Math.abs(sample)
        if (value > peak) peak = value
      }
      return Math.min(1, peak)
    },
    close() {
      void context.close()
    },
  }
}
