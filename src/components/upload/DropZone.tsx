'use client'

import { useRef, useState } from 'react'
import { WaveMark } from '@/components/brand/Logo'
import { cn } from '@/lib/utils/cn'

/**
 * Une zone en creux, à l'inverse des boutons qui sont posés sur le fond :
 * on dépose un fichier *dedans*. C'est la même grammaire que les champs de
 * saisie, et elle dit la bonne chose sans avoir besoin d'une flèche.
 */
export function DropZone({
  onFile,
  disabled = false,
}: {
  onFile: (file: File) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  // Un compteur, pas un booléen : `dragleave` se déclenche aussi en passant
  // au-dessus des enfants, ce qui ferait clignoter l'état surligné.
  const depth = useRef(0)

  function open() {
    if (!disabled) inputRef.current?.click()
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    depth.current = 0
    setDragging(false)
    if (disabled) return

    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          open()
        }
      }}
      onDragEnter={(event) => {
        event.preventDefault()
        depth.current += 1
        if (!disabled) setDragging(true)
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => {
        depth.current -= 1
        if (depth.current <= 0) setDragging(false)
      }}
      onDrop={handleDrop}
      className={cn(
        'rounded-token-lg flex w-full cursor-pointer flex-col items-center justify-center border px-6 py-20 text-center',
        'transition-colors duration-200',
        dragging
          ? 'border-strong bg-accent-soft'
          : 'border-default bg-sunken hover:border-strong',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <span className="bg-surface shadow-token rounded-token text-accent mb-6 inline-flex size-14 items-center justify-center">
        <WaveMark className="size-7" />
      </span>

      <p className="text-fg text-[17px] font-medium tracking-[-0.015em]">
        {dragging ? 'Relâchez pour importer' : 'Déposez votre clip ici'}
      </p>
      <p className="text-muted mt-1.5 text-[15px]">
        ou cliquez pour choisir un fichier
      </p>
      <p className="eyebrow text-faint mt-6">MP4 · 3 min max · 50 Mo max</p>

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,.mp4"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          // Permet de resélectionner le même fichier après une erreur.
          event.target.value = ''
        }}
      />
    </div>
  )
}
