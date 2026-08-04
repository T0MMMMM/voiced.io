'use server'

import { extensionFromMime, getUrl, remove, takePath, upload } from '@/lib/storage'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * Une prise de trente secondes en Opus pese moins de cent kilooctets : elle
 * passe donc par une server action, contrairement aux clips video qui
 * dependaient d'une URL signee. Un aller-retour de moins, et le fichier est
 * ecrit et reference dans la meme operation.
 */
export interface SavedTake {
  id: string
  playerId: string | null
  author: string
  startSec: number
  durationMs: number
  url: string
  /** Spectre de la prise, pour la superposer a la bande originale. */
  peaks: number[]
}

/**
 * Prend le micro. Le verrou vit en base : c'est la seule facon que tous les
 * ecrans voient le meme etat, et la condition `is null` rend la prise du
 * verrou atomique — deux joueurs qui cliquent en meme temps, un seul passe.
 */
export async function claimMicrophone(
  roomId: string,
  playerId: string,
): Promise<boolean> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('rooms')
    .update({ recording_by: playerId })
    .eq('id', roomId)
    .is('recording_by', null)
    .select('id')

  return (data?.length ?? 0) > 0
}

export async function releaseMicrophone(roomId: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('rooms').update({ recording_by: null }).eq('id', roomId)
}

export async function saveTake(form: FormData): Promise<void> {
  const roomId = String(form.get('roomId') ?? '')
  const playerId = String(form.get('playerId') ?? '')
  const startSec = Number(form.get('startSec') ?? 0)
  const durationMs = Number(form.get('durationMs') ?? 0)
  const offsetMs = Number(form.get('offsetMs') ?? 0)
  const audio = form.get('audio')
  const rawPeaks = String(form.get('peaks') ?? '[]')

  if (!(audio instanceof File) || audio.size === 0) {
    throw new Error('Enregistrement vide.')
  }
  if (durationMs <= 0) {
    throw new Error('Enregistrement trop court.')
  }

  const supabase = createServiceClient()

  // Refaire une reprise remplace la precedente au lieu de s'empiler
  // dessus : sans cela, cinq essais donnent cinq voix superposees. On ne
  // remplace que SES propres prises — deux joueurs peuvent legitimement
  // parler par-dessus le meme passage.
  if (playerId) {
    const endSec = startSec + durationMs / 1000
    const { data: overlapping } = await supabase
      .from('takes')
      .select('id, storage_path, start_sec, duration_ms')
      .eq('room_id', roomId)
      .eq('player_id', playerId)

    const doomed = (overlapping ?? []).filter((take) => {
      const from = Number(take.start_sec)
      const to = from + take.duration_ms / 1000
      return from < endSec && startSec < to
    })

    if (doomed.length > 0) {
      await remove(
        'takes',
        doomed.map((take) => take.storage_path),
      ).catch(() => {})
      await supabase
        .from('takes')
        .delete()
        .in('id', doomed.map((take) => take.id))
    }
  }

  const takeId = crypto.randomUUID()
  const mimeType = audio.type || 'audio/webm'
  const path = takePath(roomId, takeId, extensionFromMime(mimeType))

  await upload('takes', path, audio, { contentType: mimeType })

  const { error } = await supabase.from('takes').insert({
    id: takeId,
    room_id: roomId,
    player_id: playerId || null,
    storage_path: path,
    mime_type: mimeType,
    start_sec: Number(startSec.toFixed(3)),
    duration_ms: Math.round(durationMs),
    offset_ms: Math.round(offsetMs),
    peaks: safePeaks(rawPeaks),
  })

  if (error) {
    // Sans ce nettoyage, le fichier resterait dans le bucket sans aucune
    // ligne pour le retrouver — donc sans aucun moyen de le supprimer.
    await remove('takes', [path]).catch(() => {})
    throw new Error(`Impossible d’enregistrer la prise : ${error.message}`)
  }
}

/** Le spectre arrive du navigateur : on ne stocke que ce qui a la bonne forme. */
function safePeaks(raw: string): number[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
      .map((value) => Math.min(1, Math.max(0, value)))
      .slice(0, 600)
  } catch {
    return []
  }
}

export async function deleteTake(takeId: string): Promise<void> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('takes')
    .select('storage_path')
    .eq('id', takeId)
    .maybeSingle()

  if (data?.storage_path) {
    await remove('takes', [data.storage_path]).catch(() => {})
  }
  await supabase.from('takes').delete().eq('id', takeId)
}

/** Les prises d'un salon, avec une URL signee prete a lire. */
export async function listTakes(roomId: string): Promise<SavedTake[]> {
  const supabase = createServiceClient()

  const { data: takes } = await supabase
    .from('takes')
    .select('id, player_id, storage_path, start_sec, duration_ms, peaks')
    .eq('room_id', roomId)
    .order('start_sec')

  if (!takes || takes.length === 0) return []

  const { data: players } = await supabase
    .from('players')
    .select('id, nickname')
    .eq('room_id', roomId)

  const names = new Map((players ?? []).map((p) => [p.id, p.nickname]))

  return Promise.all(
    takes.map(async (take) => ({
      id: take.id,
      playerId: take.player_id,
      author: (take.player_id ? names.get(take.player_id) : null) ?? 'Anonyme',
      startSec: Number(take.start_sec),
      durationMs: take.duration_ms,
      url: await getUrl('takes', take.storage_path),
      peaks: Array.isArray(take.peaks) ? (take.peaks as number[]) : [],
    })),
  )
}
