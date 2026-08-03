'use client'

import { useEffect, useRef } from 'react'

/**
 * Une nappe de vert très pâle qui suit le curseur avec un temps de retard.
 *
 * Elle ne porte aucune information : son seul rôle est de faire réagir le
 * fond au geste, pour que la page paraisse à l'écoute avant même qu'on ait
 * cliqué. Le retard (interpolation à 8 % par image) est délibéré — un suivi
 * au pixel près paraîtrait mécanique là où la traîne paraît attentive.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 3
    let x = targetX
    let y = targetY
    let opacity = 0
    let targetOpacity = 0
    let frame = 0

    function handlePointer(event: PointerEvent) {
      targetX = event.clientX
      targetY = event.clientY
      targetOpacity = 1
    }

    function handleLeave() {
      targetOpacity = 0
    }

    function tick() {
      x += (targetX - x) * 0.08
      y += (targetY - y) * 0.08
      opacity += (targetOpacity - opacity) * 0.06

      const element = ref.current
      if (element) {
        element.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -50%)`
        element.style.opacity = opacity.toFixed(3)
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
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        ref={ref}
        className="absolute top-0 left-0 size-[46rem] opacity-0"
        style={{
          background:
            'radial-gradient(circle closest-side, var(--accent-soft), transparent)',
          willChange: 'transform, opacity',
        }}
      />
    </div>
  )
}
