export type Bucket = 'clips' | 'takes' | 'thumbs'

const MIME_EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'mp4',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'video/mp4': 'mp4',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

function normalize(extension: string): string {
  return extension.startsWith('.') ? extension.slice(1) : extension
}

/** `audio/webm;codecs=opus` → `webm` */
export function extensionFromMime(mimeType: string): string {
  const base = mimeType.split(';')[0]?.trim().toLowerCase() ?? ''
  return MIME_EXTENSIONS[base] ?? 'bin'
}

/**
 * Un dossier par clip : supprimer un clip expiré revient à supprimer
 * son préfixe, sans avoir à énumérer des fichiers dispersés.
 */
export function clipPath(clipId: string, extension: string): string {
  return `${clipId}/source.${normalize(extension)}`
}

export function takePath(roomId: string, takeId: string, extension: string): string {
  return `${roomId}/${takeId}.${normalize(extension)}`
}

export function thumbPath(clipId: string): string {
  return `${clipId}/thumb.jpg`
}
