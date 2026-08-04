import { describe, expect, it } from 'vitest'
import {
  DEFAULT_OPTIONS,
  KIND_CHOICES,
  mergeOptions,
  PACE_CHOICES,
} from './options'

describe('mergeOptions', () => {
  it('rend les valeurs par defaut sur un salon neuf', () => {
    expect(mergeOptions({})).toEqual(DEFAULT_OPTIONS)
  })

  it('conserve les valeurs connues', () => {
    expect(mergeOptions({ pace: 'rapide', shuffle: true })).toMatchObject({
      pace: 'rapide',
      shuffle: true,
    })
  })

  it('ignore une cle inconnue', () => {
    const merged = mergeOptions({ couleurPreferee: 'vert', pace: 'calme' })
    expect(merged).not.toHaveProperty('couleurPreferee')
    expect(merged.pace).toBe('calme')
  })

  it('retombe sur le defaut devant un rythme inconnu', () => {
    // La colonne est un jsonb libre : une version anterieure du salon y a
    // laisse des durees en secondes, qui ne veulent plus rien dire.
    expect(mergeOptions({ pace: 30 }).pace).toBe(DEFAULT_OPTIONS.pace)
    expect(mergeOptions({ pace: 'lent' }).pace).toBe(DEFAULT_OPTIONS.pace)
    expect(mergeOptions({ pace: null }).pace).toBe(DEFAULT_OPTIONS.pace)
  })

  it('resiste a une valeur qui n’est pas un objet', () => {
    expect(mergeOptions(null)).toEqual(DEFAULT_OPTIONS)
    expect(mergeOptions([1, 2])).toEqual(DEFAULT_OPTIONS)
    expect(mergeOptions('oui')).toEqual(DEFAULT_OPTIONS)
  })
})

describe('PACE_CHOICES', () => {
  it('contient la valeur par defaut', () => {
    expect(PACE_CHOICES.map((choice) => choice.value)).toContain(
      DEFAULT_OPTIONS.pace,
    )
  })

  it('ne propose plus de duree en secondes', () => {
    // Le temps se deduit de la question : reproposer « 30 s » reintroduirait
    // le reglage qu'on vient justement de retirer.
    for (const choice of PACE_CHOICES) {
      expect(choice.label).not.toMatch(/\d/)
    }
  })
})

describe('formes de questions', () => {
  it('ne garde que les formes connues', () => {
    expect(mergeOptions({ kinds: ['ecrite', 'sondage', 42] }).kinds).toEqual([
      'ecrite',
    ])
  })

  it('retombe sur tout quand la selection est vide', () => {
    // Un salon sans aucune forme n'aurait plus rien a tirer : mieux vaut
    // tout proposer que lancer une partie de zero question.
    expect(mergeOptions({ kinds: [] }).kinds).toEqual(DEFAULT_OPTIONS.kinds)
  })

  it('retombe sur tout quand la valeur n’est pas une liste', () => {
    expect(mergeOptions({ kinds: 'ecrite' }).kinds).toEqual(DEFAULT_OPTIONS.kinds)
  })

  it('rend les formes dans l’ordre du salon, pas celui du stockage', () => {
    // L'ordre vient de KIND_CHOICES : une liste stockee a l'envers ne doit
    // pas rendre l'affichage des reglages instable d'une partie a l'autre.
    expect(mergeOptions({ kinds: ['petit_bac', 'ecrite'] }).kinds).toEqual([
      'ecrite',
      'petit_bac',
    ])
  })

  it('n’offre aucune forme absente de la banque', () => {
    // Proposer « Extrait » dans le salon alors qu'aucune question sonore
    // n'existe reviendrait a promettre une partie qui ne tomberait jamais.
    expect(KIND_CHOICES.map((choice) => choice.value)).not.toContain('media')
  })
})
