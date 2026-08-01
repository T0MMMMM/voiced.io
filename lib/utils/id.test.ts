import { describe, expect, it } from 'vitest'
import {
  generateRoomCode,
  isValidRoomCode,
  normalizeRoomCode,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
} from './id'

describe('ROOM_CODE_ALPHABET', () => {
  it('ne contient aucune voyelle', () => {
    for (const vowel of 'AEIOUY') {
      expect(ROOM_CODE_ALPHABET).not.toContain(vowel)
    }
  })

  it('ne contient aucun chiffre', () => {
    expect(ROOM_CODE_ALPHABET).not.toMatch(/\d/)
  })

  it('ne contient aucun doublon', () => {
    expect(new Set(ROOM_CODE_ALPHABET).size).toBe(ROOM_CODE_ALPHABET.length)
  })

  it('offre assez de combinaisons', () => {
    expect(ROOM_CODE_ALPHABET.length ** ROOM_CODE_LENGTH).toBeGreaterThan(100_000)
  })
})

describe('generateRoomCode', () => {
  it('produit un code de la bonne longueur', () => {
    expect(generateRoomCode()).toHaveLength(ROOM_CODE_LENGTH)
  })

  it("n'utilise que des lettres de l'alphabet autorisé", () => {
    for (let i = 0; i < 200; i++) {
      for (const char of generateRoomCode()) {
        expect(ROOM_CODE_ALPHABET).toContain(char)
      }
    }
  })

  it('produit des codes variés', () => {
    const codes = new Set(Array.from({ length: 200 }, generateRoomCode))
    expect(codes.size).toBeGreaterThan(150)
  })

  it('produit des codes que isValidRoomCode accepte', () => {
    for (let i = 0; i < 50; i++) {
      expect(isValidRoomCode(generateRoomCode())).toBe(true)
    }
  })
})

describe('normalizeRoomCode', () => {
  it('met en majuscules', () => {
    expect(normalizeRoomCode('bcdf')).toBe('BCDF')
  })

  it('retire les espaces internes et externes', () => {
    expect(normalizeRoomCode('  B C D F ')).toBe('BCDF')
  })

  it('retire les tirets, souvent tapés par habitude', () => {
    expect(normalizeRoomCode('BC-DF')).toBe('BCDF')
  })
})

describe('isValidRoomCode', () => {
  it('accepte un code valide', () => {
    expect(isValidRoomCode('BCDF')).toBe(true)
  })

  it('refuse une mauvaise longueur', () => {
    expect(isValidRoomCode('BCD')).toBe(false)
    expect(isValidRoomCode('BCDFG')).toBe(false)
  })

  it("refuse une lettre hors de l'alphabet", () => {
    expect(isValidRoomCode('BCDA')).toBe(false)
    expect(isValidRoomCode('BCD1')).toBe(false)
  })

  it('refuse les minuscules non normalisées', () => {
    expect(isValidRoomCode('bcdf')).toBe(false)
  })
})
