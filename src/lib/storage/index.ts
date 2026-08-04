/**
 * SEUL point d'accès aux fichiers du projet.
 *
 * Aucun autre module n'importe `supabase.storage`. C'est ce qui rendra la
 * migration vers Cloudflare R2 — prévue quand le gigaoctet gratuit de
 * Supabase sera atteint — possible en réécrivant ce seul fichier.
 */
import { createServiceClient } from '@/lib/supabase/server'
import type { Bucket } from './paths'

export type { Bucket } from './paths'
export { clipPath, extensionFromMime, takePath, thumbPath } from './paths'

const DEFAULT_URL_TTL_SECONDS = 60 * 60 // 1 h

export interface UploadOptions {
  contentType?: string
  /** Écrase un fichier existant au même chemin. */
  upsert?: boolean
}

export async function upload(
  bucket: Bucket,
  path: string,
  body: Blob | ArrayBuffer | Uint8Array,
  options: UploadOptions = {},
): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType: options.contentType,
    upsert: options.upsert ?? false,
  })
  if (error) {
    throw new Error(`Échec de l'envoi vers ${bucket}/${path} : ${error.message}`)
  }
}

/**
 * URL d'envoi signée, à consommer directement par le navigateur.
 *
 * Un clip peut peser 50 Mo : le faire transiter par une server action
 * dépasserait la limite de corps de requête du plan gratuit de Vercel.
 * Le fichier va donc du navigateur à Supabase sans passer par nous, et
 * seul le droit d'écrire à ce chemin précis est délégué.
 */
export async function createUploadUrl(
  bucket: Bucket,
  path: string,
): Promise<{ url: string; token: string }> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path)

  if (error || !data) {
    throw new Error(
      `Échec de la signature d'envoi pour ${bucket}/${path} : ${error?.message}`,
    )
  }
  return { url: data.signedUrl, token: data.token }
}

/**
 * URL signée pour `clips` et `takes` (buckets privés),
 * URL publique directe pour `thumbs`.
 */
export async function getUrl(
  bucket: Bucket,
  path: string,
  expiresInSeconds: number = DEFAULT_URL_TTL_SECONDS,
): Promise<string> {
  const supabase = createServiceClient()

  if (bucket === 'thumbs') {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds)

  if (error || !data) {
    throw new Error(`Échec de la signature de ${bucket}/${path} : ${error?.message}`)
  }
  return data.signedUrl
}

export async function remove(bucket: Bucket, paths: string[]): Promise<void> {
  if (paths.length === 0) return

  const supabase = createServiceClient()
  const { error } = await supabase.storage.from(bucket).remove(paths)
  if (error) {
    throw new Error(`Échec de la suppression dans ${bucket} : ${error.message}`)
  }
}

export async function exists(bucket: Bucket, path: string): Promise<boolean> {
  const supabase = createServiceClient()
  const lastSlash = path.lastIndexOf('/')
  const folder = lastSlash === -1 ? '' : path.slice(0, lastSlash)
  const filename = path.slice(lastSlash + 1)

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, { search: filename, limit: 1 })

  if (error) return false
  return (data ?? []).some((entry) => entry.name === filename)
}
