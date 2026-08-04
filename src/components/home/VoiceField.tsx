'use client'

import { useEffect, useRef } from 'react'
import { amplitudeAt, FLOOR } from '@/lib/audio/wavefield'

const BAR_COUNT = 84

/** Largeur de la bosse que le curseur creuse, en fraction de la piste. */
const SIGMA = 0.085

/**
 * Irrégularité fixe par barre. Sans elle, la bosse suivant le curseur est
 * une cloche parfaite : ça se lit comme un graphique, pas comme une voix.
 */
const GRAIN = Array.from(
  { length: BAR_COUNT },
  (_, i) => 0.72 + 0.28 * Math.abs(Math.sin(i * 2.39 + 1.1)),
)

/**
 * État de départ de la piste de référence, à l'instant zéro du champ.
 * Déterministe, donc identique côté serveur et côté client — et la boucle
 * reprend exactement là où le rendu initial s'est arrêté, sans saut.
 */
const REFERENCE = Array.from({ length: BAR_COUNT }, (_, i) => amplitudeAt(i, 0))

/**
 * Durée de l'entrée des barres. Tant qu'elle dure, l'animation CSS pilote
 * la transformation : la boucle ne doit pas écrire par-dessus, sinon les
 * deux se disputent la même propriété et le tracé tremble.
 */
const REVEAL_MS = 900

/**
 * Le geste signature du site.
 *
 * La piste du haut joue en continu : un champ d'onde la traverse dans les
 * deux sens, et deux barres voisines lisent deux points proches de la même
 * courbe — c'est cette continuité qui fait une vague plutôt qu'un
 * scintillement.
 *
 * Celle du bas est la vôtre, et elle n'existe que là où vous passez : c'est
 * exactement le rapport que le produit installe entre les deux voix. Le
 * curseur y tient le rôle de la parole.
 *
 * Rien ne transite par l'état React : cent soixante-huit barres
 * déclencheraient un rendu par image.
 */
export function VoiceField() {
  const containerRef = useRef<HTMLDivElement>(null)
  const refBars = useRef<(HTMLDivElement | null)[]>([])
  const selfBars = useRef<(HTMLDivElement | null)[]>([])
  const amplitudes = useRef<number[]>(Array<number>(BAR_COUNT).fill(FLOOR))

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Hors de la fenêtre, la piste du bas retombe au silence : tant que
    // personne ne parle, il n'y a rien à voir.
    let pointerX = 0.5
    let intensity = 0
    let frame = 0
    const started = performance.now()

    function handlePointer(event: PointerEvent) {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      pointerX = (event.clientX - rect.left) / rect.width

      // L'influence décroît avec l'éloignement vertical : la piste réagit
      // depuis toute la page, mais d'autant plus qu'on s'en approche.
      const centerY = rect.top + rect.height / 2
      intensity = Math.max(0, 1 - Math.abs(event.clientY - centerY) / 460)
    }

    function handleLeave() {
      intensity = 0
    }

    function tick(now: number) {
      const elapsed = now - started

      if (elapsed > REVEAL_MS) {
        const t = elapsed / 1000
        for (let i = 0; i < BAR_COUNT; i++) {
          const bar = refBars.current[i]
          if (bar) bar.style.transform = `scaleY(${amplitudeAt(i, t).toFixed(4)})`
        }
      }

      const current = amplitudes.current

      for (let i = 0; i < BAR_COUNT; i++) {
        const offset = i / (BAR_COUNT - 1) - pointerX
        const bell = Math.exp(-(offset * offset) / (2 * SIGMA * SIGMA))
        const target = FLOOR + (1 - FLOOR) * bell * intensity * (GRAIN[i] ?? 1)

        const previous = current[i] ?? FLOOR
        const next = previous + (target - previous) * 0.16
        current[i] = next

        const bar = selfBars.current[i]
        if (bar) bar.style.transform = `scaleY(${next.toFixed(4)})`
      }

      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', handlePointer, { passive: true })
    document.addEventListener('pointerleave', handleLeave)
    frame = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', handlePointer)
      document.removeEventListener('pointerleave', handleLeave)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full select-none" aria-hidden="true">
      <div className="mb-2.5 flex items-end justify-between">
        <span className="eyebrow text-faint">L’original</span>
        <span className="eyebrow text-faint">En lecture</span>
      </div>

      <div className="flex h-16 items-end gap-[3px] sm:h-24">
        {REFERENCE.map((amplitude, i) => (
          <div
            key={i}
            ref={(el) => {
              refBars.current[i] = el
            }}
            className="bg-wave-ref h-full flex-1 origin-bottom rounded-full"
            style={{
              transform: `scaleY(${amplitude.toFixed(4)})`,
              animation: `wave-rise 520ms ${i * 4}ms both cubic-bezier(.2,.8,.2,1)`,
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      {/* L'axe de lecture : la seule ligne parfaitement droite de la page. */}
      <div className="bg-strong my-3 h-px w-full sm:my-4" />

      <div className="flex h-16 items-start gap-[3px] sm:h-24">
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              selfBars.current[i] = el
            }}
            className="bg-wave-self h-full flex-1 origin-top rounded-full"
            style={{ transform: `scaleY(${FLOOR})`, willChange: 'transform' }}
          />
        ))}
      </div>

      <div className="mt-2.5 flex items-end justify-between">
        <span className="eyebrow text-accent">Vous</span>
        <span className="eyebrow text-faint">À enregistrer</span>
      </div>
    </div>
  )
}
