import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  toggleTheme,
} from './theme'

describe('resolveTheme', () => {
  it("retourne 'dark' pour la valeur exacte 'dark'", () => {
    expect(resolveTheme('dark')).toBe('dark')
  })

  it("retourne 'light' par défaut quand rien n'est stocké", () => {
    expect(resolveTheme(null)).toBe('light')
    expect(resolveTheme(undefined)).toBe('light')
  })

  it("retourne 'light' pour toute valeur inconnue", () => {
    expect(resolveTheme('DARK')).toBe('light')
    expect(resolveTheme('sombre')).toBe('light')
    expect(resolveTheme('')).toBe('light')
  })
})

describe('toggleTheme', () => {
  it('inverse le thème', () => {
    expect(toggleTheme('light')).toBe('dark')
    expect(toggleTheme('dark')).toBe('light')
  })
})

describe('applyTheme et readStoredTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it("pose l'attribut data-theme sur <html>", () => {
    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('persiste le thème dans localStorage', () => {
    applyTheme('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('relit le thème persisté', () => {
    applyTheme('dark')
    expect(readStoredTheme()).toBe('dark')
  })

  it("retourne 'light' quand rien n'a jamais été persisté", () => {
    expect(readStoredTheme()).toBe('light')
  })
})
