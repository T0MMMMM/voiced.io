'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import type { Segment } from '@/lib/audio/breakpoints'
import { cn } from '@/lib/utils/cn'
import { clamp } from '@/lib/utils/time'

/** Ce qu'on voit devant soi. Au-dela, on ne lit plus, on contemple. */
export const WINDOW_SEC = 5

/** Distance de prise d'un point de coupe, en secondes. */
const GRAB_SEC = 0.18

export interface DubTrack {
  startSec: number
  durationSec: number
  peaks: number[]
}

export interface ScoreHandle {
  /** Fait defiler la partition sans repasser par React : 60 images par seconde. */
  setTime: (time: number) => void
}

export interface ScoreProps {
  peaks: number[]
  duration: number
  breakpoints: number[]
  segments: Segment[]
  dubTracks: DubTrack[]
  recording?: boolean
  onSeek: (time: number) => void
  onMoveBreakpoint: (index: number, time: number) => void
  onCommitBreakpoints: () => void
  className?: string
}

/**
 * La partition.
 *
 * Pendant l'enregistrement la video est muette et personne n'entend les
 * autres : cette forme d'onde est la seule information de timing qui reste.
 * Elle ne montre que les cinq secondes a venir, la tete de lecture calee a
 * gauche — on lit ce qui arrive, pas ce qui est passe.
 *
 * Trois couches, dans cet ordre :
 *   · la zone teintee — exactement ce qui sera enregistre
 *   · la bande originale, pleine
 *   · votre doublage par-dessus, en transparence : deux traces sur le meme
 *     axe se comparent d'un coup d'oeil, et un decalage se voit sans qu'on
 *     ait besoin de reecouter
 */
export const Score = forwardRef<ScoreHandle, ScoreProps>(function Score(
  {
    peaks,
    duration,
    breakpoints,
    segments,
    dubTracks,
    recording = false,
    onSeek,
    onMoveBreakpoint,
    onCommitBreakpoints,
    className,
  },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const timeRef = useRef(0)
  const dragRef = useRef<number | null>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return

    const { width, height } = sizeRef.current
    if (width === 0) return

    const context = canvas.getContext('2d')
    if (!context) return

    const styles = getComputedStyle(host)
    const color = (name: string) => styles.getPropertyValue(name).trim()

    const ratio = window.devicePixelRatio || 1
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, width, height)

    const from = timeRef.current
    const pxPerSec = width / WINDOW_SEC
    const at = (time: number) => (time - from) * pxPerSec
    const middle = height / 2

    // 1. Ce qui sera enregistre. La teinte ne decore pas : elle delimite.
    const current = segments.find(
      (segment) => from >= segment.start && from < segment.end,
    )
    if (current) {
      context.fillStyle = color('--accent-soft')
      const left = Math.max(0, at(current.start))
      context.fillRect(left, 0, Math.min(width, at(current.end)) - left, height)
    }

    // 2. Les points de coupe, sous les traces pour ne pas les hacher.
    context.fillStyle = color('--border-strong')
    for (const point of breakpoints) {
      const x = at(point)
      if (x < -2 || x > width + 2) continue
      context.fillRect(Math.round(x), 0, 1, height)
      context.beginPath()
      context.roundRect(Math.round(x) - 4, 0, 9, 7, 3)
      context.fill()
    }

    // 3. La bande originale.
    if (peaks.length > 0) {
      const bucketSec = duration / peaks.length
      const first = Math.max(0, Math.floor(from / bucketSec))
      const last = Math.min(peaks.length, Math.ceil((from + WINDOW_SEC) / bucketSec))
      const barWidth = Math.max(1.5, bucketSec * pxPerSec - 1)

      context.fillStyle = color('--wave-ref')
      for (let i = first; i < last; i++) {
        const barHeight = Math.max(2, (peaks[i] ?? 0) * (height - 12))
        context.beginPath()
        context.roundRect(
          at(i * bucketSec),
          middle - barHeight / 2,
          barWidth,
          barHeight,
          barWidth / 2,
        )
        context.fill()
      }
    }

    // 4. Le doublage par-dessus, meme axe et meme dessin que l'original mais
    //    en barres plus epaisses et translucides : c'est la superposition de
    //    deux traces de meme nature qui rend un decalage lisible d'un coup
    //    d'oeil. Un trace de forme differente se comparerait mal.
    context.globalAlpha = 0.7
    context.fillStyle = color('--wave-self')
    for (const track of dubTracks) {
      if (track.peaks.length === 0) continue
      if (track.startSec > from + WINDOW_SEC) continue
      if (track.startSec + track.durationSec < from) continue

      const bucketSec = track.durationSec / track.peaks.length
      const barWidth = Math.max(3, bucketSec * pxPerSec - 0.5)

      for (let i = 0; i < track.peaks.length; i++) {
        const x = at(track.startSec + i * bucketSec)
        if (x < -barWidth || x > width) continue
        const barHeight = Math.max(3, (track.peaks[i] ?? 0) * (height - 12))
        context.beginPath()
        context.roundRect(x, middle - barHeight / 2, barWidth, barHeight, barWidth / 2)
        context.fill()
      }
    }
    context.globalAlpha = 1
  }, [peaks, duration, breakpoints, segments, dubTracks])

  const measure = useCallback(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return

    const { width, height } = host.getBoundingClientRect()
    sizeRef.current = { width, height }

    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    draw()
  }, [draw])

  useEffect(() => {
    measure()
    const observer = new ResizeObserver(measure)
    if (hostRef.current) observer.observe(hostRef.current)

    // Le theme change les couleurs sans changer la taille.
    const themeObserver = new MutationObserver(draw)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => {
      observer.disconnect()
      themeObserver.disconnect()
    }
  }, [measure, draw])

  useImperativeHandle(ref, () => ({
    setTime(time) {
      timeRef.current = time
      draw()
    },
  }))

  function timeAt(clientX: number): number {
    const host = hostRef.current
    if (!host) return timeRef.current
    const rect = host.getBoundingClientRect()
    const offset = ((clientX - rect.left) / rect.width) * WINDOW_SEC
    return clamp(timeRef.current + offset, 0, duration)
  }

  function handleDown(event: React.PointerEvent) {
    if (recording) return
    const time = timeAt(event.clientX)

    // Attraper un point l'emporte sur deplacer la lecture : viser un trait
    // de deux pixels demande deja assez de precision.
    const index = breakpoints.findIndex(
      (point) => Math.abs(point - time) <= GRAB_SEC,
    )

    if (index >= 0) {
      dragRef.current = index
      event.currentTarget.setPointerCapture(event.pointerId)
    } else {
      onSeek(time)
    }
  }

  return (
    <div
      ref={hostRef}
      onPointerDown={handleDown}
      onPointerMove={(event) => {
        if (dragRef.current !== null) {
          onMoveBreakpoint(dragRef.current, timeAt(event.clientX))
        }
      }}
      onPointerUp={() => {
        if (dragRef.current !== null) {
          dragRef.current = null
          onCommitBreakpoints()
        }
      }}
      className={cn(
        'rounded-token bg-sunken border-default relative h-28 w-full overflow-hidden border select-none sm:h-36',
        recording ? 'cursor-default' : 'cursor-pointer',
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
      />

      {/* La tete de lecture est calee a gauche : tout ce qui est a droite
          reste a jouer, ce qui est le seul renseignement utile ici. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 z-10 w-0.5',
          recording ? 'bg-rec' : 'bg-playhead',
        )}
      >
        <span
          className={cn(
            'absolute -top-px left-0 size-2.5 rounded-full',
            recording ? 'bg-rec' : 'bg-playhead',
          )}
        />
      </div>
    </div>
  )
})
