import { describe, expect, it } from 'vitest'
import {
  addBreakpoint,
  canAddBreakpoint,
  MIN_SEGMENT_SEC,
  moveBreakpoint,
  removeBreakpoint,
  segmentAt,
  segmentsFrom,
  stepSegment,
} from './breakpoints'

const DURATION = 20

describe('segmentsFrom', () => {
  it('sans point, la scène entière forme un seul segment', () => {
    expect(segmentsFrom([], DURATION)).toEqual([{ index: 0, start: 0, end: 20 }])
  })

  it('un point coupe la scène en deux', () => {
    expect(segmentsFrom([8], DURATION)).toEqual([
      { index: 0, start: 0, end: 8 },
      { index: 1, start: 8, end: 20 },
    ])
  })

  it('les segments se touchent bord à bord, sans trou', () => {
    const segments = segmentsFrom([5, 12], DURATION)
    expect(segments[0]?.end).toBe(segments[1]?.start)
    expect(segments[1]?.end).toBe(segments[2]?.start)
    expect(segments.at(-1)?.end).toBe(DURATION)
  })

  it('ordonne des points donnés en désordre', () => {
    expect(segmentsFrom([12, 5], DURATION)).toEqual(segmentsFrom([5, 12], DURATION))
  })

  it('ignore les doublons', () => {
    expect(segmentsFrom([5, 5], DURATION)).toHaveLength(2)
  })

  it('numérote sans trou', () => {
    expect(segmentsFrom([4, 9, 14], DURATION).map((s) => s.index)).toEqual([
      0, 1, 2, 3,
    ])
  })
})

describe('canAddBreakpoint', () => {
  it('accepte un point au milieu', () => {
    expect(canAddBreakpoint([], 10, DURATION)).toBe(true)
  })

  it('refuse hors du clip et sur les bords', () => {
    expect(canAddBreakpoint([], 0, DURATION)).toBe(false)
    expect(canAddBreakpoint([], DURATION, DURATION)).toBe(false)
    expect(canAddBreakpoint([], -1, DURATION)).toBe(false)
    expect(canAddBreakpoint([], 99, DURATION)).toBe(false)
  })

  it('refuse un segment plus court que le minimum', () => {
    expect(canAddBreakpoint([], MIN_SEGMENT_SEC / 2, DURATION)).toBe(false)
    expect(canAddBreakpoint([10], 10.2, DURATION)).toBe(false)
  })

  it('accepte exactement à la distance minimale', () => {
    expect(canAddBreakpoint([10], 10 + MIN_SEGMENT_SEC, DURATION)).toBe(true)
  })
})

describe('addBreakpoint', () => {
  it('ajoute et trie', () => {
    expect(addBreakpoint([10], 5, DURATION)).toEqual([5, 10])
  })

  it('ne fait rien si le point est invalide', () => {
    expect(addBreakpoint([10], 10.1, DURATION)).toEqual([10])
  })

  it('ne modifie pas le tableau d’origine', () => {
    const points = [10]
    addBreakpoint(points, 5, DURATION)
    expect(points).toEqual([10])
  })
})

describe('removeBreakpoint', () => {
  it('retire le point demandé', () => {
    expect(removeBreakpoint([4, 9, 14], 1)).toEqual([4, 14])
  })

  it('ignore un index hors limites', () => {
    expect(removeBreakpoint([4, 9], 5)).toEqual([4, 9])
  })
})

describe('moveBreakpoint', () => {
  it('déplace un point isolé', () => {
    expect(moveBreakpoint([10], 0, 6, DURATION)).toEqual([6])
  })

  it('le retient avant son voisin de gauche', () => {
    expect(moveBreakpoint([5, 10], 1, 5.1, DURATION)[1]).toBeCloseTo(
      5 + MIN_SEGMENT_SEC,
      3,
    )
  })

  it('le retient après son voisin de droite', () => {
    expect(moveBreakpoint([5, 10], 0, 9.9, DURATION)[0]).toBeCloseTo(
      10 - MIN_SEGMENT_SEC,
      3,
    )
  })

  it('le retient aux bords du clip', () => {
    expect(moveBreakpoint([10], 0, -5, DURATION)[0]).toBeCloseTo(MIN_SEGMENT_SEC, 3)
    expect(moveBreakpoint([10], 0, 99, DURATION)[0]).toBeCloseTo(
      DURATION - MIN_SEGMENT_SEC,
      3,
    )
  })

  it('conserve l’ordre', () => {
    expect(moveBreakpoint([5, 10, 15], 1, 12, DURATION)).toEqual([5, 12, 15])
  })
})

describe('segmentAt', () => {
  const segments = segmentsFrom([5, 12], DURATION)

  it('trouve le segment qui contient l’instant', () => {
    expect(segmentAt(segments, 0)?.index).toBe(0)
    expect(segmentAt(segments, 7)?.index).toBe(1)
    expect(segmentAt(segments, 19.9)?.index).toBe(2)
  })

  it('rend le dernier segment au-delà de la fin', () => {
    expect(segmentAt(segments, 99)?.index).toBe(2)
  })

  it('rend null sans segment', () => {
    expect(segmentAt([], 3)).toBeNull()
  })
})

describe('stepSegment', () => {
  const segments = segmentsFrom([5, 12], DURATION)

  it('avance et recule d’un segment', () => {
    expect(stepSegment(segments, segments[0]!, 1)?.index).toBe(1)
    expect(stepSegment(segments, segments[1]!, -1)?.index).toBe(0)
  })

  it('ne dépasse jamais les bornes', () => {
    expect(stepSegment(segments, segments[0]!, -1)?.index).toBe(0)
    expect(stepSegment(segments, segments[2]!, 1)?.index).toBe(2)
  })

  it('part du premier quand rien n’est courant', () => {
    expect(stepSegment(segments, null, 1)?.index).toBe(0)
  })
})
