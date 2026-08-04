'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Countdown } from '@/components/dub/Countdown'
import { LiveClock, type LiveClockHandle } from '@/components/dub/LiveClock'
import { VolumeControl } from '@/components/dub/VolumeControl'
import { Score, type ScoreHandle } from '@/components/dub/Score'
import { SegmentList } from '@/components/dub/SegmentList'
import { Transport } from '@/components/dub/Transport'
import { Button, Panel } from '@/components/ui'
import { PlayIcon } from '@/components/ui/icons'
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
import { DubMixer } from '@/lib/audio/mixer'
import { bucketPeaks, extractPeaks } from '@/lib/audio/peaks'
import {
  meterFor,
  openMicrophone,
  type MicrophoneHandle,
  type RecorderHandle,
} from '@/lib/audio/recorder'
import { finishGame, setBreakpoints } from '@/lib/rooms/actions'
import {
  claimMicrophone,
  listTakes,
  releaseMicrophone,
  saveTake,
  type SavedTake,
} from '@/lib/takes/actions'
import type { Player, Room } from '@/lib/supabase/types'
import { clamp } from '@/lib/utils/time'

/**
 * Densite du spectre d'une prise, en tranches par seconde.
 *
 * Elle vise celle de la bande originale : un doublage dessine trois fois
 * plus fin que l'original se lirait comme une matiere differente, alors
 * qu'on veut justement comparer les deux traces.
 */
const TAKE_PEAKS_PER_SEC = 16

export interface DubGameProps {
  room: Room
  players: Player[]
  youId: string | null
  videoUrl: string
  durationSec: number
  aspectRatio: number
  initialTakes: SavedTake[]
}

/**
 * Spectre de la prise, limite a `durationSec`.
 *
 * L'arret n'est jamais instantane : la boucle du lecteur a une image de
 * retard et MediaRecorder met quelques dizaines de millisecondes a se
 * fermer. Le fichier depasse donc toujours un peu le segment. On ne
 * represente que la partie utile, sinon le trace deborde de sa zone.
 */
async function peaksOf(blob: Blob, durationSec: number): Promise<number[]> {
  try {
    const context = new AudioContext()
    try {
      const decoded = await context.decodeAudioData(await blob.arrayBuffer())
      const samples = decoded.getChannelData(0)
      const usable = Math.min(
        samples.length,
        Math.floor(durationSec * decoded.sampleRate),
      )
      return bucketPeaks(
        samples.subarray(0, usable),
        Math.max(8, Math.round(durationSec * TAKE_PEAKS_PER_SEC)),
      )
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
  /** Micro ouvert des l'appui sur R, pour qu'il chauffe pendant le decompte. */
  const microphone = useRef<MicrophoneHandle | null>(null)
  const clock = useRef(0)
  /** Segment vise par la prise en cours ; l'arret se fera a sa fin. */
  const target = useRef<Segment | null>(null)
  const stopRef = useRef<() => void>(() => {})
  const clockView = useRef<LiveClockHandle>(null)
  const mixer = useRef<DubMixer | null>(null)
  /** Filet de securite : si la boucle du lecteur s'interrompt, la prise s'arrete quand meme. */
  const guard = useRef<number | null>(null)
  /** Fin de l'ecoute en cours : au-dela, le melange se tait avec la video. */
  const reviewEnd = useRef(Number.POSITIVE_INFINITY)

  const [peaks, setPeaks] = useState<number[]>([])
  const [peaksError, setPeaksError] = useState(false)
  const [takes, setTakes] = useState<SavedTake[]>(initialTakes)
  const [playing, setPlaying] = useState(false)
  const [recording, setRecording] = useState(false)
  const [counting, setCounting] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [volume, setVolume] = useState(0.8)
  const [reviewing, setReviewing] = useState(false)
  const [level, setLevel] = useState(0)
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
    clockView.current?.setTime(time)
    setActiveIndex(segmentAt(segmentsRef.current, time)?.index ?? null)

    // On n'attend de personne qu'il appuie au bon moment : le segment finit,
    // l'enregistrement s'arrete.
    //
    // Le segment vise n'est PAS efface ici : c'est `stopRecording` qui en a
    // besoin pour ancrer la prise a son debut. L'effacer avant l'ancrait a
    // la position courante — c'est-a-dire a la fin du segment, ce qui
    // decalait tout le doublage d'une replique.
    if (target.current && recorder.current && time >= target.current.end) {
      stopRef.current()
    }

    // La video s'arrete d'elle-meme au bout du segment ; le melange des
    // voix, lui, tourne sur sa propre horloge et ne le saurait pas.
    if (time >= reviewEnd.current) {
      reviewEnd.current = Number.POSITIVE_INFINITY
      mixer.current?.stop()
      setReviewing(false)
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

  /**
   * Lecture bornee au segment courant.
   *
   * On travaille replique par replique : une lecture qui deborde oblige a
   * couper a la main, ce qui est precisement le geste dont tout le reste de
   * l'ecran cherche a nous dispenser.
   */
  const playSegment = useCallback(() => {
    if (playing) {
      mixer.current?.stop()
      reviewEnd.current = Number.POSITIVE_INFINITY
      setReviewing(false)
      stage.current?.pause()
      return
    }

    const segment = segmentAt(segmentsRef.current, clock.current)
    if (!segment) return
    // Relire depuis le debut du segment : on veut entendre la replique
    // entiere, pas sa fin.
    stage.current?.playRange(segment.start, segment.end)
  }, [playing])

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

    if (guard.current !== null) {
      window.clearTimeout(guard.current)
      guard.current = null
    }

    stage.current?.pause()
    const result = await handle.stop()
    microphone.current = null
    setRecording(false)

    try {
      // La prise ne peut pas durer plus que le segment vise : le
      // depassement n'est que le temps de fermeture du micro, et le laisser
      // ferait deborder le trace hors de sa zone.
      const cap = aim ? (aim.end - aim.start) * 1000 : result.durationMs
      const durationMs = Math.min(result.durationMs, cap)

      const form = new FormData()
      form.set('roomId', room.id)
      form.set('playerId', youId ?? '')
      // La capture demarre juste avant la video, a quelques millisecondes
      // pres : la prise s'ancre donc au debut du segment vise. L'ancienne
      // correction de latence ajoutait un decalage au lieu de le corriger,
      // le micro n'etant plus ouvert au dernier moment.
      form.set('startSec', String(aim?.start ?? clock.current))
      form.set('durationMs', String(durationMs))
      form.set('offsetMs', '0')
      const shape = await peaksOf(result.blob, durationMs / 1000)
      form.set('peaks', JSON.stringify(shape))
      form.set('audio', new File([result.blob], 'prise', { type: result.mimeType }))

      await saveTake(form)
      await refreshTakes()

      // Une prise muette part sans rien dire et ne se decouvre qu'a
      // l'ecoute finale, quand il est trop tard pour la refaire.
      if (shape.length > 0 && Math.max(...shape) < 0.04) {
        setError('Cette prise est silencieuse. Vérifiez le micro et refaites-la.')
      }
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
    const mic = microphone.current
    if (!aim || !mic) return

    try {
      recorder.current = mic.record()
      setRecording(true)
      setElapsedMs(0)
      stage.current?.playMuted(aim.start)

      // La boucle du lecteur declenche l'arret a la fin du segment. Ce
      // minuteur ne sert que si elle s'interrompt — onglet en arriere-plan,
      // lecture qui bute sur la fin du fichier — pour qu'un micro ne reste
      // jamais ouvert.
      guard.current = window.setTimeout(
        () => stopRef.current(),
        (aim.end - aim.start) * 1000 + 700,
      )
    } catch {
      target.current = null
      microphone.current?.close()
      microphone.current = null
      await releaseMicrophone(room.id)
      setError('L’enregistrement n’a pas pu démarrer.')
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
      setError(`${holderName} tient le micro. Attendez la fin de sa prise.`)
      return
    }

    try {
      // Le micro s'ouvre maintenant et chauffe pendant le decompte. C'est
      // toute la correction : ouvert au dernier moment, il ne capte rien
      // pendant ses premieres centaines de millisecondes.
      microphone.current = await openMicrophone()
    } catch {
      await releaseMicrophone(room.id)
      setError(
        'Micro inaccessible. Autorisez-le dans votre navigateur, puis réessayez.',
      )
      return
    }

    target.current = aim
    stage.current?.seek(aim.start)
    setCounting(true)
  }, [room.id, youId, holderName])

  /** Charge les prises une fois, puis les rejoue calees sur la video. */
  const playResult = useCallback(async () => {
    if (busy) return
    if (reviewing) {
      mixer.current?.stop()
      reviewEnd.current = Number.POSITIVE_INFINITY
      stage.current?.pause()
      setReviewing(false)
      return
    }

    setError(null)
    mixer.current ??= new DubMixer()
    const { loaded, total } = await mixer.current.load(
      takes.map((take) => ({
        id: take.id,
        url: take.url,
        startSec: take.startSec,
        durationSec: take.durationMs / 1000,
      })),
    )

    // Un silence total doit pouvoir s'expliquer, sinon on cherche du cote
    // du micro un probleme qui est du cote de la lecture.
    if (loaded === 0 && total > 0) {
      setError('Aucune prise n’a pu être lue. Rechargez la page et réessayez.')
      setReviewing(false)
      return
    }
    if (loaded < total) {
      setError(`${total - loaded} prise(s) sur ${total} n’ont pas pu être lues.`)
    }

    // On ecoute la replique en cours, pas toute la scene : c'est a cette
    // echelle qu'on juge un doublage et qu'on decide de le refaire.
    const segment = segmentAt(segmentsRef.current, clock.current)
    if (!segment) return

    setReviewing(true)
    reviewEnd.current = segment.end
    await mixer.current.start(segment.start)
    // La video part muette : on entend le doublage a la place des voix
    // d'origine, ce qui est tout l'objet de l'ecoute.
    stage.current?.playSilentRange(segment.start, segment.end)
  }, [busy, reviewing, takes])

  const toggleRecord = useCallback(() => {
    if (recording) void stopRecording()
    else if (!busy) void beginRecording()
  }, [recording, busy, stopRecording, beginRecording])

  // L'element video demarre a plein volume : sans cette mise a niveau,
  // la glissiere afficherait 80 % pendant que le son sort a 100 %.
  useEffect(() => {
    stage.current?.setVolume(volume)
    // Volontairement au montage seulement : ensuite c'est la glissiere qui pilote.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Verrou laisse par une session precedente : on arrive sur l'ecran en
   * tenant deja le micro alors qu'on n'enregistre rien. Sans cette remise a
   * zero, plus rien ne demarre et l'ecran n'offre aucun moyen de s'en
   * sortir.
   */
  useEffect(() => {
    if (room.recording_by === youId && youId) {
      void releaseMicrophone(room.id)
    }
    // Au montage seulement : ensuite le verrou est pilote par les prises.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => mixer.current?.dispose(), [])

  useEffect(() => {
    const stream = microphone.current?.stream
    if ((!counting && !recording) || !stream) {
      setLevel(0)
      return
    }

    const meter = meterFor(stream)
    const timer = window.setInterval(() => setLevel(meter.read()), 80)
    return () => {
      window.clearInterval(timer)
      meter.close()
    }
  }, [counting, recording])

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
          if (!busy) playSegment()
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
        case 'KeyL':
          event.preventDefault()
          void playResult()
          break
        case 'Home':
          event.preventDefault()
          if (!busy) stage.current?.seek(0)
          break
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, dropBreakpoint, goToSegment, toggleRecord, playResult, playSegment])

  return (
    <div className="space-y-8">
      <div className="relative">
        <VideoStage
          ref={stage}
          src={videoUrl}
          onTime={handleTime}
          onPlayingChange={setPlaying}
          onEnded={() => {
            stopRef.current()
            mixer.current?.stop()
            setReviewing(false)
          }}
          aspectRatio={aspectRatio}
        />
        {counting && <Countdown onDone={() => void armRecorder()} level={level} />}
        {!counting && !recording && (
          <VolumeControl
            value={volume}
            onChange={(next) => {
              setVolume(next)
              stage.current?.setVolume(next)
            }}
          />
        )}
      </div>

      <section aria-label="Partition de la bande originale" className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-3">
            <span className="eyebrow text-faint">Cinq secondes à venir</span>
            <LiveClock ref={clockView} duration={durationSec} />
          </span>
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
        level={level}
        onPlayPause={playSegment}
        onRecord={toggleRecord}
        onRestart={() => stage.current?.seek(0)}
        reviewing={reviewing}
        canReview={takes.length > 0}
        onReview={() => void playResult()}
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

      {takes.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <Button
            size="lg"
            disabled={busy}
            className="gap-2.5"
            onClick={() => void finishGame(room.id)}
          >
            <PlayIcon />
            Terminer et écouter à plusieurs
          </Button>
          <p className="text-faint text-[13px]">
            Tout le monde bascule sur le résultat en même temps.
          </p>
        </div>
      )}
    </div>
  )
}
