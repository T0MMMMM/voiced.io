import { describe, expect, it } from 'vitest'
import { areClose, editDistance, groupAnswers, normalizeAnswer } from './similarity'

describe('normalizeAnswer', () => {
  it('ignore la casse', () => {
    expect(normalizeAnswer('Napoléon')).toBe(normalizeAnswer('NAPOLÉON'))
  })

  it('ignore les accents', () => {
    expect(normalizeAnswer('Napoléon')).toBe('napoleon')
    expect(normalizeAnswer('Élysée')).toBe('elysee')
  })

  it('ignore la ponctuation et les espaces en trop', () => {
    expect(normalizeAnswer('  Jules   César !! ')).toBe('jules cesar')
  })

  it('ignore les articles', () => {
    expect(normalizeAnswer('la Loire')).toBe('loire')
    expect(normalizeAnswer('le Nil')).toBe('nil')
  })

  it('conserve les chiffres', () => {
    expect(normalizeAnswer('1789')).toBe('1789')
  })

  it('rend une chaîne vide sur une réponse vide', () => {
    expect(normalizeAnswer('   ')).toBe('')
  })
})

describe('editDistance', () => {
  it('rend zéro pour deux textes identiques', () => {
    expect(editDistance('paris', 'paris')).toBe(0)
  })

  it('compte les caractères à changer', () => {
    expect(editDistance('paris', 'pares')).toBe(1)
    expect(editDistance('chat', 'chats')).toBe(1)
    expect(editDistance('abc', 'xyz')).toBe(3)
  })

  it('gère les chaînes vides', () => {
    expect(editDistance('', 'abc')).toBe(3)
    expect(editDistance('abc', '')).toBe(3)
    expect(editDistance('', '')).toBe(0)
  })
})

describe('areClose', () => {
  it('rapproche une faute de frappe sur un mot long', () => {
    expect(areClose('napoleon bonaparte', 'napoleon bonapart')).toBe(true)
  })

  it('sépare deux mots courts qui diffèrent', () => {
    // Sur quatre lettres, une faute change le sens.
    expect(areClose('rome', 'rive')).toBe(false)
  })

  it('rapproche une réponse plus détaillée', () => {
    expect(areClose('napoleon', 'napoleon bonaparte')).toBe(true)
  })

  it('sépare deux réponses franchement différentes', () => {
    expect(areClose('napoleon', 'jules cesar')).toBe(false)
  })

  it('gère les réponses vides', () => {
    expect(areClose('', 'paris')).toBe(false)
    expect(areClose('', '')).toBe(true)
  })
})

describe('groupAnswers', () => {
  it('range ensemble les variantes d’une même réponse', () => {
    const groups = groupAnswers([
      { id: '1', text: 'Napoléon' },
      { id: '2', text: 'napoleon' },
      { id: '3', text: 'Napoléon Bonaparte' },
      { id: '4', text: 'NAPOLEON  ' },
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.entries).toHaveLength(4)
  })

  it('sépare des réponses distinctes', () => {
    const groups = groupAnswers([
      { id: '1', text: 'Napoléon' },
      { id: '2', text: 'Jules César' },
      { id: '3', text: 'napoleon' },
    ])

    expect(groups).toHaveLength(2)
  })

  it('présente d’abord le groupe le plus fourni', () => {
    // L'hote avance du plus rentable au plus marginal.
    const groups = groupAnswers([
      { id: '1', text: 'Rome' },
      { id: '2', text: 'Paris' },
      { id: '3', text: 'paris' },
      { id: '4', text: 'PARIS' },
    ])

    expect(groups[0]?.entries).toHaveLength(3)
    expect(groups[1]?.entries).toHaveLength(1)
  })

  it('retient la forme la plus courte comme étiquette', () => {
    const groups = groupAnswers([
      { id: '1', text: 'Napoléon Bonaparte' },
      { id: '2', text: 'Napoléon' },
    ])

    expect(groups[0]?.label).toBe('Napoléon')
  })

  it('n’oublie aucune réponse', () => {
    const entries = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      text: `réponse ${i}`,
    }))
    const total = groupAnswers(entries).reduce(
      (sum, group) => sum + group.entries.length,
      0,
    )
    expect(total).toBe(12)
  })

  it('gère une liste vide', () => {
    expect(groupAnswers([])).toEqual([])
  })
})
