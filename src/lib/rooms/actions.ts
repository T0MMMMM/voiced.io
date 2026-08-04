'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from '@/lib/utils/id'
import type { GameId } from '@/lib/games'
import { clearIdentity, readIdentity, writeIdentity } from './identity'
import { MAX_PLAYERS, mergeOptions, type RoomOptions } from './options'

/** Assez pour une soiree, et les salons expirent de toute facon en 24 h. */
const LIFETIME_HOURS = 24

function cleanNickname(raw: string): string {
  const nickname = raw.trim().slice(0, 20)
  if (nickname.length === 0) throw new Error('Choisissez un pseudo.')
  return nickname
}

/**
 * Retente sur collision de code. 160 000 combinaisons rendent le cas rare,
 * mais rare n'est pas impossible, et tomber sur un salon deja pris
 * enverrait deux groupes dans la meme partie.
 */
async function insertRoomWithFreeCode(
  supabase: ReturnType<typeof createServiceClient>,
  values: { game: GameId; clipId: string | null },
): Promise<{ id: string; code: string }> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateRoomCode()
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        code,
        game: values.game,
        clip_id: values.clipId,
        status: 'lobby',
        expires_at: new Date(Date.now() + LIFETIME_HOURS * 3_600_000).toISOString(),
      })
      .select('id, code')
      .single()

    if (data) return data
    // 23505 = violation d'unicite : le code etait pris, on retire au sort.
    if (error && error.code !== '23505') {
      throw new Error(`Impossible de créer le salon : ${error.message}`)
    }
  }
  throw new Error('Impossible de trouver un code libre. Réessayez.')
}

export async function createRoom(input: {
  game: GameId
  nickname: string
  clipId?: string
}): Promise<{ code: string; playerId: string }> {
  const nickname = cleanNickname(input.nickname)
  const supabase = createServiceClient()

  const room = await insertRoomWithFreeCode(supabase, {
    game: input.game,
    clipId: input.clipId ?? null,
  })

  const { data: player, error } = await supabase
    .from('players')
    .insert({ room_id: room.id, nickname, slot: 1, is_host: true })
    .select('id')
    .single()

  if (error || !player) {
    await supabase.from('rooms').delete().eq('id', room.id)
    throw new Error(`Impossible de rejoindre le salon : ${error?.message}`)
  }

  await supabase
    .from('rooms')
    .update({ host_player_id: player.id })
    .eq('id', room.id)

  await writeIdentity({ code: room.code, playerId: player.id })
  return { code: room.code, playerId: player.id }
}

export async function joinRoom(input: {
  code: string
  nickname: string
}): Promise<{ code: string; playerId: string }> {
  const nickname = cleanNickname(input.nickname)
  const code = normalizeRoomCode(input.code)

  if (!isValidRoomCode(code)) {
    throw new Error('Un code de salon fait quatre lettres, sans voyelle.')
  }

  const supabase = createServiceClient()
  const { data: room } = await supabase
    .from('rooms')
    .select('id, code, status, expires_at')
    .eq('code', code)
    .maybeSingle()

  if (!room) throw new Error('Aucun salon ne porte ce code.')
  if (new Date(room.expires_at) < new Date()) {
    throw new Error('Ce salon a expiré.')
  }

  const { data: players } = await supabase
    .from('players')
    .select('id, slot')
    .eq('room_id', room.id)

  const occupied = players ?? []
  if (occupied.length >= MAX_PLAYERS) {
    throw new Error(`Ce salon est complet (${MAX_PLAYERS} joueurs).`)
  }

  // On reprend le premier emplacement libre : apres un depart, le salon ne
  // doit pas se retrouver bloque parce que les numeros sont epuises.
  const taken = new Set(occupied.map((player) => player.slot))
  const slot = Array.from({ length: MAX_PLAYERS }, (_, i) => i + 1).find(
    (candidate) => !taken.has(candidate),
  )
  if (!slot) throw new Error('Ce salon est complet.')

  const { data: player, error } = await supabase
    .from('players')
    .insert({ room_id: room.id, nickname, slot, is_host: occupied.length === 0 })
    .select('id')
    .single()

  if (error || !player) {
    throw new Error(`Impossible de rejoindre : ${error?.message}`)
  }

  // Salon vide retrouve : le nouvel arrivant reprend l'arbitrage.
  if (occupied.length === 0) {
    await supabase
      .from('rooms')
      .update({ host_player_id: player.id })
      .eq('id', room.id)
  }

  await writeIdentity({ code: room.code, playerId: player.id })
  return { code: room.code, playerId: player.id }
}

/**
 * Quitte le salon et, si c'etait l'hote, passe l'arbitrage au plus ancien
 * present. Sans ce transfert, une partie de quiz devient incorrigible des
 * que l'hote perd sa connexion — donc inachevable.
 */
export async function leaveRoom(): Promise<void> {
  const identity = await readIdentity()
  if (!identity) return

  const supabase = createServiceClient()
  const { data: player } = await supabase
    .from('players')
    .select('id, room_id, is_host')
    .eq('id', identity.playerId)
    .maybeSingle()

  if (player) {
    await supabase.from('players').delete().eq('id', player.id)

    if (player.is_host) {
      const { data: heir } = await supabase
        .from('players')
        .select('id')
        .eq('room_id', player.room_id)
        .order('last_seen_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (heir) {
        await supabase.from('players').update({ is_host: true }).eq('id', heir.id)
        await supabase
          .from('rooms')
          .update({ host_player_id: heir.id })
          .eq('id', player.room_id)
      }
    }
  }

  await clearIdentity()
}

export async function setRoomOptions(
  roomId: string,
  patch: Partial<RoomOptions>,
): Promise<void> {
  const supabase = createServiceClient()
  const { data: room } = await supabase
    .from('rooms')
    .select('options')
    .eq('id', roomId)
    .maybeSingle()

  const merged = mergeOptions({ ...mergeOptions(room?.options), ...patch })

  // `Json` exige une signature d'index que `RoomOptions` n'a pas — et ne
  // doit pas avoir, sinon n'importe quelle cle passerait. L'etalement en
  // objet nu est sur : toutes les valeurs sont des booleens ou des nombres.
  const { error } = await supabase
    .from('rooms')
    .update({ options: { ...merged } })
    .eq('id', roomId)

  if (error) throw new Error(`Réglage impossible : ${error.message}`)
}

export async function setRoomGame(roomId: string, game: GameId): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase.from('rooms').update({ game }).eq('id', roomId)
  if (error) throw new Error(`Changement de jeu impossible : ${error.message}`)
}

/** Rattache le clip importe au salon. Le doublage en a besoin pour demarrer. */
export async function setRoomClip(roomId: string, clipId: string): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('rooms')
    .update({ clip_id: clipId })
    .eq('id', roomId)
  if (error) throw new Error(`Impossible d’attacher le clip : ${error.message}`)
}

/** Les points de coupe vivent dans le salon : tous les ecrans les partagent. */
export async function setBreakpoints(
  roomId: string,
  points: number[],
): Promise<void> {
  const clean = [...new Set(points.filter(Number.isFinite))]
    .map((point) => Number(point.toFixed(3)))
    .sort((a, b) => a - b)
    .slice(0, 200)

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('rooms')
    .update({ breakpoints: clean })
    .eq('id', roomId)

  if (error) throw new Error(`Découpage non enregistré : ${error.message}`)
}

export async function startGame(roomId: string): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('rooms')
    .update({
      status: 'playing',
      current_step: 0,
      step_started_at: new Date().toISOString(),
    })
    .eq('id', roomId)

  if (error) throw new Error(`Impossible de lancer la partie : ${error.message}`)
}

/** Cloture la partie : tout le monde bascule sur l'ecran de resultat. */
export async function finishGame(roomId: string): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'results', recording_by: null })
    .eq('id', roomId)

  if (error) throw new Error(`Impossible de terminer : ${error.message}`)
}

/** Repasse en enregistrement, sans rien perdre : les prises restent. */
export async function reopenRoom(roomId: string): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'playing' })
    .eq('id', roomId)

  if (error) throw new Error(`Impossible de reprendre : ${error.message}`)
}

/** Battement de presence : au-dela de 30 s sans signe, le joueur est marque absent. */
export async function touchPlayer(playerId: string): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from('players')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', playerId)
}
