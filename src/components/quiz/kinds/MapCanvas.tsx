'use client'

import { useEffect, useRef, useState } from 'react'
import type { MapPayload } from '@/lib/quiz/kinds'
import { cn } from '@/lib/utils/cn'

export interface Frame {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Le cadrage, en degrés : longitude à gauche, latitude la plus au nord,
 * puis la largeur et la hauteur. Montrer le monde entier pour situer un
 * département français ne demanderait pas une connaissance mais une souris
 * précise.
 *
 * Le planisphère s'arrête à 58° sud : l'Antarctique occupait un quart de
 * l'image pour rien et repoussait tout le reste vers le haut.
 */
export const FRAMES: Record<string, Frame> = {
  monde: { x: -180, y: -80, w: 360, h: 138 },
  europe: { x: -13, y: -72, w: 56, h: 39 },
  france: { x: -5.6, y: -51.6, w: 15.6, h: 10.8 },
}

/** Un pays sans entrée nommée porte son propre cadrage. */
export function frameFor(payload: MapPayload): Frame {
  return payload.box ?? FRAMES[payload.region] ?? FRAMES.monde!
}

/**
 * Le fond de carte, partagé par la question et par la correction.
 *
 * Il est livré avec le code plutôt que chargé depuis un service : une carte
 * en ligne coûterait une clé d'API et un quota, deux choses que ce projet
 * s'interdit.
 *
 * Le repère du SVG est la longitude et la latitude elles-mêmes, ce qui
 * évite toute conversion : le point cliqué se relit directement, et cadrer
 * sur un pays ne demande qu'un `viewBox`.
 */
export function MapCanvas({
  frame,
  onPick,
  children,
  className,
}: {
  frame: Frame
  /** Absent : la carte se regarde, elle ne se clique pas. */
  onPick?: (point: { lat: number; lng: number }) => void
  children?: React.ReactNode
  className?: string
}) {
  const [paths, setPaths] = useState<string[]>([])
  const svg = useRef<SVGSVGElement>(null)

  // Le fond de carte pèse une centaine de kilo-octets : il n'arrive que
  // pour les questions qui en ont besoin, pas dans le lot commun.
  useEffect(() => {
    let alive = true
    void import('@/lib/quiz/world').then((module) => {
      if (alive) setPaths(module.WORLD_PATHS)
    })
    return () => {
      alive = false
    }
  }, [])

  function pick(event: React.MouseEvent<SVGSVGElement>) {
    const element = svg.current
    const matrix = element?.getScreenCTM()
    if (!onPick || !element || !matrix) return

    // Le navigateur connaît la transformation exacte entre l'écran et le
    // repère du SVG, cadrage et marges comprises : la recalculer à la main
    // reviendrait à la deviner.
    const cursor = element.createSVGPoint()
    cursor.x = event.clientX
    cursor.y = event.clientY
    const inside = cursor.matrixTransform(matrix.inverse())

    onPick({ lat: -inside.y, lng: inside.x })
  }

  return (
    <div
      className={cn('bg-sunken rounded-token relative overflow-hidden', className)}
      style={{ aspectRatio: frame.w / frame.h }}
    >
      <svg
        ref={svg}
        viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
        onClick={pick}
        className={cn('h-full w-full', onPick ? 'cursor-crosshair' : 'cursor-default')}
        role="img"
        aria-label="Carte"
      >
        <g
          fill="var(--accent-soft)"
          stroke="var(--accent)"
          strokeWidth={(frame.w / 100) * 0.08}
          strokeLinejoin="round"
        >
          {paths.map((path, index) => (
            <path key={index} d={path} />
          ))}
        </g>

        {children}
      </svg>

      {paths.length === 0 && (
        <p className="text-faint absolute inset-0 flex items-center justify-center text-[13px]">
          Chargement de la carte…
        </p>
      )}
    </div>
  )
}

/**
 * Un point posé sur la carte.
 *
 * Il reste petit : c'est lui qui dit la précision de la réponse, et un gros
 * disque laisserait croire qu'on a droit à cinq cents kilomètres
 * d'à-peu-près. Le liseré clair le détache de la terre comme de la mer.
 */
export function MapPin({
  frame,
  lat,
  lng,
  tone = 'var(--rec)',
  label,
}: {
  frame: Frame
  lat: number
  lng: number
  tone?: string
  label?: string
}) {
  const unit = frame.w / 100

  return (
    <g transform={`translate(${lng} ${-lat})`}>
      <circle
        r={unit * 0.75}
        fill={tone}
        stroke="var(--surface)"
        strokeWidth={unit * 0.3}
      />
      {label && (
        <text
          x={unit * 1.6}
          y={unit * 0.6}
          fill="var(--text)"
          fontSize={unit * 2.4}
          className="font-medium"
        >
          {label}
        </text>
      )}
    </g>
  )
}
