import { describe, expect, it } from 'vitest'
import { scoreList, scoreWritten } from './scoring'

const PEINTRE = ['Léonard de Vinci', 'De Vinci', 'Vinci']

describe('scoreWritten', () => {
  it('accepte la formulation de référence', () => {
    expect(scoreWritten('Léonard de Vinci', PEINTRE)).toBe(1)
  })

  it('accepte une variante déclarée', () => {
    expect(scoreWritten('De Vinci', PEINTRE)).toBe(1)
  })

  it('tolère accents et casse', () => {
    expect(scoreWritten('leonard de vinci', PEINTRE)).toBe(1)
    expect(scoreWritten('LEONARD DE VINCI', PEINTRE)).toBe(1)
  })

  it('tolère une faute de frappe sur un nom long', () => {
    expect(scoreWritten('Leonard de Vinchi', PEINTRE)).toBe(1)
  })

  it('refuse une autre réponse', () => {
    expect(scoreWritten('Michel-Ange', PEINTRE)).toBe(0)
  })

  it('refuse une réponse vide', () => {
    expect(scoreWritten('', PEINTRE)).toBe(0)
    expect(scoreWritten('   ', PEINTRE)).toBe(0)
  })
})

const OCEANIE = [
  'Australie',
  'Nouvelle-Zélande',
  'Papouasie-Nouvelle-Guinée',
  'Fidji',
  'Samoa',
  'Tonga',
  'Vanuatu',
  'Palaos',
  'Nauru',
  'Tuvalu',
  'Kiribati',
  'Micronésie',
  'Îles Marshall',
  'Îles Salomon',
]

describe('scoreList', () => {
  it('donne tout quand le compte est atteint', () => {
    expect(
      scoreList(['Australie', 'Fidji', 'Samoa', 'Tonga'], OCEANIE, 4),
    ).toBe(1)
  })

  it('donne une fraction par bonne réponse', () => {
    expect(scoreList(['Australie', 'Fidji'], OCEANIE, 4)).toBe(0.5)
  })

  it('ne compte pas deux fois la même réponse', () => {
    // Citer quatre fois l'Australie ne vaut pas quatre pays.
    expect(
      scoreList(['Australie', 'Australie', 'australie', 'AUSTRALIE'], OCEANIE, 4),
    ).toBe(0.25)
  })

  it('ne compte pas les mauvaises réponses', () => {
    expect(
      scoreList(['Australie', 'Brésil', 'Japon', 'Canada'], OCEANIE, 4),
    ).toBe(0.25)
  })

  it('ne récompense pas l’arrosage', () => {
    // En donner huit quand on en demande quatre ne rapporte pas le double.
    const eight = [...OCEANIE.slice(0, 8)]
    expect(scoreList(eight, OCEANIE, 4)).toBe(1)
  })

  it('tolère accents et fautes sur chaque élément', () => {
    expect(
      scoreList(
        ['australie', 'nouvelle zelande', 'papouasie nouvelle guinee', 'fidji'],
        OCEANIE,
        4,
      ),
    ).toBe(1)
  })

  it('ignore les cases laissées vides', () => {
    expect(scoreList(['Australie', '', '  ', 'Fidji'], OCEANIE, 4)).toBe(0.5)
  })

  it('gère les cas dégénérés', () => {
    expect(scoreList([], OCEANIE, 4)).toBe(0)
    expect(scoreList(['Australie'], OCEANIE, 0)).toBe(0)
  })
})
