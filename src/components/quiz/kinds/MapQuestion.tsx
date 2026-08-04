'use client'

import { useEffect, useState } from 'react'
import { frameFor, MapCanvas, MapPin } from '@/components/quiz/kinds/MapCanvas'
import type { MapPayload, QuestionComponentProps } from '@/lib/quiz/kinds'
import { useT } from '@/lib/i18n'

/**
 * La carte à cliquer.
 *
 * Elle prend toute la largeur disponible, marges du panneau comprises :
 * placer un point au millier de kilomètres près demande de la place, et une
 * carte à l'étroit transforme une question de géographie en question de
 * précision de souris.
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
  const t = useT()
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null,
  )

  useEffect(() => {
    setPoint(value ? { lat: value.lat, lng: value.lng } : null)
  }, [payload.region, value])

  const frame = frameFor(payload)

  function place(next: { lat: number; lng: number }) {
    if (disabled) return
    setPoint(next)
    onChange({ kind: 'carte', ...next })
  }

  return (
    <div className="space-y-3">
      <p className="text-muted text-[15px]">
        {payload.target
          ? t.forms.mapPlace(payload.target)
          : t.forms.mapPlaceAny}
      </p>

      {/* Les marges négatives rendent au fond de carte la place que le
          panneau lui prenait de chaque côté. */}
      <MapCanvas
        frame={frame}
        onPick={disabled ? undefined : place}
        className="-mx-6 rounded-none sm:mx-0 sm:rounded-[10px]"
      >
        {point && <MapPin frame={frame} lat={point.lat} lng={point.lng} />}
      </MapCanvas>

      <p className="text-faint text-[13px]">
        {point ? t.forms.mapPlaced : t.forms.mapCloser}
      </p>
    </div>
  )
}
