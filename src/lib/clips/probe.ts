export interface ClipMetadata {
  durationSec: number
  width: number
  height: number
}

/**
 * Lit la duree et les dimensions d'un fichier sans l'envoyer nulle part.
 *
 * On charge les seules metadonnees dans un <video> hors ecran : le
 * navigateur n'a alors besoin que des premiers octets du conteneur, ce qui
 * permet de refuser un clip trop long avant d'avoir transfere le moindre
 * megaoctet.
 */
export function probeClip(file: File): Promise<ClipMetadata> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true

    // Un conteneur illisible ne declenche parfois ni `loadedmetadata` ni
    // `error` : sans ce garde-fou, l'interface resterait bloquee.
    const timeout = window.setTimeout(() => {
      cleanup()
      reject(new Error('Lecture des métadonnées trop longue'))
    }, 15_000)

    function cleanup() {
      window.clearTimeout(timeout)
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(url)
    }

    video.addEventListener(
      'loadedmetadata',
      () => {
        const metadata: ClipMetadata = {
          durationSec: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        }
        cleanup()
        resolve(metadata)
      },
      { once: true },
    )

    video.addEventListener(
      'error',
      () => {
        cleanup()
        reject(new Error('Fichier vidéo illisible'))
      },
      { once: true },
    )

    video.src = url
  })
}
