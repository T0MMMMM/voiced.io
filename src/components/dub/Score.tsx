'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import type { Segment } from '@/lib/audio/segments'
import { cn } from '@/lib/utils/cn'
import { clamp } from '@/lib/utils/time'

/** Fenêtre visible : cinq secondes de part et d'autre du moment présent. */
export const WINDOW_SEC = 10

/** Fenêtre de préparation, en secondes, mise en avant devant la tête de lecture. */
const LOOKAHEAD_SEC = 2.5

export interface ScoreHandle {
  /** Fait défiler la partition sans repasser par React : 60 images par seconde. */
  setTime: (time: number) => void
}

export interface ScoreProps {
  peaks: number[]
  duration: number
  segments: Segment[]
  recording?: boolean
  onSeek: (time: number) => void
  className?: string
}

/**
 * La partition.
 *
 * Pendant l'enregistrement la vidéo est muette et personne n'entend les
 * autres : cette forme d'onde est la seule information de timing qui reste.
 *
 * Elle défile sous une tête de lecture fixe au centre, et ne montre que
 * cinq secondes de part et d'autre. Afficher tout le clip d'un coup
 * revenait à ne rien montrer : à cette échelle, une réplique fait deux
 * pixels. Ici, on lit ce qui arrive.
 *
 *   · à gauche du centre : ce qui est joué, estompé
 *   · les 2,5 secondes qui suivent : mises en avant, la réplique arrive
 *   · les traits verticaux : les débuts et fins de répliques détectés
 *
 * La tête de lecture étant fixe, les calques le sont aussi : seul le tracé
 * bouge, redessiné à chaque image sur la centaine de barres visibles.
 */
export const Score = forwardRef<ScoreHandle, ScoreProps>(function Score(
  { peaks, duration, segments, recording = false, onSeek, className },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sizeRef = useRef({ width: 0, height: 0 })
  const timeRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return

    const { width, height } = sizeRef.current
    if (width === 0) return

    const context = canvas.getContext('2d')
    if (!context) return

    const styles = getComputedStyle(host)
    const waveColor = styles.getPropertyValue('--wave-ref').trim()
    const markColor = styles.getPropertyValue('--border-strong').trim()

    const ratio = window.devicePixelRatio || 1
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, width, height)

    const from = timeRef.current - WINDOW_SEC / 2
    const pxPerSec = width / WINDOW_SEC
    const middle = height / 2

    // Les frontières de répliques, sous le tracé : ce sont elles qui
    // disent où l'enregistrement s'arrêtera tout seul.
    context.fillStyle = markColor
    for (const segment of segments) {
      for (const edge of [segment.start, segment.end]) {
        const x = (edge - from) * pxPerSec
        if (x < -2 || x > width + 2) continue
        context.fillRect(Math.round(x), 0, 1, height)
      }
    }

    if (peaks.length > 0) {
      const bucketSec = duration / peaks.length
      const first = Math.max(0, Math.floor(from / bucketSec))
      const last = Math.min(peaks.length, Math.ceil((from + WINDOW_SEC) / bucketSec))
      const barWidth = Math.max(1.5, bucketSec * pxPerSec - 1)

      context.fillStyle = waveColor
      for (let i = first; i < last; i++) {
        const x = (i * bucketSec - from) * pxPerSec
        const barHeight = Math.max(2, (peaks[i] ?? 0) * (height - 10))
        context.beginPath()
        context.roundRect(x, middle - barHeight / 2, barWidth, barHeight, barWidth / 2)
        context.fill()
      }
    }
  }, [peaks, duration, segments])

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

    // Le thème change les couleurs sans changer la taille : il faut aussi
    // repeindre quand l'attribut bascule.
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

  function seekFromPointer(clientX: number) {
    const host = hostRef.current
    if (!host) return
    const rect = host.getBoundingClientRect()
    // Cliquer déplace d'autant de secondes qu'on s'écarte du centre.
    const offsetSec = ((clientX - rect.left) / rect.width - 0.5) * WINDOW_SEC
    onSeek(clamp(timeRef.current + offsetSec, 0, duration))
  }

  return (
    <div
      ref={hostRef}
      onPointerDown={(event) => seekFromPointer(event.clientX)}
      className={cn(
        'rounded-token bg-sunken border-default relative h-28 w-full cursor-pointer overflow-hidden border sm:h-36',
        className,
      )}
    >
      {/* La fenêtre de préparation, juste devant la tête de lecture. */}
      <div
        aria-hidden="true"
        className="bg-accent-soft pointer-events-none absolute inset-y-0 left-1/2 z-0"
        style={{ width: `${(LOOKAHEAD_SEC / WINDOW_SEC) * 100}%` }}
      />

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 size-full"
      />

      {/* Ce qui est joué s'estompe. La tête étant fixe, c'est exactement la
          moitié gauche — plus rien à déplacer. */}
      <div
        aria-hidden="true"
        className="bg-bg/55 pointer-events-none absolute inset-y-0 left-0 z-20 w-1/2"
      />

      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 left-1/2 z-30 -ml-px w-0.5',
          recording ? 'bg-rec' : 'bg-playhead',
        )}
      >
        <span
          className={cn(
            'absolute -top-px left-1/2 size-2.5 -translate-x-1/2 rounded-full',
            recording ? 'bg-rec' : 'bg-playhead',
          )}
        />
      </div>
    </div>
  )
})
