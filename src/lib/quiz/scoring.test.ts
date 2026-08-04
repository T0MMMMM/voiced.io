import { describe, expect, it } from 'vitest'
import {
  distanceKm,
  scoreDistance,
  scoreEstimate,
  scoreOddOneOut,
  scorePairs,
  scoreRanking,
  scoreTimeline,
} from './scoring'

describe('scoreEstimate', () => {
  it('donne tout pour une réponse exacte', () => {
    expect(scoreEstimate(100, 100)).toBe(1)
  })

  it('tolère une erreur de moins de deux pour cent', () => {
    expect(scoreEstimate(101, 100)).toBe(1)
  })

  it('décroît avec l’écart relatif', () => {
    const proche = scoreEstimate(110, 100)
    const loin = scoreEstimate(150, 100)
    expect(proche).toBeGreaterThan(loin)
    expect(loin).toBeGreaterThan(0)
  })

  it('ne donne rien au-delà du double ou de la moitié', () => {
    expect(scoreEstimate(200, 100)).toBe(0)
    expect(scoreEstimate(0, 100)).toBe(0)
  })

  it('juge sur l’écart relatif, pas absolu', () => {
    // Se tromper de dix sur cent est grave ; de dix sur un million, non.
    expect(scoreEstimate(1_000_010, 1_000_000)).toBe(1)
    expect(scoreEstimate(110, 100)).toBeLessThan(1)
  })

  it('gère le zéro attendu et les valeurs illisibles', () => {
    expect(scoreEstimate(0, 0)).toBe(1)
    expect(scoreEstimate(5, 0)).toBe(0)
    expect(scoreEstimate(Number.NaN, 100)).toBe(0)
  })
})

describe('scoreRanking', () => {
  const attendu = ['a', 'b', 'c', 'd']

  it('donne tout pour un ordre parfait', () => {
    expect(scoreRanking(['a', 'b', 'c', 'd'], attendu)).toBe(1)
  })

  it('ne donne rien pour un ordre entièrement inversé', () => {
    expect(scoreRanking(['d', 'c', 'b', 'a'], attendu)).toBe(0)
  })

  it('récompense une réponse presque juste', () => {
    // Deux voisins intervertis : loin d'etre nul, loin d'etre parfait.
    const presque = scoreRanking(['a', 'c', 'b', 'd'], attendu)
    expect(presque).toBeGreaterThan(0.6)
    expect(presque).toBeLessThan(1)
  })

  it('classe les réponses de la meilleure à la pire', () => {
    const parfait = scoreRanking(['a', 'b', 'c', 'd'], attendu)
    const bon = scoreRanking(['a', 'c', 'b', 'd'], attendu)
    const moyen = scoreRanking(['b', 'a', 'd', 'c'], attendu)
    const nul = scoreRanking(['d', 'c', 'b', 'a'], attendu)
    expect(parfait).toBeGreaterThan(bon)
    expect(bon).toBeGreaterThan(moyen)
    expect(moyen).toBeGreaterThan(nul)
  })

  it('pénalise une réponse incomplète', () => {
    // Bien ordonner deux elements sur quatre ne vaut pas les avoir tous.
    expect(scoreRanking(['a', 'b'], attendu)).toBeLessThan(1)
  })

  it('ignore les éléments inventés', () => {
    expect(scoreRanking(['a', 'z', 'b', 'c', 'd'], attendu)).toBe(1)
  })

  it('gère les cas dégénérés', () => {
    expect(scoreRanking([], attendu)).toBe(0)
    expect(scoreRanking(['a'], ['a'])).toBe(1)
  })
})

describe('scoreTimeline', () => {
  it('donne tout pour l’année exacte', () => {
    expect(scoreTimeline(1789, 1789, 60)).toBe(1)
  })

  it('donne tout dans la tolérance annoncée', () => {
    // Dater un évènement antique à dix ans près est une bonne réponse ;
    // exiger l'année pile en ferait une loterie.
    expect(scoreTimeline(-2550, -2560, 500, 50)).toBe(1)
  })

  it('décroît avec l’écart en années', () => {
    const proche = scoreTimeline(1795, 1789, 60)
    const loin = scoreTimeline(1830, 1789, 60)
    expect(proche).toBeGreaterThan(loin)
    expect(loin).toBeGreaterThan(0)
  })

  it('mesure en années, pas en pourcentage', () => {
    // Dix ans d'écart valent la même chose sur 1789 que sur 1969, alors
    // que l'écart relatif les séparerait.
    expect(scoreTimeline(1799, 1789, 60)).toBeCloseTo(
      scoreTimeline(1979, 1969, 60),
      10,
    )
  })

  it('ne donne rien au-delà de l’écart maximal', () => {
    expect(scoreTimeline(1900, 1789, 60)).toBe(0)
    expect(scoreTimeline(1600, 1789, 60)).toBe(0)
  })

  it('note pareil en avance et en retard', () => {
    expect(scoreTimeline(1799, 1789, 60)).toBe(scoreTimeline(1779, 1789, 60))
  })

  it('ne donne rien pour une année absente', () => {
    expect(scoreTimeline(Number.NaN, 1789, 60)).toBe(0)
  })
})

describe('distanceKm', () => {
  it('mesure une distance connue', () => {
    // Paris : Marseille, environ 660 km a vol d'oiseau.
    const km = distanceKm({ lat: 48.857, lng: 2.352 }, { lat: 43.296, lng: 5.37 })
    expect(km).toBeGreaterThan(620)
    expect(km).toBeLessThan(700)
  })

  it('rend zéro pour deux points confondus', () => {
    expect(distanceKm({ lat: 10, lng: 20 }, { lat: 10, lng: 20 })).toBeCloseTo(0, 6)
  })
})

describe('scoreDistance', () => {
  const paris = { lat: 48.857, lng: 2.352 }

  it('donne tout pour un point exact', () => {
    expect(scoreDistance(paris, paris, 500)).toBe(1)
  })

  it('décroît avec la distance', () => {
    const proche = scoreDistance({ lat: 49.5, lng: 2.4 }, paris, 500)
    const loin = scoreDistance({ lat: 43.3, lng: 5.4 }, paris, 1000)
    expect(proche).toBeGreaterThan(loin)
  })

  it('ne donne rien au-delà du rayon', () => {
    expect(scoreDistance({ lat: -33.9, lng: 151.2 }, paris, 500)).toBe(0)
  })

  it('adapte l’exigence à l’échelle de la question', () => {
    const point = { lat: 49.5, lng: 2.4 }
    // Le meme ecart vaut mieux sur une question a l'echelle d'un continent.
    expect(scoreDistance(point, paris, 2000)).toBeGreaterThan(
      scoreDistance(point, paris, 200),
    )
  })
})

describe('scorePairs', () => {
  const attendu = { France: 'Paris', Italie: 'Rome', Espagne: 'Madrid' }

  it('donne tout pour un sans-faute', () => {
    expect(scorePairs(attendu, attendu)).toBe(1)
  })

  it('donne une fraction par paire juste', () => {
    expect(
      scorePairs({ France: 'Paris', Italie: 'Rome', Espagne: 'Lisbonne' }, attendu),
    ).toBeCloseTo(2 / 3, 5)
  })

  it('ne donne rien pour un sans-faute inversé', () => {
    expect(
      scorePairs({ France: 'Rome', Italie: 'Madrid', Espagne: 'Paris' }, attendu),
    ).toBe(0)
  })

  it('gère les paires manquantes', () => {
    expect(scorePairs({ France: 'Paris' }, attendu)).toBeCloseTo(1 / 3, 5)
    expect(scorePairs({}, {})).toBe(0)
  })
})

describe('scoreOddOneOut', () => {
  it('est tout ou rien : une seule réponse est juste', () => {
    expect(scoreOddOneOut('baleine', 'baleine')).toBe(1)
    expect(scoreOddOneOut('requin', 'baleine')).toBe(0)
  })
})
