'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Countdown } from '@/components/dub/Countdown'
import { Score, type ScoreHandle } from '@/components/dub/Score'
import { SegmentList } from '@/components/dub/SegmentList'
import { Transport } from '@/components/dub/Transport'
import { Panel } from '@/components/ui'
import { VideoStage, type VideoStageHandle } from '@/components/video/VideoStage'
import {
  addBreakpoint,
  moveBreakpoint,
  removeBreakpoint,
  segmentAt,
  segmentsFrom,
  stepSegment,
  type Segment,
} from '@/lib/audio/breakpoints'
import { bucketPeaks, extractPeaks } from '@/lib/audio/peaks'
import { startRecording, type RecorderHandle } from '@/lib/audio/recorder'
import { setBreakpoints } from '@/lib/rooms/actions'
import {
  claimMicrophone,
  listTakes,
  releaseMicrophone,
  saveTake,
  type SavedTake,
} from '@/lib/takes/actions'
import type { Player, Room } from '@/lib/supabase/types'
import { clamp } from '@/lib/utils/time'

/** Resolution du spectre d'une prise : assez fine pour juger un decalage. */
const TAKE_PEAKS = 220

export interface DubGameProps {
  room: Room
  players: Player[]
  youId: string | null
  videoUrl: string
  durationSec: number
  aspectRatio: number
  initialTakes: SavedTake[]
}

/** Le spectre de la prise sert a la comparer a l'original, pas a la rejouer. */
async function peaksOf(blob: Blob): Promise<number[]> {
  try {
    const context = new AudioContext()
    try {
      const decoded = await context.decodeAudioData(await blob.arrayBuffer())
      return bucketPeaks(decoded.getChannelData(0), TAKE_PEAKS)
    } finally {
      void context.close()
    }
  } catch {
    // Certains navigateurs ne redecodent pas leur propre webm. On perd la
    // superposition, pas la prise.
    return []
  }
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
  const clock = useRef(0)
  /** Segment vise par la prise en cours ; l'arret se fera a sa fin. */
  const target = useRef<Segment | null>(null)
  const stopRef = useRef<() => void>(() => {})

  const [peaks, setPeaks] = useState<number[]>([])
  const [peaksError, setPeaksError] = useState(false)
  const [takes, setTakes] = useState<SavedTake[]>(initialTakes)
  const [playing, setPlaying] = useState(false)
  const [recording, setRecording] = useState(false)
  const [counting, setCounting] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Les points viennent du salon ; l'etat local ne sert qu'a repondre au
  // geste sans attendre l'aller-retour serveur.
  const stored = useMemo(
    () => (Array.isArray(room.breakpoints) ? (room.breakpoints as number[]) : []),
    [room.breakpoints],
  )
  const [points, setPoints] = useState<number[]>(stored)
  useEffect(() => setPoints(stored), [stored])

  const segments = useMemo(
    () => segmentsFrom(points, durationSec),
    [points, durationSec],
  )
  const segmentsRef = useRef<Segment[]>(segments)
  segmentsRef.current = segments

  const holder = room.recording_by
  const someoneElseRecords = holder !== null && holder !== youId
  const holderName =
    players.find((player) => player.id === holder)?.nickname ?? 'Quelqu’un'
  const busy = recording || counting || someoneElseRecords

  const dubTracks = useMemo(
    () =>
      takes
        .filter((take) => take.peaks.length > 0)
        .map((take) => ({
          startSec: take.startSec,
          durationSec: take.durationMs / 1000,
          peaks: take.peaks,
        })),
    [takes],
  )

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

  useEffect(() => {
    if (holder === null) void refreshTakes()
  }, [holder, refreshTakes])

  const handleTime = useCallback((time: number) => {
    clock.current = time
    score.current?.setTime(time)
    setActiveIndex(segmentAt(segmentsRef.current, time)?.index ?? null)

    // On n'attend de personne qu'il appuie au bon moment : le segment finit,
    // l'enregistrement s'arrete.
    const aim = target.current
    if (aim && recorder.current && time >= aim.end) {
      target.current = null
      stopRef.current()
    }
  }, [])

  const persist = useCallback(
    (next: number[]) => {
      setPoints(next)
      void setBreakpoints(room.id, next).catch(() =>
        setError('Découpage non enregistré.'),
      )
    },
    [room.id],
  )

  const dropBreakpoint = useCallback(() => {
    persist(addBreakpoint(points, clock.current, durationSec))
  }, [persist, points, durationSec])

  const goToSegment = useCallback((segment: Segment | null) => {
    if (!segment) return
    stage.current?.seek(segment.start)
    setActiveIndex(segment.index)
  }, [])

  const stopRecording = useCallback(async () => {
    const handle = recorder.current
    if (!handle) return
    recorder.current = null
    const aim = target.current
    target.current = null

    stage.current?.pause()
    const result = await handle.stop()
    setRecording(false)

    try {
      const form = new FormData()
      form.set('roomId', room.id)
      form.set('playerId', youId ?? '')
      // La latence de MediaRecorder decale la prise : elle a commence un peu
      // apres le debut de la lecture, donc on l'ancre plus loin.
      form.set(
        'startSec',
        String((aim?.start ?? clock.current) + result.latencyMs / 1000),
      )
      form.set('durationMs', String(result.durationMs))
      form.set('offsetMs', '0')
      form.set('peaks', JSON.stringify(await peaksOf(result.blob)))
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

  stopRef.current = () => void stopRecording()

  /** Le décompte fini, on lance vraiment : micro ouvert, vidéo muette. */
  const armRecorder = useCallback(async () => {
    setCounting(false)
    const aim = target.current
    if (!aim) return

    try {
      recorder.current = await startRecording()
      setRecording(true)
      setElapsedMs(0)
      stage.current?.playMuted(aim.start)
    } catch {
      target.current = null
      await releaseMicrophone(room.id)
      setError(
        'Micro inaccessible. Autorisez-le dans votre navigateur, puis réessayez.',
      )
    }
  }, [room.id])

  const beginRecording = useCallback(async () => {
    if (!youId) return
    setError(null)

    const aim = segmentAt(segmentsRef.current, clock.current)
    if (!aim) return

    // On prend le verrou AVANT le micro : demander l'autorisation puis
    // decouvrir que quelqu'un a demarre serait un micro ouvert pour rien.
    const claimed = await claimMicrophone(room.id, youId)
    if (!claimed) {
      setError('Quelqu’un vient de prendre le micro.')
      return
    }

    target.current = aim
    stage.current?.seek(aim.start)
    setCounting(true)
  }, [room.id, youId])

  const toggleRecord = useCallback(() => {
    if (recording) void stopRecording()
    else if (!busy) void beginRecording()
  }, [recording, busy, stopRecording, beginRecording])

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
    if (!recording && !counting) return
    const release = () => void releaseMicrophone(room.id)
    window.addEventListener('pagehide', release)
    return () => window.removeEventListener('pagehide', release)
  }, [recording, counting, room.id])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const focused = event.target as HTMLElement | null
      if (focused?.closest('input, textarea, [contenteditable]')) return

      switch (event.code) {
        case 'Space':
          event.preventDefault()
          if (!busy) stage.current?.toggle()
          break
        case 'KeyB':
          event.preventDefault()
          if (!busy) dropBreakpoint()
          break
        case 'KeyR':
          event.preventDefault()
          toggleRecord()
          break
        case 'ArrowLeft':
          event.preventDefault()
          if (!busy) {
            goToSegment(
              stepSegment(
                segmentsRef.current,
                segmentAt(segmentsRef.current, clock.current),
                -1,
              ),
            )
          }
          break
        case 'ArrowRight':
          event.preventDefault()
          if (!busy) {
            goToSegment(
              stepSegment(
                segmentsRef.current,
                segmentAt(segmentsRef.current, clock.current),
                1,
              ),
            )
          }
          break
        case 'Home':
          event.preventDefault()
          if (!busy) stage.current?.seek(0)
          break
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, dropBreakpoint, goToSegment, toggleRecord])

  return (
    <div className="space-y-8">
      <div className="relative">
        <VideoStage
          ref={stage}
          src={videoUrl}
          onTime={handleTime}
          onPlayingChange={setPlaying}
          aspectRatio={aspectRatio}
        />
        {counting && <Countdown onDone={() => void armRecorder()} />}
      </div>

      <section aria-label="Partition de la bande originale" className="space-y-2.5">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow text-faint">Cinq secondes à venir</span>
          <span className="eyebrow text-faint">
            {peaksError
              ? 'Spectre indisponible sur ce navigateur'
              : peaks.length === 0
                ? 'Lecture du spectre…'
                : `${segments.length} segment${segments.length > 1 ? 's' : ''}`}
          </span>
        </div>

        <Score
          ref={score}
          peaks={peaks}
          duration={durationSec}
          breakpoints={points}
          segments={segments}
          dubTracks={dubTracks}
          recording={recording}
          onSeek={(time) => !busy && stage.current?.seek(time)}
          onMoveBreakpoint={(index, time) =>
            setPoints((current) => moveBreakpoint(current, index, time, durationSec))
          }
          onCommitBreakpoints={() => persist(points)}
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
        onBreakpoint={dropBreakpoint}
        onStep={(direction) =>
          goToSegment(
            stepSegment(
              segmentsRef.current,
              segmentAt(segmentsRef.current, clock.current),
              direction,
            ),
          )
        }
      />

      <Panel>
        <h2 className="text-fg mb-2 text-[15px] font-medium">Découpage</h2>
        <SegmentList
          segments={segments}
          breakpoints={points}
          activeIndex={activeIndex}
          disabled={busy}
          onPreview={(segment) => {
            setActiveIndex(segment.index)
            stage.current?.playRange(segment.start, segment.end)
          }}
          onNudge={(index, delta) =>
            persist(
              moveBreakpoint(
                points,
                index,
                clamp((points[index] ?? 0) + delta, 0, durationSec),
                durationSec,
              ),
            )
          }
          onRemove={(index) => persist(removeBreakpoint(points, index))}
        />
      </Panel>

      {error && (
        <p role="alert" className="text-rec text-center text-[15px]">
          {error}
        </p>
      )}
    </div>
  )
}
