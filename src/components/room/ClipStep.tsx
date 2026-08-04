'use client'

import { useState } from 'react'
import { Panel } from '@/components/ui'
import { UploadIcon } from '@/components/ui/icons'
import { ClipUploader } from '@/components/upload/ClipUploader'
import { setRoomClip } from '@/lib/rooms/actions'
import type { Room } from '@/lib/supabase/types'

/**
 * Étape séparée du lobby : une fois la partie lancée, le doublage a besoin
 * de matière. Elle n'apparaît que pour l'hôte ; les autres voient
 * simplement qu'on les attend, ce qui vaut mieux qu'un écran figé.
 */
export function ClipStep({ room, isHost }: { room: Room; isHost: boolean }) {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      <header className="text-center">
        <p className="eyebrow text-accent flex items-center justify-center gap-2">
          <UploadIcon className="size-4" />
          Étape suivante
        </p>
        <h1 className="text-fg mt-3 text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.035em]">
          Choisissez le clip à doubler.
        </h1>
        <p className="text-muted mx-auto mt-4 max-w-md text-[17px] leading-relaxed">
          Une scène courte fonctionne mieux qu’un épisode entier. Le fichier
          reste disponible sept jours, puis il est supprimé.
        </p>
      </header>

      {isHost ? (
        <ClipUploader
          onUploaded={async (clipId) => {
            try {
              await setRoomClip(room.id, clipId)
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : 'Impossible d’attacher le clip.',
              )
            }
          }}
        />
      ) : (
        <Panel className="py-12 text-center">
          <p className="text-fg text-[15px] font-medium">
            L’hôte choisit un clip.
          </p>
          <p className="text-muted mt-1.5 text-[15px]">
            La partie démarre dès qu’il est importé.
          </p>
        </Panel>
      )}

      {error && (
        <p role="alert" className="text-rec text-center text-[15px]">
          {error}
        </p>
      )}

      <p className="text-faint text-center text-[13px]">
        MP4 · 3 minutes maximum · 50 Mo maximum
      </p>
    </div>
  )
}
