export interface Recording {
  blob: Blob
  mimeType: string
  durationMs: number
  /**
   * Delai entre la demande d'enregistrement et le premier echantillon reel.
   * MediaRecorder ne demarre pas a l'instant ou on l'appelle : selon la
   * machine, 50 a 150 ms passent avant la premiere capture. Non corrige,
   * tout le doublage sonne en retard sans qu'on comprenne pourquoi.
   */
  latencyMs: number
}

export interface RecorderHandle {
  stop: () => Promise<Recording>
  cancel: () => void
  stream: MediaStream
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

export async function startRecording(): Promise<RecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  })

  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  const chunks: Blob[] = []

  const requestedAt = performance.now()
  let startedAt = requestedAt

  recorder.addEventListener('start', () => {
    startedAt = performance.now()
  })
  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  })

  recorder.start()

  function releaseMicrophone() {
    for (const track of stream.getTracks()) track.stop()
  }

  return {
    stream,
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
              latencyMs: Math.round(startedAt - requestedAt),
            })
          },
          { once: true },
        )
        if (recorder.state !== 'inactive') recorder.stop()
      })
    },
  }
}
