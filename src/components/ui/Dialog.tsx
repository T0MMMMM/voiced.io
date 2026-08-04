'use client'

import { useEffect, useId, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { IconButton } from './IconButton'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const baseId = useId()
  const titleId = `${baseId}-title`
  const descriptionId = `${baseId}-description`

  // On utilise showModal() plutôt que l'attribut `open` : c'est lui qui
  // apporte le piège de focus, l'inertie de l'arrière-plan et la couche
  // de superposition, sans qu'on ait à les réimplémenter.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // `cancel` couvre la touche Échap, que le navigateur gère nativement.
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    const handleCancel = (event: Event) => {
      event.preventDefault()
      onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  return (
    <dialog
      ref={ref}
      // Le titre et la description ne sont rendus que si `open` : pointer
      // vers leurs id quand la modale est fermée créerait des références
      // orphelines, signalées par les audits d'accessibilité.
      aria-labelledby={open ? titleId : undefined}
      aria-describedby={open && description ? descriptionId : undefined}
      onClick={(event) => {
        // Le clic sur la zone sombre atteint <dialog> lui-même, jamais son contenu.
        if (event.target === ref.current) onClose()
      }}
      className={cn(
        'bg-surface rounded-token-lg border-default shadow-float m-auto w-[min(28rem,calc(100vw-2rem))] border p-0',
        'backdrop:bg-black/40',
        className,
      )}
    >
      {open && (
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 id={titleId} className="text-fg text-[15px] font-semibold">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="text-muted text-[15px]">
                  {description}
                </p>
              )}
            </div>
            <IconButton label="Fermer" size="sm" variant="ghost" onClick={onClose}>
              ×
            </IconButton>
          </div>

          {children && <div className="text-fg mt-4 text-[15px]">{children}</div>}
          {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}
