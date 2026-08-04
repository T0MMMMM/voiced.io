import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('concatène des classes simples', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('ignore les valeurs falsy', () => {
    expect(cn('px-2', false, undefined, null, '', 'py-1')).toBe('px-2 py-1')
  })

  it('applique les classes conditionnelles', () => {
    expect(cn('base', { actif: true, inactif: false })).toBe('base actif')
  })

  it('résout les conflits Tailwind en gardant la dernière classe', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('ne fusionne pas des utilitaires de familles différentes', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })
})
