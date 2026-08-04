'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import { formatTimecode } from '@/lib/utils/time'

export interface LiveClockHandle {
  setTime: (time: number) => void
}

/**
 * Position de lecture au centième de seconde.
 *
 * Elle s'écrit directement dans le DOM : passer par l'état React ferait
 * soixante rendus par seconde pour six chiffres. La chasse fixe et les
 * chiffres tabulaires sont indispensables — sans eux la ligne tremble à
 * chaque changement de chiffre, ce qui se voit énormément à cette cadence.
 */
export const LiveClock = forwardRef<LiveClockHandle, { duration: number }>(
  function LiveClock({ duration }, ref) {
    const nowRef = useRef<HTMLSpanElement>(null)

    useImperativeHandle(ref, () => ({
      setTime(time) {
        if (nowRef.current) nowRef.current.textContent = formatTimecode(time)
      },
    }))

    return (
      <span className="tnum font-mono text-[13px] font-medium">
        <span ref={nowRef} className="text-fg">
          {formatTimecode(0)}
        </span>
        <span className="text-faint"> / {formatTimecode(duration)}</span>
      </span>
    )
  },
)
