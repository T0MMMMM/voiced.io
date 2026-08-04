'use client'

import { useEffect, useState } from 'react'
import { applyTheme, readStoredTheme, toggleTheme, type Theme } from '@/lib/theme'
import { IconButton } from './IconButton'

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" aria-hidden="true">
      <path
        d="M16.5 11.9A6.9 6.9 0 0 1 8.1 3.5a6.9 6.9 0 1 0 8.4 8.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.5" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10 1.6v2M10 16.4v2M1.6 10h2M16.4 10h2" />
        <path d="M4.1 4.1 5.5 5.5M14.5 14.5l1.4 1.4M15.9 4.1 14.5 5.5M5.5 14.5l-1.4 1.4" />
      </g>
    </svg>
  )
}

export function ThemeToggle() {
  // Le rendu serveur ne connaît pas localStorage : on part sur 'dark',
  // qui est aussi le défaut du produit, puis on se synchronise au montage.
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTheme(readStoredTheme())
    setMounted(true)
  }, [])

  function handleToggle() {
    const next = toggleTheme(theme)
    setTheme(next)
    applyTheme(next)
  }

  const label = theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'

  return (
    <IconButton
      label={label}
      size="sm"
      onClick={handleToggle}
      // Avant le montage on ne sait pas quel thème est actif : on masque
      // l'icône plutôt que d'en afficher une fausse pendant un instant.
      className={mounted ? undefined : 'invisible'}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  )
}
