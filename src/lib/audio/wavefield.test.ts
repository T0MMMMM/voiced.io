import { describe, expect, it } from 'vitest'
import { amplitudeAt, FLOOR } from './wavefield'

const BARS = 84
const frame = (t: number) =>
  Array.from({ length: BARS }, (_, i) => amplitudeAt(i, t))

describe('amplitudeAt', () => {
  it('reste dans les bornes affichables', () => {
    for (const t of [0, 0.3, 1.7, 12.4, 60]) {
      for (const amplitude of frame(t)) {
        expect(amplitude).toBeGreaterThanOrEqual(FLOOR)
        expect(amplitude).toBeLessThanOrEqual(1)
      }
    }
  })

  it('est deterministe', () => {
    expect(frame(3.2)).toEqual(frame(3.2))
  })
})

describe('cohérence spatiale', () => {
  // C'est la propriété qui fait la différence entre une vague et un
  // scintillement : deux barres voisines lisent deux points proches de la
  // même courbe, leurs hauteurs doivent donc se ressembler.
  it('les barres voisines ne sautent jamais brutalement', () => {
    for (const t of [0, 0.9, 4.4, 21.6]) {
      const amplitudes = frame(t)
      for (let i = 1; i < BARS; i++) {
        const gap = Math.abs((amplitudes[i] ?? 0) - (amplitudes[i - 1] ?? 0))
        expect(gap).toBeLessThan(0.34)
      }
    }
  })

  it('l’écart moyen entre voisines reste faible', () => {
    const amplitudes = frame(7.1)
    let total = 0
    for (let i = 1; i < BARS; i++) {
      total += Math.abs((amplitudes[i] ?? 0) - (amplitudes[i - 1] ?? 0))
    }
    expect(total / (BARS - 1)).toBeLessThan(0.14)
  })
})

describe('mouvement', () => {
  it('la piste bouge d’une image à l’autre', () => {
    // Une image à 60 Hz : le changement doit être perceptible mais doux.
    const before = frame(5)
    const after = frame(5 + 1 / 60)
    expect(before).not.toEqual(after)
  })

  it('n’a aucune zone morte : chaque barre bouge sur quatre secondes', () => {
    // La propriete qui compte n'est pas que tout bouge au meme instant —
    // avec des vagues larges, certaines zones passent par un noeud. C'est
    // qu'aucune portion de la piste ne reste figee.
    //
    // La fenetre couvre quatre secondes : la composante la plus lente du
    // champ a une periode voisine, et juger sur moins reviendrait a juger
    // une vague sur une fraction de sa course. Le minimum mesure est de
    // 0,21 — le seuil garde donc de la marge tout en attrapant un vrai gel.
    const samples = Array.from({ length: 49 }, (_, k) => frame(5 + k / 12))

    for (let i = 0; i < BARS; i++) {
      const values = samples.map((s) => s[i] ?? 0)
      const swing = Math.max(...values) - Math.min(...values)
      expect(swing).toBeGreaterThan(0.1)
    }
  })

  it('ne se fige jamais sur une valeur unique', () => {
    const amplitudes = frame(9.3)
    expect(Math.max(...amplitudes) - Math.min(...amplitudes)).toBeGreaterThan(0.4)
  })
})
