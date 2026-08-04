import { describe, expect, it } from 'vitest'
import { KIND_LABELS, type QuestionKind } from './kinds'
import { PACE_CHOICES, secondsFor } from './timing'

const KINDS = Object.keys(KIND_LABELS) as QuestionKind[]

describe('secondsFor', () => {
  it('donne son temps a chaque forme connue', () => {
    // Une forme oubliee retomberait sur la duree d'une reponse ecrite, ce
    // qui etranglerait silencieusement la question.
    for (const kind of KINDS) {
      expect(secondsFor(kind, 1, 'normal')).toBeGreaterThan(0)
    }
  })

  it('accorde plus de temps a une question difficile', () => {
    expect(secondsFor('ecrite', 3, 'normal')).toBeGreaterThan(
      secondsFor('ecrite', 1, 'normal'),
    )
  })

  it('accorde plus de temps a un petit bac qu’a une reponse ecrite', () => {
    // Quatre categories a remplir contre un mot : le meme minuteur pour
    // les deux etait precisement le defaut a corriger.
    expect(secondsFor('petit_bac', 1, 'normal')).toBeGreaterThan(
      secondsFor('ecrite', 3, 'normal'),
    )
  })

  it('classe les rythmes du plus long au plus court', () => {
    const times = PACE_CHOICES.map((choice) =>
      secondsFor('liste', 2, choice.value),
    )
    expect(times).toEqual([...times].sort((a, b) => b - a))
  })

  it('ne descend jamais sous dix secondes', () => {
    // Le rythme rapide raccourcit ; il ne doit pas rendre une question
    // illisible.
    for (const kind of KINDS) {
      expect(secondsFor(kind, 1, 'rapide')).toBeGreaterThanOrEqual(10)
    }
  })

  it('rend un nombre entier de secondes', () => {
    for (const kind of KINDS) {
      const value = secondsFor(kind, 2, 'calme')
      expect(Number.isInteger(value)).toBe(true)
    }
  })

  it('supporte une difficulte hors bornes sans exploser', () => {
    // La difficulte vient de la base : rien ne garantit qu'elle vaille 1, 2
    // ou 3, et une question ne doit pas se retrouver sans minuteur.
    expect(secondsFor('ecrite', 0, 'normal')).toBe(secondsFor('ecrite', 1, 'normal'))
    expect(secondsFor('ecrite', 9, 'normal')).toBe(secondsFor('ecrite', 3, 'normal'))
  })
})
