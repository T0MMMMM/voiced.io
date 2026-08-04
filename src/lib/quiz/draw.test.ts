import { describe, expect, it } from 'vitest'
import { drawQuestions, MAX_PER_KIND, type Drawable } from './draw'

/** Un tirage previsible : sans lui, on testerait le hasard. */
const fixed = () => 0.5

function pool(kind: Drawable['kind'], howMany: number): Drawable[] {
  return Array.from({ length: howMany }, (_, index) => ({
    id: `${kind}-${index}`,
    kind,
  }))
}

describe('drawQuestions', () => {
  it('rend le nombre demandé quand la banque suffit', () => {
    expect(drawQuestions(pool('ecrite', 40), 20, fixed)).toHaveLength(20)
  })

  it('ne rend jamais plus d’un petit bac', () => {
    // Une minute a remplir, une minute a corriger : deux dans la meme
    // partie et la table decroche.
    const melange = [...pool('petit_bac', 10), ...pool('ecrite', 30)]
    const drawn = drawQuestions(melange, 20, fixed)
    expect(drawn.filter((q) => q.kind === 'petit_bac')).toHaveLength(1)
  })

  it('rend moins que demandé plutôt que de forcer un plafond', () => {
    // Un salon qui n'autorise que le petit bac obtient une partie courte,
    // pas une partie qui contourne son propre reglage.
    expect(drawQuestions(pool('petit_bac', 10), 20, fixed)).toHaveLength(1)
  })

  it('ne rend jamais deux fois la même question', () => {
    const drawn = drawQuestions(pool('ecrite', 30), 30, fixed)
    expect(new Set(drawn.map((q) => q.id)).size).toBe(drawn.length)
  })

  it('ne touche pas à la banque reçue', () => {
    const banque = pool('ecrite', 10)
    const copie = [...banque]
    drawQuestions(banque, 5, fixed)
    expect(banque).toEqual(copie)
  })

  it('rend une liste vide sur une banque vide', () => {
    expect(drawQuestions([], 20, fixed)).toEqual([])
  })

  it('ne plafonne que les formes qui le méritent', () => {
    // Plafonner une reponse ecrite viderait la plupart des parties.
    expect(MAX_PER_KIND.ecrite).toBeUndefined()
    expect(MAX_PER_KIND.petit_bac).toBe(1)
  })
})
