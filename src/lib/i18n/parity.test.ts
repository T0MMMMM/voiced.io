import { describe, expect, it } from 'vitest'
import { en } from './en'
import { fr } from './fr'
import { resolveLocale } from './locales'

/** Les chemins de toutes les feuilles d'un dictionnaire, à plat. */
function keys(node: unknown, prefix = ''): string[] {
  if (typeof node !== 'object' || node === null) return [prefix]
  return Object.entries(node).flatMap(([key, value]) =>
    keys(value, prefix ? `${prefix}.${key}` : key),
  )
}

describe('dictionnaires', () => {
  it('portent exactement les mêmes clés', () => {
    // C'est tout l'interet du dictionnaire francais comme source de
    // verite : une cle oubliee laisserait une phrase francaise au milieu
    // d'un ecran anglais, ou l'inverse, sans que rien ne le signale.
    expect(keys(en).sort()).toEqual(keys(fr).sort())
  })

  it('gardent le même type à chaque clé', () => {
    // Une chaine d'un cote et une fonction de l'autre planterait a
    // l'affichage, pas a la compilation.
    function types(node: unknown, prefix = ''): string[] {
      if (typeof node !== 'object' || node === null) {
        return [`${prefix}:${typeof node}`]
      }
      return Object.entries(node).flatMap(([key, value]) =>
        types(value, prefix ? `${prefix}.${key}` : key),
      )
    }
    expect(types(en).sort()).toEqual(types(fr).sort())
  })

  it('ne laissent aucune valeur vide', () => {
    for (const dictionary of [fr, en]) {
      const empty = keys(dictionary).filter((path) => {
        const value = path
          .split('.')
          .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], dictionary)
        return typeof value === 'string' && value.trim() === ''
      })
      expect(empty).toEqual([])
    }
  })
})

describe('resolveLocale', () => {
  it('rend l’anglais pour la valeur exacte', () => {
    expect(resolveLocale('en')).toBe('en')
  })

  it('retombe sur le français pour tout le reste', () => {
    // Le site propose, il n'impose pas : pas de lecture de la langue du
    // navigateur, un choix explicite et memorise.
    expect(resolveLocale(null)).toBe('fr')
    expect(resolveLocale('EN')).toBe('fr')
    expect(resolveLocale('de')).toBe('fr')
    expect(resolveLocale('')).toBe('fr')
  })
})
