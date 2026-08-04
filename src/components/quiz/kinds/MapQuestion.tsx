'use client'

import { useEffect, useRef, useState } from 'react'
import type { MapPayload, QuestionComponentProps } from '@/lib/quiz/kinds'
import { cn } from '@/lib/utils/cn'

/**
 * Le cadrage, en degrés : longitude à gauche, latitude en haut, puis la
 * largeur et la hauteur. Montrer le monde entier pour situer un département
 * français ne demanderait pas une connaissance, mais une souris précise.
 */
const FRAMES: Record<MapPayload['region'], { box: string; ratio: number }> = {
  monde: { box: '-180 -83 360 155', ratio: 360 / 155 },
  europe: { box: '-13 -72 56 39', ratio: 56 / 39 },
  france: { box: '-5.6 -51.6 15.6 10.8', ratio: 15.6 / 10.8 },
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
        style={{ aspectRatio: frame.ratio }}
      >
        <svg
          ref={svg}
          viewBox={frame.box}
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
            strokeWidth={frame.ratio > 5 ? 0.15 : 0.04}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          >
            {paths.map((path, index) => (
              <path key={index} d={path} />
            ))}
          </g>

          {point && (
            <g transform={`translate(${point.lng} ${-point.lat})`}>
              {/* Le halo se voit sur la terre comme sur la mer ; un simple
                  point se perdait dans le vert des continents. */}
              <circle
                r={frame.ratio > 5 ? 5 : 0.5}
                fill="var(--rec)"
                opacity="0.25"
                className="origin-center"
              />
              <circle
                r={frame.ratio > 5 ? 2 : 0.2}
                fill="var(--rec)"
                stroke="var(--surface)"
                strokeWidth={frame.ratio > 5 ? 0.6 : 0.06}
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
