'use client'

import { cn } from '@/lib/utils/cn'

export interface SegmentedOption<T> {
  value: T
  label: string
}

/**
 * Contrôle segmenté : la pastille glisse d'un choix à l'autre au lieu de
 * disparaître d'un côté pour réapparaître de l'autre. Le déplacement dit
 * qu'on change de valeur sur une même échelle, ce qui est exactement le
 * cas pour une durée de minuteur.
 *
 * La pastille se déplace par translation de sa propre largeur : un
 * pourcentage de `translateX` se calcule sur l'élément lui-même, donc
 * `index × 100 %` tombe toujours juste, quel que soit le nombre de choix.
 */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  disabled = false,
  label,
}: {
  options: SegmentedOption<T>[]
  value: T
  onChange: (next: T) => void
  disabled?: boolean
  label: string
}) {
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="bg-sunken rounded-token relative flex p-1"
    >
      <span
        aria-hidden="true"
        className="bg-accent shadow-token absolute inset-y-1 left-1 rounded-[8px] transition-transform duration-300 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />

      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-token relative z-10 flex-1 py-1.5 text-[13px] font-medium',
              'transition-colors duration-200 ease-out',
              selected ? 'text-on-accent' : 'text-muted',
              !disabled && !selected && 'hover:text-fg',
              disabled && 'cursor-default',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
