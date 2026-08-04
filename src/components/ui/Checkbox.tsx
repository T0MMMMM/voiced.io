'use client'

import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  hint?: string
}

/**
 * Case à cocher dessinée plutôt que native : la coche se trace au lieu
 * d'apparaître, et la boîte se remplit en même temps. C'est un geste de
 * 200 ms qui confirme le clic sans rien annoncer.
 *
 * L'input reste un vrai `<input type="checkbox">`, simplement invisible :
 * clavier, lecteurs d'écran et formulaires continuent de fonctionner.
 */
export function Checkbox({ label, hint, className, ...props }: CheckboxProps) {
  const id = useId()

  return (
    <label
      htmlFor={id}
      className={cn(
        'group flex items-start gap-3 py-2.5',
        props.disabled ? 'cursor-default' : 'cursor-pointer',
        className,
      )}
    >
      <span className="relative mt-0.5 flex size-[18px] shrink-0 items-center justify-center">
        <input id={id} type="checkbox" className="peer sr-only" {...props} />

        <span
          aria-hidden="true"
          className={cn(
            'border-strong absolute inset-0 rounded-[6px] border-[1.5px]',
            'transition-[background-color,border-color,transform] duration-200 ease-out',
            'peer-checked:border-accent peer-checked:bg-accent',
            'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--accent)]',
            !props.disabled && 'group-active:scale-90',
          )}
        />

        <svg
          viewBox="0 0 18 18"
          aria-hidden="true"
          className="text-on-accent pointer-events-none absolute size-[14px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M4 9.2 7.4 12.5 14 5.8"
            // La coche se trace : le trait est masqué par son propre
            // pointillé, qu'on fait glisser jusqu'à le révéler entièrement.
            className="[stroke-dasharray:16] [stroke-dashoffset:16] transition-[stroke-dashoffset] delay-75 duration-200 ease-out peer-checked:[stroke-dashoffset:0]"
          />
        </svg>
      </span>

      <span className="min-w-0">
        <span className="text-fg block text-[15px]">{label}</span>
        {hint && <span className="text-faint block text-[13px]">{hint}</span>}
      </span>
    </label>
  )
}
