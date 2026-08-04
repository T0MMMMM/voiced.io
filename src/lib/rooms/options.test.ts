import { describe, expect, it } from 'vitest'
import { DEFAULT_OPTIONS, mergeOptions, TIMER_CHOICES } from './options'

describe('mergeOptions', () => {
  it('rend les valeurs par defaut sur un salon neuf', () => {
    expect(mergeOptions({})).toEqual(DEFAULT_OPTIONS)
  })

  it('conserve les valeurs connues', () => {
    expect(mergeOptions({ timerSec: 30, shuffle: true })).toMatchObject({
      timerSec: 30,
      shuffle: true,
    })
  })

  it('complete les cles absentes par leur defaut', () => {
    const merged = mergeOptions({ timerSec: 15 })
    expect(merged.anonymousGrading).toBe(DEFAULT_OPTIONS.anonymousGrading)
    expect(merged.allowBets).toBe(DEFAULT_OPTIONS.allowBets)
  })

  it('ignore les cles inconnues', () => {
    const merged = mergeOptions({ couleurPreferee: 'vert', timerSec: 60 })
    expect(merged).not.toHaveProperty('couleurPreferee')
    expect(merged.timerSec).toBe(60)
  })

  it('rejette une duree de minuteur hors des choix proposes', () => {
    // Le jsonb accepte n'importe quoi : c'est ici qu'on referme la porte.
    expect(mergeOptions({ timerSec: 7 }).timerSec).toBe(DEFAULT_OPTIONS.timerSec)
    expect(mergeOptions({ timerSec: -1 }).timerSec).toBe(DEFAULT_OPTIONS.timerSec)
  })

  it('ramene les anciens salons sans minuteur a la valeur par defaut', () => {
    // Des parties ont ete creees quand « aucun » existait encore.
    expect(mergeOptions({ timerSec: 0 }).timerSec).toBe(DEFAULT_OPTIONS.timerSec)
  })

  it('rejette un type inattendu', () => {
    expect(mergeOptions({ shuffle: 'oui' }).shuffle).toBe(DEFAULT_OPTIONS.shuffle)
    expect(mergeOptions({ timerSec: '30' }).timerSec).toBe(DEFAULT_OPTIONS.timerSec)
  })

  it('survit a une entree qui n’est pas un objet', () => {
    // Une colonne jsonb peut contenir null, un nombre ou une chaine.
    expect(mergeOptions(null)).toEqual(DEFAULT_OPTIONS)
    expect(mergeOptions(undefined)).toEqual(DEFAULT_OPTIONS)
    expect(mergeOptions('cassé')).toEqual(DEFAULT_OPTIONS)
    expect(mergeOptions(42)).toEqual(DEFAULT_OPTIONS)
    expect(mergeOptions([1, 2])).toEqual(DEFAULT_OPTIONS)
  })

  it('ne partage pas de reference avec les defauts', () => {
    // Sinon muter le resultat contaminerait tous les salons suivants.
    const merged = mergeOptions({})
    merged.shuffle = !merged.shuffle
    expect(DEFAULT_OPTIONS.shuffle).not.toBe(merged.shuffle)
  })
})

describe('TIMER_CHOICES', () => {
  it('n’offre plus « aucun minuteur »', () => {
    // C'est le temps qui fait avancer la partie : personne ne peut sauter
    // une question, et sans minuteur un joueur qui ne repond pas figerait
    // tout le monde indefiniment.
    expect(TIMER_CHOICES.map((choice) => choice.value)).not.toContain(0)
  })

  it('propose des durees croissantes', () => {
    const values = TIMER_CHOICES.map((choice) => choice.value)
    expect([...values].sort((a, b) => a - b)).toEqual(values)
  })

  it('contient la valeur par defaut', () => {
    expect(TIMER_CHOICES.map((choice) => choice.value)).toContain(
      DEFAULT_OPTIONS.timerSec,
    )
  })
})
