'use client'

import { IconButton, Timecode } from '@/components/ui'
import type { Scene } from '@/lib/clips/scenes'
import { cn } from '@/lib/utils/cn'

export interface SceneListProps {
  scenes: Scene[]
  activeIndex: number | null
  onPreview: (scene: Scene) => void
  /** Supprime la coupe qui ouvre cette scène : elle fusionne avec la précédente. */
  onMerge: (sceneIndex: number) => void
}

export function SceneList({
  scenes,
  activeIndex,
  onPreview,
  onMerge,
}: SceneListProps) {
  return (
    <ol className="divide-default divide-y">
      {scenes.map((scene) => (
        <li
          key={scene.index}
          className={cn(
            'flex items-center gap-4 py-3 transition-colors duration-150',
            activeIndex === scene.index && 'bg-accent-soft -mx-3 px-3',
          )}
        >
          <span className="eyebrow text-faint tnum w-6 shrink-0">
            {String(scene.index + 1).padStart(2, '0')}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <Timecode seconds={scene.start} className="text-fg" />
              <span className="text-faint text-[13px]">→</span>
              <Timecode seconds={scene.end} className="text-fg" />
            </div>
            <p className="text-faint mt-0.5 text-[13px]">
              <Timecode
                seconds={scene.end - scene.start}
                mode="duration"
                className="text-faint"
              />{' '}
              de doublage
            </p>
          </div>

          <IconButton
            label={`Écouter la scène ${scene.index + 1}`}
            size="sm"
            onClick={() => onPreview(scene)}
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="currentColor">
              <path d="M7 4.5v11l9-5.5-9-5.5Z" />
            </svg>
          </IconButton>

          {/* La scène 1 n'est ouverte par aucune coupe : il n'y a rien à retirer. */}
          {scene.index > 0 && (
            <IconButton
              label={`Fusionner la scène ${scene.index + 1} avec la précédente`}
              size="sm"
              variant="ghost"
              onClick={() => onMerge(scene.index)}
            >
              <svg
                viewBox="0 0 20 20"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <path d="M5 10h10" />
              </svg>
            </IconButton>
          )}
        </li>
      ))}
    </ol>
  )
}
