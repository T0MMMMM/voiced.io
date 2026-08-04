'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Score, type ScoreHandle } from '@/components/dub/Score'
import { TakeLane } from '@/components/dub/TakeLane'
import { Transport } from '@/components/dub/Transport'
import { VideoStage, type VideoStageHandle } from '@/components/video/VideoStage'
import { extractPeaks } from '@/lib/audio/peaks'
import { startRecording, type RecorderHandle } from '@/lib/audio/recorder'
import {
  claimMicrophone,
  listTakes,
  releaseMicrophone,
  saveTake,
  type SavedTake,
} from '@/lib/takes/actions'
import type { Player, Room } from '@/lib/supabase/types'
import { clamp } from '@/lib/utils/time'

export interface DubGameProps {
  room: Room
  players: Player[]
  youId: string | null
  videoUrl: string
  durationSec: number
  aspectRatio: number
  initialTakes: SavedTake[]
}

export function DubGame({
  room,
  players,
  youId,
  videoUrl,
  durationSec,
  aspectRatio,
  initialTakes,
}: DubGameProps) {
  const stage = useRef<VideoStageHandle>(null)
  const score = useRef<ScoreHandle>(null)
  const recorder = useRef<RecorderHandle | null>(null)
  const recordedFrom = useRef(0)
  const clock = useRef(0)

  const [peaks, setPeaks] = useState<number[]>([])
  const [peaksError, setPeaksError] = useState(false)
  const [takes, setTakes] = useState<SavedTake[]>(initialTakes)
  const [playing, setPlaying] = useState(false)
  const [recording, setRecording] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Le verrou vit en base : c'est lui, et non un etat local, qui dit qui
  // tient le micro. Tous les ecrans lisent la meme valeur.
  const holder = room.recording_by
  const someoneElseRecords = holder !== null && holder !== youId
  const holderName =
    players.find((player) => player.id === holder)?.nickname ?? 'Quelqu’un'

  useEffect(() => {
    let cancelled = false
    extractPeaks(videoUrl)
      .then((result) => !cancelled && setPeaks(result))
      .catch(() => !cancelled && setPeaksError(true))
    return () => {
      cancelled = true
    }
  }, [videoUrl])

  const refreshTakes = useCallback(async () => {
    setTakes(await listTakes(room.id))
  }, [room.id])

  // Une prise enregistree ailleurs apparait sur la ligne de temps sans
  // qu'on entende quoi que ce soit : on decouvre les voix a la fin.
  useEffect(() => {
    if (holder === null) void refreshTakes()
  }, [holder, refreshTakes])

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

    try {
      // La latence de MediaRecorder decale la prise : elle a commence un peu
      // apres le debut de la lecture, donc on l'ancre plus loin dans le clip.
      const form = new FormData()
      form.set('roomId', room.id)
      form.set('playerId', youId ?? '')
      form.set('startSec', String(recordedFrom.current + result.latencyMs / 1000))
      form.set('durationMs', String(result.durationMs))
      form.set('offsetMs', '0')
      form.set('audio', new File([result.blob], 'prise', { type: result.mimeType }))

      await saveTake(form)
      await refreshTakes()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Enregistrement non sauvegardé.',
      )
    } finally {
      await releaseMicrophone(room.id)
    }
  }, [room.id, youId, refreshTakes])

  const beginRecording = useCallback(async () => {
    if (!youId) return
    setError(null)

    // On prend le verrou AVANT le micro : demander l'autorisation puis
    // decouvrir que quelqu'un d'autre a demarre serait une seconde perdue
    // et un micro ouvert pour rien.
    const claimed = await claimMicrophone(room.id, youId)
    if (!claimed) {
      setError('Quelqu’un vient de prendre le micro.')
      return
    }

    try {
      recordedFrom.current = clock.current
      recorder.current = await startRecording()
      setRecording(true)
      setElapsedMs(0)
      // La video repart muette : sinon le micro reprend la bande originale.
      stage.current?.playMuted(clock.current)
    } catch {
      await releaseMicrophone(room.id)
      setError(
        'Micro inaccessible. Autorisez-le dans votre navigateur, puis réessayez.',
      )
    }
  }, [room.id, youId])

  const toggleRecord = useCallback(() => {
    if (recording) void stopRecording()
    else if (!someoneElseRecords) void beginRecording()
  }, [recording, someoneElseRecords, stopRecording, beginRecording])

  useEffect(() => {
    if (!recording) return
    const startedAt = performance.now()
    const timer = window.setInterval(
      () => setElapsedMs(performance.now() - startedAt),
      100,
    )
    return () => window.clearInterval(timer)
  }, [recording])

  // Fermer l'onglet en pleine prise laisserait le verrou pose pour tout le
  // monde : on le rend avant de partir.
  useEffect(() => {
    if (!recording) return
    const release = () => void releaseMicrophone(room.id)
    window.addEventListener('pagehide', release)
    return () => window.removeEventListener('pagehide', release)
  }, [recording, room.id])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable]')) return

      const step = event.shiftKey ? 0.5 : 2
      const busy = recording || someoneElseRecords

      switch (event.code) {
        case 'Space':
          event.preventDefault()
          if (!busy) stage.current?.toggle()
          break
        case 'KeyR':
          event.preventDefault()
          toggleRecord()
          break
        case 'ArrowLeft':
          event.preventDefault()
          if (!busy) skip(-step)
          break
        case 'ArrowRight':
          event.preventDefault()
          if (!busy) skip(step)
          break
        case 'Home':
          event.preventDefault()
          if (!busy) stage.current?.seek(0)
          break
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [recording, someoneElseRecords, skip, toggleRecord])

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
          recording={recording || someoneElseRecords}
          onSeek={(time) =>
            !recording && !someoneElseRecords && stage.current?.seek(time)
          }
        />

        <TakeLane
          takes={takes.map((take) => ({
            id: take.id,
            author: take.author,
            startSec: take.startSec,
            durationMs: take.durationMs,
            url: take.url,
          }))}
          duration={durationSec}
        />
      </section>

      <Transport
        playing={playing}
        recording={recording}
        blockedBy={someoneElseRecords ? holderName : null}
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
