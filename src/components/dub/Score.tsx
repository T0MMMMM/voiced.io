'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { cn } from '@/lib/utils/cn'
import { clamp } from '@/lib/utils/time'

/** Fenêtre de préparation, en secondes, mise en avant devant la tête de lecture. */
const LOOKAHEAD_SEC = 2.5

export interface ScoreHandle {
  /** Déplace la tête de lecture sans repasser par React : 60 images par seconde. */
  setTime: (time: number) => void
}

export interface ScoreProps {
  peaks: number[]
  duration: number
  recording?: boolean
  onSeek: (time: number) => void
  className?: string
}

/**
 * La partition.
 *
 * Pendant l'enregistrement la vidéo est muette et personne n'entend les
 * autres : cette forme d'onde est la seule information de timing qui reste.
 * Elle se lit donc comme une partition, en avance — d'où les trois états.
 *
 *   · derrière la tête de lecture : estompé, c'est joué
 *   · les 2,5 secondes qui suivent : mises en avant, la réplique arrive
 *   · au-delà : normal, c'est le contexte
 *
 * Le tracé est peint une fois sur un canvas ; seuls les trois calques
 * mobiles bougent, par transformation. Redessiner 900 barres à chaque
 * image coûterait cher pour rien.
 */
export const Score = forwardRef<ScoreHandle, ScoreProps>(function Score(
  { peaks, duration, recording = false, onSeek, className },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pastRef = useRef<HTMLDivElement>(null)
  const aheadRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  /** Largeur en pixels, tenue à jour par le ResizeObserver du tracé. */
  const widthRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host || peaks.length === 0) return

    const { width, height } = host.getBoundingClientRect()
    widthRef.current = width
    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)

    const context = canvas.getContext('2d')
    if (!context) return
    context.scale(ratio, ratio)
    context.clearRect(0, 0, width, height)

    // La couleur vient du thème courant, jamais d'une valeur en dur :
    // le canvas ne bénéficie pas des variables CSS tout seul.
    context.fillStyle = getComputedStyle(host).getPropertyValue('--wave-ref').trim()

    const step = width / peaks.length
    const barWidth = Math.max(1, step - 1)
    const middle = height / 2

    for (const [index, peak] of peaks.entries()) {
      // Un plancher visible : une partition qui touche zéro paraît coupée.
      const barHeight = Math.max(2, peak * (height - 8))
      context.beginPath()
      context.roundRect(
        index * step,
        middle - barHeight / 2,
        barWidth,
        barHeight,
        barWidth / 2,
      )
      context.fill()
    }
  }, [peaks])

  useEffect(() => {
    draw()
    const observer = new ResizeObserver(draw)
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
  }, [draw])

  useImperativeHandle(ref, () => ({
    setTime(time) {
      const played = duration > 0 ? clamp(time / duration, 0, 1) : 0
      const x = played * widthRef.current

      // Uniquement des transformations : elles ne déclenchent pas de calcul
      // de mise en page, ce qui compte à soixante images par seconde.
      if (pastRef.current) pastRef.current.style.transform = `scaleX(${played})`
      if (headRef.current) headRef.current.style.transform = `translateX(${x}px)`
      if (aheadRef.current) aheadRef.current.style.transform = `translateX(${x}px)`
    },
  }))

  function seekFromPointer(clientX: number) {
    const host = hostRef.current
    if (!host) return
    const rect = host.getBoundingClientRect()
    onSeek(clamp(((clientX - rect.left) / rect.width) * duration, 0, duration))
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
      {/* La fenêtre de préparation, derrière le tracé pour ne pas le masquer. */}
      <div
        ref={aheadRef}
        aria-hidden="true"
        className="bg-accent-soft pointer-events-none absolute inset-y-0 left-0 z-0"
        style={{
          width: `${(LOOKAHEAD_SEC / Math.max(duration, 0.001)) * 100}%`,
          transform: 'translateX(0px)',
        }}
      />

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 size-full"
      />

      {/* Ce qui est joué s'estompe : on voile avec la couleur du fond. */}
      <div
        ref={pastRef}
        aria-hidden="true"
        className="bg-bg/65 pointer-events-none absolute inset-y-0 left-0 z-20 w-full origin-left"
        style={{ transform: 'scaleX(0)' }}
      />

      <div
        ref={headRef}
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 z-30 -ml-px w-0.5',
          recording ? 'bg-rec' : 'bg-playhead',
        )}
        style={{ transform: 'translateX(0px)' }}
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
