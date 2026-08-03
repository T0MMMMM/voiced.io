import { describe, expect, it } from 'vitest'
import { FLOOR, GAMES, getShape, type Game } from './games'

const BARS = 56
const trace = (game: Game) =>
  Array.from({ length: BARS }, (_, i) => getShape(game.id)(i, BARS))

const byId = (id: string) => {
  const game = GAMES.find((candidate) => candidate.id === id)
  if (!game) throw new Error(`jeu ${id} absent`)
  return game
}

describe('formes d’onde des jeux', () => {
  it('restent dans les bornes affichables', () => {
    for (const game of GAMES) {
      for (const amplitude of trace(game)) {
        expect(amplitude).toBeGreaterThanOrEqual(0)
        expect(amplitude).toBeLessThanOrEqual(1)
      }
    }
  })

  it('sont deterministes', () => {
    for (const game of GAMES) {
      expect(trace(game)).toEqual(trace(game))
    }
  })

  it('donnent a chaque jeu une silhouette distincte', () => {
    const signatures = GAMES.map((game) =>
      trace(game)
        .map((amplitude) => Math.round(amplitude * 10))
        .join(''),
    )
    expect(new Set(signatures).size).toBe(GAMES.length)
  })
})

describe('« La suite » s’arrête net', () => {
  const amplitudes = trace(byId('next'))
  const cut = Math.floor(BARS * 0.52)

  it('parle pendant la première moitié', () => {
    const spoken = amplitudes.slice(0, cut)
    expect(Math.max(...spoken)).toBeGreaterThan(0.5)
  })

  it('tombe à zéro après la coupure, et y reste', () => {
    // C'est la regle du jeu rendue visible : le son se coupe.
    expect(amplitudes.slice(cut + 1).every((a) => a === 0)).toBe(true)
  })
})

describe('« Animaux » alterne cris et silences', () => {
  const amplitudes = trace(byId('beast'))

  it('reste au plancher la plupart du temps', () => {
    const quiet = amplitudes.filter((a) => a <= FLOOR + 0.01).length
    expect(quiet).toBeGreaterThan(BARS / 2)
  })

  it('comporte de vrais pics', () => {
    expect(Math.max(...amplitudes)).toBeGreaterThan(0.7)
  })
})

describe('« Quiz » bat une mesure régulière', () => {
  it('alterne impulsions et creux', () => {
    const amplitudes = trace(byId('quiz'))
    const peaks = amplitudes.filter((a) => a > 0.6).length
    const troughs = amplitudes.filter((a) => a < 0.2).length
    expect(peaks).toBeGreaterThan(3)
    expect(troughs).toBeGreaterThan(peaks)
  })
})
