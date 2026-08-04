import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  toggleTheme,
} from './theme'

describe('resolveTheme', () => {
  it("retourne 'light' pour la valeur exacte 'light'", () => {
    expect(resolveTheme('light')).toBe('light')
  })

  it("retourne 'dark' par défaut quand rien n'est stocké", () => {
    expect(resolveTheme(null)).toBe('dark')
    expect(resolveTheme(undefined)).toBe('dark')
  })

  it("retourne 'dark' pour toute valeur inconnue", () => {
    expect(resolveTheme('LIGHT')).toBe('dark')
    expect(resolveTheme('clair')).toBe('dark')
    expect(resolveTheme('')).toBe('dark')
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
    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('persiste le thème dans localStorage', () => {
    applyTheme('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('relit le thème persisté', () => {
    applyTheme('light')
    expect(readStoredTheme()).toBe('light')
  })

  it("retourne 'dark' quand rien n'a jamais été persisté", () => {
    expect(readStoredTheme()).toBe('dark')
  })
})
