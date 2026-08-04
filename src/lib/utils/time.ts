export type Interval = { start: number; end: number }

const TIMECODE_PATTERN = /^(\d{1,3}):([0-5]\d)(?:\.(\d{1,2}))?$/

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0')
}

function safeSeconds(seconds: number): number {
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0
}

/** Position de lecture précise : `mm:ss.cc`. Tronque, n'arrondit pas. */
export function formatTimecode(seconds: number): string {
  const total = safeSeconds(seconds)
  const minutes = Math.floor(total / 60)
  const secs = Math.floor(total % 60)
  const centis = Math.floor((total * 100) % 100)
  return `${pad(minutes, 2)}:${pad(secs, 2)}.${pad(centis, 2)}`
}

/** Durée affichée dans les listes : `m:ss`. Arrondit au supérieur. */
export function formatDuration(seconds: number): string {
  const total = Math.ceil(safeSeconds(seconds))
  const minutes = Math.floor(total / 60)
  const secs = total % 60
  return `${minutes}:${pad(secs, 2)}`
}

export function parseTimecode(value: string): number | null {
  const match = TIMECODE_PATTERN.exec(value.trim())
  if (!match) return null

  const [, minutes = '0', secs = '0', centis = '0'] = match
  return (
    Number(minutes) * 60 + Number(secs) + Number(centis.padEnd(2, '0')) / 100
  )
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function secondsToMs(seconds: number): number {
  return Math.round(seconds * 1000)
}

export function msToSeconds(ms: number): number {
  return ms / 1000
}

/** Deux scènes adjacentes (`a.end === b.start`) ne se chevauchent pas. */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end
}
