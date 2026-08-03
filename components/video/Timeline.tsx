'use client'

import { useRef, useState } from 'react'
import { markersToScenes } from '@/lib/clips/scenes'
import { clamp } from '@/lib/utils/time'

export interface TimelineProps {
  duration: number
  markers: number[]
  currentTime: number
  onSeek: (time: number) => void
  onMoveMarker: (index: number, time: number) => void
}

/**
 * La timeline montre les scènes, pas la vidéo : chaque bande est une scène,
 * chaque trait noir une coupe. Les bandes alternent en teinte parce qu'un
 * simple trait de séparation se perd dès qu'il y a plus de six scènes.
 */
export function Timeline({
  duration,
  markers,
  currentTime,
  onSeek,
  onMoveMarker,
}: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<number | null>(null)

  const scenes = markersToScenes(markers, duration)

  function timeAt(clientX: number): number {
    const track = trackRef.current
    if (!track) return 0
    const rect = track.getBoundingClientRect()
    return clamp(((clientX - rect.left) / rect.width) * duration, 0, duration)
  }

  function startDrag(index: number, event: React.PointerEvent) {
    event.stopPropagation()
    event.preventDefault()
    setDragging(index)
    // La capture garantit qu'on reçoit encore les évènements si le curseur
    // sort de la piste pendant le glisser.
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  return (
    <div
      ref={trackRef}
      onPointerDown={(event) => onSeek(timeAt(event.clientX))}
      className="rounded-token bg-sunken border-default relative h-16 w-full cursor-pointer overflow-hidden border select-none"
    >
      {scenes.map((scene) => (
        <div
          key={scene.index}
          className={scene.index % 2 === 0 ? 'bg-accent-soft' : 'bg-transparent'}
          style={{
            position: 'absolute',
            insetBlock: 0,
            left: `${(scene.start / duration) * 100}%`,
            width: `${((scene.end - scene.start) / duration) * 100}%`,
          }}
        />
      ))}

      {markers.map((marker, index) => (
        <div
          key={index}
          role="slider"
          aria-label={`Coupe ${index + 1}`}
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={Number(marker.toFixed(2))}
          tabIndex={0}
          onPointerDown={(event) => startDrag(index, event)}
          onPointerMove={(event) => {
            if (dragging === index) onMoveMarker(index, timeAt(event.clientX))
          }}
          onPointerUp={() => setDragging(null)}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 1 : 0.1
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              onMoveMarker(index, marker - step)
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault()
              onMoveMarker(index, marker + step)
            }
          }}
          className="absolute inset-y-0 z-10 w-4 -translate-x-1/2 cursor-ew-resize"
          style={{ left: `${(marker / duration) * 100}%` }}
        >
          <div className="bg-playhead absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2" />
          <div className="bg-playhead absolute top-1 left-1/2 h-2 w-3 -translate-x-1/2 rounded-full" />
        </div>
      ))}

      <div
        aria-hidden="true"
        className="bg-accent pointer-events-none absolute inset-y-0 z-20 w-0.5"
        style={{ left: `${(currentTime / duration) * 100}%` }}
      >
        <div className="bg-accent absolute -top-px left-1/2 size-2.5 -translate-x-1/2 rounded-full" />
      </div>
    </div>
  )
}
