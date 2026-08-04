import { describe, expect, it } from 'vitest'
import {
  formatBytes,
  MAX_BYTES,
  MAX_DURATION_SEC,
  MIN_DURATION_SEC,
  validateDuration,
  validateFile,
} from './validate'

const mp4 = (overrides: Partial<{ name: string; type: string; size: number }> = {}) => ({
  name: 'scene.mp4',
  type: 'video/mp4',
  size: 5_000_000,
  ...overrides,
})

describe('validateFile', () => {
  it('accepte un MP4 de taille raisonnable', () => {
    expect(validateFile(mp4())).toBeNull()
  })

  it('refuse un format autre que MP4', () => {
    const rejection = validateFile(mp4({ name: 'scene.mkv', type: 'video/x-matroska' }))
    expect(rejection?.code).toBe('format')
    expect(rejection?.message).toContain('MP4')
  })

  it('accepte un .mp4 dont le navigateur ne devine pas le type', () => {
    // Certains navigateurs renvoient un type vide sur un glisser-deposer.
    expect(validateFile(mp4({ type: '' }))).toBeNull()
  })

  it('refuse un fichier sans extension ni type reconnaissable', () => {
    expect(validateFile(mp4({ name: 'scene', type: '' }))?.code).toBe('format')
  })

  it('refuse un fichier trop lourd', () => {
    const rejection = validateFile(mp4({ size: MAX_BYTES + 1 }))
    expect(rejection?.code).toBe('taille')
    expect(rejection?.message).toContain('50 Mo')
  })

  it('accepte un fichier exactement a la limite', () => {
    expect(validateFile(mp4({ size: MAX_BYTES }))).toBeNull()
  })

  it('refuse un fichier vide', () => {
    expect(validateFile(mp4({ size: 0 }))?.code).toBe('vide')
  })

  it('ignore la casse de l’extension', () => {
    expect(validateFile(mp4({ name: 'SCENE.MP4', type: '' }))).toBeNull()
  })
})

describe('validateDuration', () => {
  it('accepte une duree normale', () => {
    expect(validateDuration(42)).toBeNull()
  })

  it('refuse un clip trop long', () => {
    const rejection = validateDuration(MAX_DURATION_SEC + 1)
    expect(rejection?.code).toBe('duree')
    expect(rejection?.message).toContain('3 minutes')
  })

  it('accepte un clip exactement a la limite', () => {
    expect(validateDuration(MAX_DURATION_SEC)).toBeNull()
  })

  it('refuse un clip trop court pour etre decoupe', () => {
    expect(validateDuration(MIN_DURATION_SEC - 0.1)?.code).toBe('duree')
  })

  it('refuse une duree illisible', () => {
    // Un MP4 corrompu donne souvent NaN ou Infinity au lecteur.
    expect(validateDuration(Number.NaN)?.code).toBe('illisible')
    expect(validateDuration(Number.POSITIVE_INFINITY)?.code).toBe('illisible')
    expect(validateDuration(0)?.code).toBe('illisible')
  })
})

describe('formatBytes', () => {
  it('affiche les megaoctets avec une decimale', () => {
    expect(formatBytes(5_242_880)).toBe('5 Mo')
    expect(formatBytes(12_600_000)).toBe('12 Mo')
  })

  it('affiche les kilooctets en dessous du megaoctet', () => {
    expect(formatBytes(2048)).toBe('2 Ko')
  })

  it('gere zero', () => {
    expect(formatBytes(0)).toBe('0 Ko')
  })
})
