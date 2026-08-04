/**
 * Uniquement des consonnes : cela élimine les confusions visuelles
 * (O/0, I/1) et rend impossible la génération accidentelle d'un mot,
 * ce qui compte pour un code affiché en grand et lu à voix haute.
 */
export const ROOM_CODE_ALPHABET = 'BCDFGHJKLMNPQRSTVWXZ'
export const ROOM_CODE_LENGTH = 4

const ROOM_CODE_PATTERN = new RegExp(
  `^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`,
)

export function generateRoomCode(): string {
  const bytes = new Uint8Array(ROOM_CODE_LENGTH)
  crypto.getRandomValues(bytes)

  let code = ''
  for (const byte of bytes) {
    code += ROOM_CODE_ALPHABET[byte % ROOM_CODE_ALPHABET.length]
  }
  return code
}

export function normalizeRoomCode(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase()
}

export function isValidRoomCode(value: string): boolean {
  return ROOM_CODE_PATTERN.test(value)
}
