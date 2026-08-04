'use client'

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { cn } from '@/lib/utils/cn'

export interface VideoStageHandle {
  seek: (time: number) => void
  /** Joue un intervalle et s'arrête tout seul à la fin. */
  playRange: (start: number, end: number) => void
  /**
   * Relance sans le son, pour enregistrer par-dessus. Indispensable : un
   * lecteur qui parle pendant la prise se retrouve dans l'enregistrement.
   */
  playMuted: (from: number) => void
  toggle: () => void
  pause: () => void
  /** Joue avec le son a `volume`, depuis `from`. Sert a ecouter le resultat. */
  playFrom: (from: number, volume: number) => void
  setVolume: (volume: number) => void
}

export interface VideoStageProps {
  src: string
  onTime: (time: number) => void
  onPlayingChange?: (playing: boolean) => void
  /** La lecture est arrivee au bout : plus aucune image ne suivra. */
  onEnded?: () => void
  /** Largeur / hauteur du clip. Les extraits d'anime sont souvent verticaux. */
  aspectRatio?: number
  className?: string
}

export const VideoStage = forwardRef<VideoStageHandle, VideoStageProps>(
  function VideoStage(
    { src, onTime, onPlayingChange, onEnded, aspectRatio = 16 / 9, className },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const stopAt = useRef<number | null>(null)
    const [playing, setPlaying] = useState(false)

    // `timeupdate` ne se déclenche que trois ou quatre fois par seconde :
    // suffisant pour un lecteur, beaucoup trop saccadé pour une tête de
    // lecture qu'on regarde avancer. On suit donc le temps par image.
    useEffect(() => {
      if (!playing) return
      let frame = 0

      function tick() {
        const video = videoRef.current
        if (video) {
          const limit = stopAt.current
          if (limit !== null && video.currentTime >= limit) {
            video.pause()
            stopAt.current = null
          }
          onTime(video.currentTime)
        }
        frame = requestAnimationFrame(tick)
      }

      frame = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(frame)
    }, [playing, onTime])

    useEffect(() => {
      onPlayingChange?.(playing)
    }, [playing, onPlayingChange])

    useImperativeHandle(ref, () => ({
      seek(time) {
        const video = videoRef.current
        if (!video) return
        stopAt.current = null
        video.currentTime = time
        onTime(time)
      },
      playRange(start, end) {
        const video = videoRef.current
        if (!video) return
        stopAt.current = end
        video.currentTime = start
        void video.play()
      },
      playMuted(from) {
        const video = videoRef.current
        if (!video) return
        stopAt.current = null
        video.muted = true
        video.currentTime = from
        void video.play()
      },
      toggle() {
        const video = videoRef.current
        if (!video) return
        stopAt.current = null
        video.muted = false
        if (video.paused) void video.play()
        else video.pause()
      },
      pause() {
        videoRef.current?.pause()
      },
      playFrom(from, volume) {
        const video = videoRef.current
        if (!video) return
        stopAt.current = null
        video.muted = volume === 0
        video.volume = volume
        video.currentTime = from
        void video.play()
      },
      setVolume(volume) {
        const video = videoRef.current
        if (!video) return
        video.volume = volume
        // `muted` l'emporte sur `volume` : sans cette remise a zero, monter
        // le curseur apres avoir coupe le son ne rendrait rien.
        if (volume > 0) video.muted = false
      },
    }))

    return (
      // Le format vient du clip, pas d'un 16:9 imposé : une scène verticale
      // forcée en paysage se retrouve minuscule entre deux bandes noires.
      // La hauteur est plafonnée pour qu'un format portrait ne pousse pas
      // la timeline hors de l'écran.
      <div className="flex justify-center">
        <video
          ref={videoRef}
          src={src}
          playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false)
            onEnded?.()
          }}
          onSeeked={() => onTime(videoRef.current?.currentTime ?? 0)}
          style={{ aspectRatio, maxHeight: '58vh' }}
          className={cn('rounded-token-lg bg-playhead max-w-full', className)}
        />
      </div>
    )
  },
)
