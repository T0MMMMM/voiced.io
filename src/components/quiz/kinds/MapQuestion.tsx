'use client'

import { useEffect, useRef, useState } from 'react'
import type { MapPayload, QuestionComponentProps } from '@/lib/quiz/kinds'
import { cn } from '@/lib/utils/cn'

/**
 * Le cadrage, en degrés : longitude à gauche, latitude la plus au nord,
 * puis la largeur et la hauteur. Montrer le monde entier pour situer un
 * département français ne demanderait pas une connaissance mais une souris
 * précise.
 *
 * Le planisphère s'arrête à 58° sud : l'Antarctique occupait un quart de
 * l'image pour rien et repoussait tout le reste vers le haut.
 */
const FRAMES: Record<MapPayload['region'], { x: number; y: number; w: number; h: number }> = {
  monde: { x: -180, y: -80, w: 360, h: 138 },
  europe: { x: -13, y: -72, w: 56, h: 39 },
  france: { x: -5.6, y: -51.6, w: 15.6, h: 10.8 },
}

/**
 * La carte à cliquer.
 *
 * Le fond de carte est livré avec le code plutôt que chargé depuis un
 * service : une carte en ligne coûterait une clé d'API et un quota, deux
 * choses que ce projet s'interdit.
 *
 * Le repère du SVG est la longitude et la latitude elles-mêmes, ce qui
 * évite toute conversion : le point cliqué se relit directement, et cadrer
 * sur l'Europe ne demande qu'un `viewBox`.
 *
 * La note est dégressive à la distance. Poser Rome à Naples vaut mieux que
 * de la poser à Berlin, et une note tout ou rien confondait les deux.
 */
export function MapQuestion({
  payload,
  value,
  disabled,
  onChange,
}: QuestionComponentProps<MapPayload, { kind: 'carte'; lat: number; lng: number }>) {
  const [paths, setPaths] = useState<string[]>([])
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null,
  )
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

  useEffect(() => {
    setPoint(value ? { lat: value.lat, lng: value.lng } : null)
  }, [payload.region, value])

  const frame = FRAMES[payload.region] ?? FRAMES.monde

  /**
   * Tout ce qui se dessine se mesure en degrés, donc à l'échelle du
   * cadrage. Une taille fixe donnait un point invisible sur le planisphère
   * et un pâté sur la France.
   */
  const unit = frame.w / 100

  function place(event: React.MouseEvent<SVGSVGElement>) {
    if (disabled) return
    const element = svg.current
    const matrix = element?.getScreenCTM()
    if (!element || !matrix) return

    // Le navigateur connaît la transformation exacte entre l'écran et le
    // repère du SVG, cadrage et marges comprises : la recalculer à la main
    // reviendrait à la deviner.
    const cursor = element.createSVGPoint()
    cursor.x = event.clientX
    cursor.y = event.clientY
    const inside = cursor.matrixTransform(matrix.inverse())

    const next = { lat: -inside.y, lng: inside.x }
    setPoint(next)
    onChange({ kind: 'carte', ...next })
  }

  return (
    <div className="space-y-3">
      <p className="text-muted text-[15px]">
        {payload.target
          ? `Cliquez sur la carte pour placer ${payload.target}.`
          : 'Cliquez sur la carte pour placer votre réponse.'}
      </p>

      <div
        className="bg-sunken rounded-token relative overflow-hidden"
        style={{ aspectRatio: frame.w / frame.h }}
      >
        <svg
          ref={svg}
          viewBox={`${frame.x} ${frame.y} ${frame.w} ${frame.h}`}
          onClick={place}
          className={cn(
            'h-full w-full',
            disabled ? 'cursor-default' : 'cursor-crosshair',
          )}
          role="img"
          aria-label="Carte à cliquer"
        >
          <g
            fill="var(--accent-soft)"
            stroke="var(--accent)"
            strokeWidth={unit * 0.08}
            strokeLinejoin="round"
          >
            {paths.map((path, index) => (
              <path key={index} d={path} />
            ))}
          </g>

          {point && (
            <g transform={`translate(${point.lng} ${-point.lat})`}>
              {/* Le halo se voit sur la terre comme sur la mer ; un simple
                  point se perdait dans le vert des continents. */}
              <circle r={unit * 3.2} fill="var(--rec)" opacity="0.22" />
              <circle
                r={unit * 1.3}
                fill="var(--rec)"
                stroke="var(--surface)"
                strokeWidth={unit * 0.4}
              />
            </g>
          )}
        </svg>

        {paths.length === 0 && (
          <p className="text-faint absolute inset-0 flex items-center justify-center text-[13px]">
            Chargement de la carte…
          </p>
        )}
      </div>

      <p className="text-faint text-[13px]">
        {point
          ? 'Point posé. Cliquez ailleurs pour le déplacer.'
          : 'Plus vous êtes proche, plus vous marquez.'}
      </p>
    </div>
  )
}
