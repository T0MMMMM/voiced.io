'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { getShape, type Game } from '@/lib/games'
import { cn } from '@/lib/utils/cn'

const BAR_COUNT = 56

/** Au repos la piste garde sa silhouette, en retrait : on lit les quatre d'un coup. */
const REST = 0.38

/** Largeur de la bosse que le curseur creuse, en fraction de la piste. */
const SIGMA = 0.1

function Chevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 4l6 6-6 6" />
    </svg>
  )
}

/**
 * Une piste de la console : un jeu, sa silhouette sonore, son état.
 *
 * Au survol, la piste passe au premier plan et le curseur y creuse une
 * bosse — comme si on parlait dedans. Les trois autres restent en retrait :
 * une seule voix à la fois, c'est aussi la règle du produit.
 */
export function GameLane({ game }: { game: Game }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const bars = useRef<(HTMLDivElement | null)[]>([])
  const shape = getShape(game.id)
  const amplitudes = useRef<number[]>(
    Array.from({ length: BAR_COUNT }, (_, i) => shape(i, BAR_COUNT) * REST),
  )
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let pointerX = 0.5
    let frame = 0

    function handlePointer(event: PointerEvent) {
      const track = trackRef.current
      if (!track) return
      const rect = track.getBoundingClientRect()
      pointerX = (event.clientX - rect.left) / rect.width
    }

    function tick() {
      const current = amplitudes.current

      for (let i = 0; i < BAR_COUNT; i++) {
        const base = shape(i, BAR_COUNT)
        let target = base * REST

        if (active) {
          const offset = i / (BAR_COUNT - 1) - pointerX
          const bell = Math.exp(-(offset * offset) / (2 * SIGMA * SIGMA))
          // La bosse s'ajoute à la silhouette au lieu de la remplacer :
          // la règle du jeu reste lisible pendant qu'on la survole.
          target = Math.min(1, base * (0.75 + 0.45 * bell))
        }

        const previous = current[i] ?? 0
        const next = previous + (target - previous) * 0.18
        current[i] = next

        const bar = bars.current[i]
        if (bar) bar.style.transform = `scaleY(${Math.max(next, 0.008).toFixed(4)})`
      }

      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', handlePointer, { passive: true })
    frame = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', handlePointer)
      cancelAnimationFrame(frame)
    }
  }, [active, shape])

  const playable = game.playable

  const body = (
    <>
      <div className="min-w-0 sm:w-52 sm:shrink-0">
        <div className="flex items-center gap-2.5">
          <h2 className="text-fg text-[19px] font-medium tracking-[-0.02em]">
            {game.name}
          </h2>
          {!playable && <span className="eyebrow text-faint">Bientôt</span>}
        </div>
        <p className="text-muted mt-1 text-[14px] leading-snug">{game.tagline}</p>
      </div>

      <div
        ref={trackRef}
        aria-hidden="true"
        className="flex h-12 flex-1 items-center gap-[3px] sm:h-14"
      >
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              bars.current[i] = el
            }}
            className={cn(
              'h-full flex-1 rounded-full transition-colors duration-300',
              active ? 'bg-wave-self' : 'bg-wave-ref',
            )}
            style={{ willChange: 'transform' }}
          />
        ))}
      </div>

      <span
        className={cn(
          'hidden shrink-0 transition-[transform,color] duration-200 sm:block',
          playable ? 'text-accent' : 'text-faint',
          active && playable && 'translate-x-1',
        )}
      >
        {playable ? <Chevron /> : null}
      </span>
    </>
  )

  const shell = cn(
    'flex w-full flex-col gap-4 px-5 py-6 text-left sm:flex-row sm:items-center sm:gap-8',
    'transition-colors duration-200',
    active && 'bg-accent-soft/60',
    playable ? 'cursor-pointer' : 'cursor-default',
  )

  const handlers = {
    onPointerEnter: () => setActive(true),
    onPointerLeave: () => setActive(false),
    onFocus: () => setActive(true),
    onBlur: () => setActive(false),
  }

  return (
    <li className="border-default border-b last:border-b-0">
      {playable ? (
        <Link href={game.href ?? '#'} className={shell} {...handlers}>
          {body}
        </Link>
      ) : (
        <div className={shell} {...handlers}>
          {body}
        </div>
      )}
    </li>
  )
}
