'use client'

import { useEffect, useRef } from 'react'

const BAR_COUNT = 84

/** Amplitude au repos : une piste n'est jamais tout à fait plate. */
const FLOOR = 0.045

/** Raideur de la corde : plus elle est haute, plus l'onde voyage vite. */
const TENSION = 0.28

/** Ce qui reste d'une image à l'autre. En dessous de 1, l'onde s'éteint. */
const DAMPING = 0.955

/** Largeur du souffle injecté sous le curseur, en barres. */
const BREATH = 3.2

/**
 * Motif de la piste de référence. Déterministe — calculé une seule fois au
 * chargement du module, donc identique côté serveur et côté client : une
 * valeur aléatoire provoquerait une divergence d'hydratation.
 */
const REFERENCE = Array.from({ length: BAR_COUNT }, (_, i) => {
  const envelope = Math.max(0, Math.sin(i * 0.075 + 0.6)) ** 1.4
  const carrier = 0.42 + 0.58 * Math.abs(Math.sin(i * 0.91 + Math.cos(i * 0.37)))
  return FLOOR + (1 - FLOOR) * envelope * carrier
})

/**
 * Le geste signature du site.
 *
 * La piste du haut est la réplique d'origine : figée, indifférente à vous.
 * Celle du bas est la vôtre — et ce n'est pas une bosse qui suit le
 * curseur, c'est une vraie corde. On y injecte de l'énergie là où l'on
 * passe, elle se propage de proche en proche puis s'éteint. Bouger vite
 * frappe plus fort : le curseur parle, et la piste garde un instant la
 * trace de ce qu'on vient d'y dire.
 *
 * Rien ne transite par l'état React : quatre-vingt-quatre barres
 * déclencheraient un rendu par image.
 */
export function VoiceField() {
  const containerRef = useRef<HTMLDivElement>(null)
  const selfBars = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const height = new Float32Array(BAR_COUNT)
    const velocity = new Float32Array(BAR_COUNT)

    let pointerX = 0.5
    let lastPointerX = 0.5
    let speed = 0
    let presence = 0
    let frame = 0

    function handlePointer(event: PointerEvent) {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      speed = Math.min(Math.abs(x - pointerX) * 26, 1.6)
      lastPointerX = pointerX
      pointerX = x

      // L'influence décroît avec l'éloignement vertical : la corde réagit
      // depuis toute la page, mais d'autant plus qu'on s'en approche.
      const centerY = rect.top + rect.height / 2
      presence = Math.max(0, 1 - Math.abs(event.clientY - centerY) / 460)
    }

    function handleLeave() {
      presence = 0
    }

    // Un clic est un cri : une impulsion franche, plus large et plus forte.
    function handleDown() {
      if (presence <= 0) return
      const center = pointerX * (BAR_COUNT - 1)
      for (let i = 0; i < BAR_COUNT; i++) {
        const offset = (i - center) / (BREATH * 1.8)
        velocity[i] = (velocity[i] ?? 0) + Math.exp(-offset * offset) * 2.6
      }
    }

    function tick() {
      const center = pointerX * (BAR_COUNT - 1)
      // Le souffle de base garde la corde vivante ; la vitesse du geste
      // décide de la force. Immobile, on chuchote ; en mouvement, on parle.
      const force = presence * (0.16 + speed * 0.9)

      for (let i = 0; i < BAR_COUNT; i++) {
        const offset = (i - center) / BREATH
        velocity[i] = (velocity[i] ?? 0) + Math.exp(-offset * offset) * force * 0.5
      }

      // Équation des ondes : chaque barre est tirée vers la moyenne de ses
      // voisines. C'est ce terme qui fait voyager l'onde vers l'extérieur.
      for (let i = 0; i < BAR_COUNT; i++) {
        const left = height[i - 1] ?? height[i] ?? 0
        const right = height[i + 1] ?? height[i] ?? 0
        const pull = left + right - 2 * (height[i] ?? 0)
        velocity[i] = ((velocity[i] ?? 0) + pull * TENSION) * DAMPING
      }

      for (let i = 0; i < BAR_COUNT; i++) {
        height[i] = (height[i] ?? 0) + (velocity[i] ?? 0)

        const amplitude = Math.min(1, FLOOR + Math.abs(height[i] ?? 0) * 0.9)
        const bar = selfBars.current[i]
        if (bar) bar.style.transform = `scaleY(${amplitude.toFixed(4)})`
      }

      // La vitesse retombe si le curseur s'arrête : sans cela, un geste
      // rapide continuerait de crier après s'être immobilisé.
      speed *= 0.86
      if (pointerX === lastPointerX) speed *= 0.7

      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', handlePointer, { passive: true })
    window.addEventListener('pointerdown', handleDown)
    document.addEventListener('pointerleave', handleLeave)
    frame = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', handlePointer)
      window.removeEventListener('pointerdown', handleDown)
      document.removeEventListener('pointerleave', handleLeave)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full select-none" aria-hidden="true">
      <div className="mb-2.5 flex items-end justify-between">
        <span className="eyebrow text-faint">L’original</span>
        <span className="eyebrow text-faint tnum">00:11.80</span>
      </div>

      <div className="flex h-16 items-end gap-[3px] sm:h-24">
        {REFERENCE.map((amplitude, i) => (
          <div
            key={i}
            className="bg-wave-ref h-full flex-1 origin-bottom rounded-full"
            style={{
              transform: `scaleY(${amplitude.toFixed(4)})`,
              animation: `wave-rise 620ms ${i * 6}ms both cubic-bezier(.2,.8,.2,1)`,
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
        <span className="eyebrow text-faint">Bougez, cliquez</span>
      </div>
    </div>
  )
}
