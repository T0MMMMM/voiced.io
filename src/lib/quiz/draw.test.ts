import { describe, expect, it } from 'vitest'
import { drawQuestions, MAX_PER_KIND, spreadKinds, type Drawable } from './draw'

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

describe('spreadKinds', () => {
  /** Les paires de formes identiques qui se suivent, hors réponse écrite. */
  function repeats(questions: Drawable[]): number {
    return questions.filter(
      (question, index) =>
        index > 0 &&
        question.kind === questions[index - 1]?.kind &&
        question.kind !== 'ecrite',
    ).length
  }

  it('n’enchaîne jamais deux fois la même forme', () => {
    // Deux cartes de suite, c'est le meme geste deux fois : la partie
    // donne l'impression de tourner en rond.
    const melange = [
      ...pool('carte', 5),
      ...pool('frise', 5),
      ...pool('intrus', 5),
    ]
    expect(repeats(spreadKinds(melange))).toBe(0)
  })

  it('laisse les réponses écrites se suivre', () => {
    // C'est le fond de la partie, pas une forme dont il faut se méfier.
    const ecrites = pool('ecrite', 6)
    expect(spreadKinds(ecrites)).toHaveLength(6)
  })

  it('garde toutes les questions, sans doublon', () => {
    const melange = [...pool('carte', 4), ...pool('liste', 3), ...pool('ecrite', 5)]
    const spread = spreadKinds(melange)
    expect(spread).toHaveLength(melange.length)
    expect(new Set(spread.map((q) => q.id)).size).toBe(melange.length)
  })

  it('reste jouable quand une seule forme domine', () => {
    // Rien ne permet d'alterner : mieux vaut une partie qui alterne mal
    // qu'une partie amputée.
    const melange = [...pool('carte', 6), ...pool('liste', 1)]
    expect(spreadKinds(melange)).toHaveLength(7)
  })

  it('sort déjà espacé du tirage', () => {
    const melange = [...pool('carte', 10), ...pool('frise', 10)]
    expect(repeats(drawQuestions(melange, 20, fixed))).toBe(0)
  })
})
