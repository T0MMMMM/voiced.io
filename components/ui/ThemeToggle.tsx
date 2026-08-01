'use client'

import { useEffect, useState } from 'react'
import { applyTheme, readStoredTheme, toggleTheme, type Theme } from '@/lib/theme'
import { IconButton } from './IconButton'

export function ThemeToggle() {
  // Le rendu serveur ne connaît pas localStorage : on part sur 'light',
  // qui est aussi le défaut du produit, puis on se synchronise au montage.
  const [theme, setTheme] = useState<Theme>('light')
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
      <span aria-hidden="true" className="text-[15px] leading-none">
        {theme === 'dark' ? '☀' : '☾'}
      </span>
    </IconButton>
  )
}
