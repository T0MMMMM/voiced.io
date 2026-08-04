'use server'

import { createUploadUrl, clipPath, remove } from '@/lib/storage'
import { createServiceClient } from '@/lib/supabase/server'
import { validateDuration } from './validate'

/** Les clips importes sont ephemeres : le stockage gratuit est la ressource rare. */
const LIFETIME_DAYS = 7

export interface ClipDraft {
  clipId: string
  uploadUrl: string
  storagePath: string
}

export interface DraftInput {
  title: string
  durationSec: number
  width: number
  height: number
}

/**
 * Cree la ligne du clip et delegue au navigateur le droit d'ecrire un seul
 * fichier, a un seul chemin.
 *
 * Le fichier ne transite jamais par le serveur : 50 Mo depasseraient la
 * limite de corps de requete du plan gratuit, et une server action ne
 * permettrait de toute facon aucune barre de progression.
 */
export async function createClipDraft(input: DraftInput): Promise<ClipDraft> {
  // La validation cote client sert le confort ; celle-ci fait autorite.
  const rejection = validateDuration(input.durationSec)
  if (rejection) {
    throw new Error(rejection.message)
  }

  const clipId = crypto.randomUUID()
  const storagePath = clipPath(clipId, 'mp4')

  const supabase = createServiceClient()
  const expiresAt = new Date(Date.now() + LIFETIME_DAYS * 86_400_000)

  const { error } = await supabase.from('clips').insert({
    id: clipId,
    title: input.title.slice(0, 120),
    source: 'custom',
    storage_path: storagePath,
    duration_sec: Number(input.durationSec.toFixed(3)),
    width: input.width || null,
    height: input.height || null,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    throw new Error(`Impossible d’enregistrer le clip : ${error.message}`)
  }

  const { url } = await createUploadUrl('clips', storagePath)
  return { clipId, uploadUrl: url, storagePath }
}

/**
 * Supprime un brouillon dont l'envoi a echoue. Sans cela, la ligne
 * resterait orpheline jusqu'a son expiration, en pointant vers un
 * fichier qui n'existe pas.
 */
export async function discardClipDraft(clipId: string): Promise<void> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('clips')
    .select('storage_path')
    .eq('id', clipId)
    .maybeSingle()

  if (data?.storage_path) {
    await remove('clips', [data.storage_path]).catch(() => {
      // Le fichier n'a probablement jamais ete ecrit : rien a nettoyer.
    })
  }

  await supabase.from('clips').delete().eq('id', clipId)
}
