import { describe, expect, it } from 'vitest'
import { OVERLAP_TOLERANCE_SEC, overlaps, replacedBy } from './overlap'

const span = (startSec: number, durationMs: number) => ({ startSec, durationMs })

describe('overlaps', () => {
  it('reconnaît deux prises franchement superposées', () => {
    expect(overlaps(span(2, 3000), span(3, 3000))).toBe(true)
  })

  it('reconnaît une prise contenue dans une autre', () => {
    expect(overlaps(span(0, 10_000), span(3, 2000))).toBe(true)
  })

  it('sépare deux prises éloignées', () => {
    expect(overlaps(span(0, 1000), span(5, 1000))).toBe(false)
  })

  it('ne déclare pas chevauchantes deux prises bord à bord', () => {
    // La premiere finit exactement ou la seconde commence.
    expect(overlaps(span(0.936, 732), span(1.668, 1218))).toBe(false)
  })

  it('résiste à l’erreur d’arithmétique flottante sur la borne', () => {
    // Le cas rencontre en vrai : 0.936 + 0.732 vaut 1.6680000000000001 en
    // virgule flottante, soit un cheveu au-dessus du debut de la suivante.
    // Un test strict concluait au chevauchement, et enregistrer un segment
    // effaçait celui d'avant.
    expect(0.936 + 732 / 1000).toBeGreaterThan(1.668)
    expect(overlaps(span(0.936, 732), span(1.668, 1218))).toBe(false)
  })

  it('ignore un frôlement plus court que la tolérance', () => {
    const graze = OVERLAP_TOLERANCE_SEC / 2
    expect(overlaps(span(0, 1000), span(1 - graze, 1000))).toBe(false)
  })

  it('retient un recouvrement plus long que la tolérance', () => {
    const real = OVERLAP_TOLERANCE_SEC * 3
    expect(overlaps(span(0, 1000), span(1 - real, 1000))).toBe(true)
  })

  it('est symétrique', () => {
    const a = span(1, 2000)
    const b = span(2, 2000)
    expect(overlaps(a, b)).toBe(overlaps(b, a))
  })
})

describe('replacedBy', () => {
  const existing = [
    { id: 'a', startSec: 0, durationMs: 900 },
    { id: 'b', startSec: 0.936, durationMs: 732 },
    { id: 'c', startSec: 1.668, durationMs: 1218 },
  ]

  it('ne remplace que ce qui se superpose vraiment', () => {
    const doomed = replacedBy(existing, span(1.668, 1218))
    expect(doomed.map((take) => take.id)).toEqual(['c'])
  })

  it('laisse les voisines tranquilles', () => {
    // C'est le bug rapporte : enregistrer le segment 3 supprimait le 2.
    const doomed = replacedBy(existing, span(1.668, 1218))
    expect(doomed.map((take) => take.id)).not.toContain('b')
  })

  it('remplace plusieurs prises couvertes par une longue', () => {
    const doomed = replacedBy(existing, span(0, 4000))
    expect(doomed.map((take) => take.id)).toEqual(['a', 'b', 'c'])
  })

  it('ne remplace rien quand la prise tombe dans un trou', () => {
    expect(replacedBy(existing, span(10, 2000))).toEqual([])
  })

  it('gère une liste vide', () => {
    expect(replacedBy([], span(0, 1000))).toEqual([])
  })
})
