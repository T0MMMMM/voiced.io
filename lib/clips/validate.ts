/**
 * Regles d'acceptation d'un clip importe.
 *
 * Elles sont volontairement strictes : le gigaoctet de stockage gratuit
 * est la ressource rare du projet, et un clip de trois minutes represente
 * deja des dizaines de scenes a doubler. Mieux vaut refuser tot, avec un
 * message qui dit quoi faire, que laisser quelqu'un attendre un envoi de
 * 50 Mo pour rien.
 */

export const MAX_BYTES = 50 * 1024 * 1024
export const MAX_DURATION_SEC = 180
export const MIN_DURATION_SEC = 2

export type RejectionCode = 'format' | 'taille' | 'vide' | 'duree' | 'illisible'

export interface Rejection {
  code: RejectionCode
  message: string
}

export interface FileLike {
  name: string
  type: string
  size: number
}

function isMp4({ name, type }: FileLike): boolean {
  if (type === 'video/mp4') return true
  // Un glisser-deposer peut arriver sans type devine : on retombe sur le nom.
  if (type === '') return name.toLowerCase().endsWith('.mp4')
  return false
}

export function validateFile(file: FileLike): Rejection | null {
  if (!isMp4(file)) {
    return {
      code: 'format',
      message: 'Seuls les fichiers MP4 sont acceptés. Convertissez le clip avant de l’importer.',
    }
  }

  if (file.size === 0) {
    return { code: 'vide', message: 'Ce fichier est vide.' }
  }

  if (file.size > MAX_BYTES) {
    return {
      code: 'taille',
      message: `Ce clip dépasse 50 Mo (${formatBytes(file.size)}). Raccourcissez-le ou baissez sa qualité.`,
    }
  }

  return null
}

export function validateDuration(seconds: number): Rejection | null {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return {
      code: 'illisible',
      message: 'Impossible de lire ce fichier. Il est peut-être corrompu.',
    }
  }

  if (seconds > MAX_DURATION_SEC) {
    return {
      code: 'duree',
      message: 'Ce clip dépasse 3 minutes. Choisissez une scène plus courte.',
    }
  }

  if (seconds < MIN_DURATION_SEC) {
    return {
      code: 'duree',
      message: 'Ce clip est trop court pour être découpé en scènes.',
    }
  }

  return null
}

export function formatBytes(bytes: number): string {
  const megabytes = bytes / (1024 * 1024)
  if (megabytes >= 1) return `${Math.round(megabytes)} Mo`
  return `${Math.round(bytes / 1024)} Ko`
}
