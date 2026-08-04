import { describe, expect, it } from 'vitest'
import { clipPath, extensionFromMime, takePath, thumbPath } from './paths'

const CLIP_ID = '3f2b8c1e-0000-4000-8000-000000000001'
const ROOM_ID = '3f2b8c1e-0000-4000-8000-000000000002'
const TAKE_ID = '3f2b8c1e-0000-4000-8000-000000000003'

describe('clipPath', () => {
  it('range le clip dans un dossier à son identifiant', () => {
    expect(clipPath(CLIP_ID, 'mp4')).toBe(`${CLIP_ID}/source.mp4`)
  })

  it("accepte une extension déjà préfixée d'un point", () => {
    expect(clipPath(CLIP_ID, '.mp4')).toBe(`${CLIP_ID}/source.mp4`)
  })
})

describe('takePath', () => {
  it('range la prise sous son salon', () => {
    expect(takePath(ROOM_ID, TAKE_ID, 'webm')).toBe(`${ROOM_ID}/${TAKE_ID}.webm`)
  })
})

describe('thumbPath', () => {
  it('produit un chemin de vignette stable', () => {
    expect(thumbPath(CLIP_ID)).toBe(`${CLIP_ID}/thumb.jpg`)
  })
})

describe('extensionFromMime', () => {
  it('reconnaît les formats produits par MediaRecorder', () => {
    expect(extensionFromMime('audio/webm')).toBe('webm')
    expect(extensionFromMime('audio/webm;codecs=opus')).toBe('webm')
    expect(extensionFromMime('audio/mp4')).toBe('mp4')
    expect(extensionFromMime('audio/mp4;codecs=mp4a.40.2')).toBe('mp4')
    expect(extensionFromMime('audio/ogg;codecs=opus')).toBe('ogg')
  })

  it('reconnaît les formats vidéo et image', () => {
    expect(extensionFromMime('video/mp4')).toBe('mp4')
    expect(extensionFromMime('image/jpeg')).toBe('jpg')
    expect(extensionFromMime('image/webp')).toBe('webp')
  })

  it('retombe sur bin pour un type inconnu', () => {
    expect(extensionFromMime('application/octet-stream')).toBe('bin')
    expect(extensionFromMime('')).toBe('bin')
  })
})
