'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Score, type ScoreHandle } from '@/components/dub/Score'
import { Transport } from '@/components/dub/Transport'
import { TakeLane, type LocalTake } from '@/components/dub/TakeLane'
import { VideoStage, type VideoStageHandle } from '@/components/video/VideoStage'
import { extractPeaks } from '@/lib/audio/peaks'
import { startRecording, type RecorderHandle } from '@/lib/audio/recorder'
import { clamp } from '@/lib/utils/time'

export interface DubStageProps {
  videoUrl: string
  durationSec: number
  aspectRatio: number
  nickname: string
}

export function DubStage({
  videoUrl,
  durationSec,
  aspectRatio,
  nickname,
}: DubStageProps) {
  const stage = useRef<VideoStageHandle>(null)
  const score = useRef<ScoreHandle>(null)
  const recorder = useRef<RecorderHandle | null>(null)
  const recordedFrom = useRef(0)
  const clock = useRef(0)

  const [peaks, setPeaks] = useState<number[]>([])
  const [peaksError, setPeaksError] = useState(false)
  const [takes, setTakes] = useState<LocalTake[]>([])
  const [playing, setPlaying] = useState(false)
  const [recording, setRecording] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    extractPeaks(videoUrl)
      .then((result) => {
        if (!cancelled) setPeaks(result)
      })
      .catch(() => {
        if (!cancelled) setPeaksError(true)
      })
    return () => {
      cancelled = true
    }
  }, [videoUrl])

  // Le temps ne passe pas par l'état React : soixante rendus par seconde
  // pour déplacer un trait serait absurde. La partition se met à jour
  // directement, et seul le compteur d'enregistrement suit React.
  const handleTime = useCallback((time: number) => {
    clock.current = time
    score.current?.setTime(time)
  }, [])

  const skip = useCallback(
    (seconds: number) => {
      stage.current?.seek(clamp(clock.current + seconds, 0, durationSec))
    },
    [durationSec],
  )

  const stopRecording = useCallback(async () => {
    const handle = recorder.current
    if (!handle) return
    recorder.current = null

    stage.current?.pause()
    const result = await handle.stop()
    setRecording(false)

    // La latence de MediaRecorder décale la prise : elle a commencé un peu
    // après le début de la lecture, donc on ancre plus loin dans le clip.
    const startSec = recordedFrom.current + result.latencyMs / 1000

    setTakes((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        author: nickname,
        startSec,
        durationMs: result.durationMs,
        url: URL.createObjectURL(result.blob),
      },
    ])
  }, [nickname])

  const beginRecording = useCallback(async () => {
    setError(null)
    try {
      recordedFrom.current = clock.current
      const handle = await startRecording()
      recorder.current = handle
      setRecording(true)
      setElapsedMs(0)
      // La vidéo repart muette : sinon le micro reprend la bande originale.
      stage.current?.playMuted(clock.current)
    } catch {
      setError(
        'Micro inaccessible. Autorisez-le dans votre navigateur, puis réessayez.',
      )
    }
  }, [])

  const toggleRecord = useCallback(() => {
    if (recording) void stopRecording()
    else void beginRecording()
  }, [recording, stopRecording, beginRecording])

  // Compteur d'enregistrement, une fois par dixième de seconde : plus
  // fréquent ne se lit pas, moins fréquent paraît figé.
  useEffect(() => {
    if (!recording) return
    const startedAt = performance.now()
    const timer = window.setInterval(
      () => setElapsedMs(performance.now() - startedAt),
      100,
    )
    return () => window.clearInterval(timer)
  }, [recording])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable]')) return

      const step = event.shiftKey ? 0.5 : 2

      switch (event.code) {
        case 'Space':
          event.preventDefault()
          if (!recording) stage.current?.toggle()
          break
        case 'KeyR':
          event.preventDefault()
          toggleRecord()
          break
        case 'ArrowLeft':
          event.preventDefault()
          if (!recording) skip(-step)
          break
        case 'ArrowRight':
          event.preventDefault()
          if (!recording) skip(step)
          break
        case 'Home':
          event.preventDefault()
          if (!recording) stage.current?.seek(0)
          break
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [recording, skip, toggleRecord])

  return (
    <div className="space-y-8">
      <VideoStage
        ref={stage}
        src={videoUrl}
        onTime={handleTime}
        onPlayingChange={setPlaying}
        aspectRatio={aspectRatio}
      />

      <section aria-label="Partition de la bande originale" className="space-y-2.5">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow text-faint">Bande originale</span>
          <span className="eyebrow text-faint">
            {peaksError
              ? 'Spectre indisponible sur ce navigateur'
              : peaks.length === 0
                ? 'Lecture du spectre…'
                : 'La zone claire annonce ce qui arrive'}
          </span>
        </div>

        <Score
          ref={score}
          peaks={peaks}
          duration={durationSec}
          recording={recording}
          onSeek={(time) => !recording && stage.current?.seek(time)}
        />

        <TakeLane takes={takes} duration={durationSec} />
      </section>

      <Transport
        playing={playing}
        recording={recording}
        blockedBy={null}
        elapsedMs={elapsedMs}
        onPlayPause={() => stage.current?.toggle()}
        onRecord={toggleRecord}
        onRestart={() => stage.current?.seek(0)}
        onSkip={skip}
      />

      {error && (
        <p role="alert" className="text-rec text-center text-[15px]">
          {error}
        </p>
      )}
    </div>
  )
}
