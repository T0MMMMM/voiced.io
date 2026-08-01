import { describe, expect, it } from 'vitest'
import {
  clamp,
  formatDuration,
  formatTimecode,
  msToSeconds,
  overlaps,
  parseTimecode,
  secondsToMs,
} from './time'

describe('formatTimecode', () => {
  it('formate en mm:ss.cc', () => {
    expect(formatTimecode(83.45)).toBe('01:23.45')
  })

  it('remplit les zéros à gauche', () => {
    expect(formatTimecode(0)).toBe('00:00.00')
    expect(formatTimecode(4.2)).toBe('00:04.20')
  })

  it('gère les durées supérieures à 10 minutes', () => {
    expect(formatTimecode(725.03)).toBe('12:05.03')
  })

  it('tronque les centièmes au lieu d’arrondir', () => {
    // Arrondir ferait afficher une position déjà dépassée par la lecture.
    expect(formatTimecode(1.999)).toBe('00:01.99')
  })

  it('ramène les valeurs négatives à zéro', () => {
    expect(formatTimecode(-5)).toBe('00:00.00')
  })

  it('gère NaN sans planter', () => {
    expect(formatTimecode(Number.NaN)).toBe('00:00.00')
  })
})

describe('formatDuration', () => {
  it('formate en m:ss sans zéro initial sur les minutes', () => {
    expect(formatDuration(83)).toBe('1:23')
    expect(formatDuration(9)).toBe('0:09')
  })

  it('arrondit à la seconde supérieure', () => {
    // Une scène de 8.4 s annoncée « 0:08 » paraît plus courte qu'elle ne l'est.
    expect(formatDuration(8.4)).toBe('0:09')
  })
})

describe('parseTimecode', () => {
  it('lit un timecode complet', () => {
    expect(parseTimecode('01:23.45')).toBeCloseTo(83.45, 5)
  })

  it('accepte un timecode sans centièmes', () => {
    expect(parseTimecode('01:23')).toBeCloseTo(83, 5)
  })

  it('retourne null pour une entrée invalide', () => {
    expect(parseTimecode('abc')).toBeNull()
    expect(parseTimecode('')).toBeNull()
    expect(parseTimecode('1:2:3')).toBeNull()
  })

  it('fait un aller-retour avec formatTimecode', () => {
    expect(parseTimecode(formatTimecode(83.45))).toBeCloseTo(83.45, 2)
  })
})

describe('clamp', () => {
  it('borne la valeur dans l’intervalle', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(42, 0, 10)).toBe(10)
  })
})

describe('conversions', () => {
  it('convertit secondes vers millisecondes en entier', () => {
    expect(secondsToMs(1.234)).toBe(1234)
    expect(secondsToMs(1.2345)).toBe(1235)
  })

  it('convertit millisecondes vers secondes', () => {
    expect(msToSeconds(1234)).toBeCloseTo(1.234, 5)
  })
})

describe('overlaps', () => {
  it('détecte un chevauchement', () => {
    expect(overlaps({ start: 0, end: 5 }, { start: 3, end: 8 })).toBe(true)
  })

  it('ne considère pas deux intervalles adjacents comme chevauchants', () => {
    // Les scènes se touchent bord à bord par construction : ce n'est pas une erreur.
    expect(overlaps({ start: 0, end: 5 }, { start: 5, end: 8 })).toBe(false)
  })

  it('détecte un intervalle contenu dans un autre', () => {
    expect(overlaps({ start: 0, end: 10 }, { start: 2, end: 4 })).toBe(true)
  })

  it('retourne false pour deux intervalles disjoints', () => {
    expect(overlaps({ start: 0, end: 2 }, { start: 5, end: 8 })).toBe(false)
  })
})
