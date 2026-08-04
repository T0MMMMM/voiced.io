import { describe, expect, it } from 'vitest'
import { cueFor, findSegments, segmentFrom } from './segments'

/** Construit un spectre a partir d'une frise lisible : # parle, . silence. */
function spectrum(pattern: string): number[] {
  return [...pattern].map((char) => (char === '#' ? 0.8 : 0.02))
}

/** Une tranche = 0,1 s avec ces durees, ce qui rend les calculs lisibles. */
const DURATION = (pattern: string) => pattern.length * 0.1

describe('findSegments', () => {
  it('ne trouve rien dans un silence complet', () => {
    const p = '....................'
    expect(findSegments(spectrum(p), DURATION(p))).toEqual([])
  })

  it('trouve une réplique isolée', () => {
    const p = '.....##########.....'
    const segments = findSegments(spectrum(p), DURATION(p))
    expect(segments).toHaveLength(1)
    expect(segments[0]?.start).toBeCloseTo(0.5 - 0.12, 2)
    expect(segments[0]?.end).toBeCloseTo(1.5 + 0.12, 2)
  })

  it('sépare deux répliques par un vrai blanc', () => {
    const p = '#####..........#####'
    expect(findSegments(spectrum(p), DURATION(p))).toHaveLength(2)
  })

  it('ne coupe pas une phrase sur une respiration', () => {
    // Deux tranches de blanc = 0,2 s, sous le minimum de 0,28 s.
    const p = '#####..###############'
    expect(findSegments(spectrum(p), DURATION(p))).toHaveLength(1)
  })

  it('ignore un bruit trop court pour être une réplique', () => {
    // Une seule tranche bruyante = 0,1 s, meme avec la marge on reste
    // sous le minimum de parole.
    const p = '..........#.........'
    expect(findSegments(spectrum(p), DURATION(p), { padSec: 0 })).toEqual([])
  })

  it('mord un peu sur le silence de chaque côté', () => {
    // Sans cette marge, les attaques douces et les fins de mot qui
    // s'eteignent se retrouvent coupees.
    const p = '.....##########.....'
    const [padded] = findSegments(spectrum(p), DURATION(p), { padSec: 0.2 })
    const [tight] = findSegments(spectrum(p), DURATION(p), { padSec: 0 })
    expect(padded!.start).toBeLessThan(tight!.start)
    expect(padded!.end).toBeGreaterThan(tight!.end)
  })

  it('ne déborde jamais du clip', () => {
    const p = '####################'
    const [segment] = findSegments(spectrum(p), DURATION(p), { padSec: 1 })
    expect(segment?.start).toBe(0)
    expect(segment?.end).toBe(DURATION(p))
  })

  it('numérote les répliques dans l’ordre', () => {
    const p = '###.......###.......###'
    const segments = findSegments(spectrum(p), DURATION(p))
    expect(segments.map((s) => s.index)).toEqual([0, 1, 2])
    expect(segments[0]!.end).toBeLessThan(segments[1]!.start)
  })

  it('gère un spectre vide', () => {
    expect(findSegments([], 10)).toEqual([])
    expect(findSegments([0.5], 0)).toEqual([])
  })
})

describe('segmentFrom', () => {
  const p = '###.......###.......###'
  const segments = findSegments(spectrum(p), DURATION(p))

  it('renvoie la réplique en cours quand on est dedans', () => {
    expect(segmentFrom(segments, 0.2)?.index).toBe(0)
  })

  it('renvoie la suivante quand on est dans un blanc', () => {
    expect(segmentFrom(segments, 0.8)?.index).toBe(1)
  })

  it('ne renvoie rien après la dernière', () => {
    expect(segmentFrom(segments, 99)).toBeNull()
  })
})

describe('cueFor', () => {
  it('recule avant la réplique pour laisser le temps d’attaquer', () => {
    expect(cueFor({ index: 0, start: 5, end: 7 }, 1.2)).toBeCloseTo(3.8, 5)
  })

  it('ne recule jamais avant le début du clip', () => {
    expect(cueFor({ index: 0, start: 0.4, end: 2 }, 1.2)).toBe(0)
  })
})
