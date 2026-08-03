'use client'

import { useCallback, useRef, useState } from 'react'
import { Button, Panel, Timecode } from '@/components/ui'
import { SceneList } from '@/components/video/SceneList'
import { Timeline } from '@/components/video/Timeline'
import { VideoStage, type VideoStageHandle } from '@/components/video/VideoStage'
import { saveScenes } from '@/lib/clips/actions'
import {
  addMarker,
  canAddMarker,
  markersToScenes,
  MAX_SCENES,
  moveMarker,
  removeMarker,
  type Scene,
} from '@/lib/clips/scenes'

export interface CutEditorProps {
  clipId: string
  title: string
  videoUrl: string
  durationSec: number
  aspectRatio: number
  initialMarkers: number[]
}

export function CutEditor({
  clipId,
  title,
  videoUrl,
  durationSec,
  aspectRatio,
  initialMarkers,
}: CutEditorProps) {
  const stage = useRef<VideoStageHandle>(null)
  const [markers, setMarkers] = useState<number[]>(initialMarkers)
  const [currentTime, setCurrentTime] = useState(0)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scenes = markersToScenes(markers, durationSec)
  const canCut = canAddMarker(markers, currentTime, durationSec)

  // Stable : la boucle d'animation du lecteur la garde en dépendance.
  const handleTime = useCallback((time: number) => setCurrentTime(time), [])

  function cutHere() {
    setSaved(null)
    setMarkers((current) => addMarker(current, currentTime, durationSec))
  }

  function preview(scene: Scene) {
    setActiveIndex(scene.index)
    stage.current?.playRange(scene.start, scene.end)
  }

  function merge(sceneIndex: number) {
    setSaved(null)
    setMarkers((current) => removeMarker(current, sceneIndex - 1))
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const { count } = await saveScenes(clipId, scenes)
      setSaved(count)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <VideoStage
        ref={stage}
        src={videoUrl}
        onTime={handleTime}
        aspectRatio={aspectRatio}
      />

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="eyebrow text-faint">Timeline</span>
          <span className="tnum text-muted font-mono text-[13px]">
            <Timecode seconds={currentTime} className="text-fg" /> /{' '}
            <Timecode seconds={durationSec} className="text-faint" />
          </span>
        </div>

        <Timeline
          duration={durationSec}
          markers={markers}
          currentTime={currentTime}
          onSeek={(time) => stage.current?.seek(time)}
          onMoveMarker={(index, time) => {
            setSaved(null)
            setMarkers((current) => moveMarker(current, index, time, durationSec))
          }}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => stage.current?.toggle()}>
            Lire
          </Button>
          <Button onClick={cutHere} disabled={!canCut}>
            Couper ici
          </Button>
          <p className="text-faint text-[13px]">
            {markers.length + 1 >= MAX_SCENES
              ? `Maximum de ${MAX_SCENES} scènes atteint.`
              : !canCut
                ? 'Trop près d’une coupe existante.'
                : 'Placez la tête de lecture, puis coupez.'}
          </p>
        </div>
      </div>

      <Panel>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-fg text-[15px] font-medium">
            {scenes.length} scène{scenes.length > 1 ? 's' : ''}
          </h2>
          <span className="eyebrow text-faint">{title}</span>
        </div>

        <SceneList
          scenes={scenes}
          activeIndex={activeIndex}
          onPreview={preview}
          onMerge={merge}
        />
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {saved !== null && (
            <p className="text-accent text-[15px]">
              Découpage enregistré — {saved} scène{saved > 1 ? 's' : ''}.
            </p>
          )}
          {error && (
            <p role="alert" className="text-rec text-[15px]">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => void save()} loading={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer le découpage'}
          </Button>
          <Button disabled>Attribuer les personnages</Button>
        </div>
      </div>
    </div>
  )
}
