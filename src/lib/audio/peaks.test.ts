import { describe, expect, it } from 'vitest'
import { bucketPeaks } from './peaks'

const signal = (values: number[]) => Float32Array.from(values)

describe('bucketPeaks', () => {
  it('reduit le signal au nombre de tranches demande', () => {
    expect(bucketPeaks(signal([1, 2, 3, 4, 5, 6, 7, 8]), 4)).toHaveLength(4)
  })

  it('retient le maximum de chaque tranche, pas la moyenne', () => {
    // Une moyenne donnerait 0.5 partout et effacerait l'attaque.
    const peaks = bucketPeaks(signal([0, 1, 0, 0]), 2)
    expect(peaks[0]).toBe(1)
    expect(peaks[1]).toBe(0)
  })

  it('traite les valeurs negatives par leur amplitude', () => {
    const peaks = bucketPeaks(signal([-1, 0, 0.5, 0]), 2)
    expect(peaks[0]).toBe(1)
    expect(peaks[1]).toBeCloseTo(0.5, 5)
  })

  it('normalise sur le maximum du clip', () => {
    // Un extrait enregistre bas doit remplir la partition autant qu'un fort.
    const peaks = bucketPeaks(signal([0.1, 0.05, 0.2, 0.02]), 2)
    expect(Math.max(...peaks)).toBe(1)
  })

  it('renvoie des valeurs entre 0 et 1', () => {
    const peaks = bucketPeaks(signal([0.3, -0.9, 0.1, 0.6, -0.2, 0.4]), 3)
    expect(peaks.every((peak) => peak >= 0 && peak <= 1)).toBe(true)
  })

  it('ne divise pas par zero sur un silence complet', () => {
    expect(bucketPeaks(signal([0, 0, 0, 0]), 2)).toEqual([0, 0])
  })

  it('gere un signal plus court que le nombre de tranches', () => {
    expect(bucketPeaks(signal([1, 0]), 8)).toHaveLength(8)
  })

  it('renvoie un tableau vide sur une entree vide', () => {
    expect(bucketPeaks(signal([]), 10)).toEqual([])
    expect(bucketPeaks(signal([1, 2]), 0)).toEqual([])
  })
})
