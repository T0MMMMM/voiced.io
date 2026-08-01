/**
 * Sonde les politiques RLS contre la vraie base.
 * Lancer avec : npm run check:rls
 *
 * Le modele de securite des phases 0 a 2 est : la cle anon LIT tout
 * (indispensable, sinon Realtime ne delivre rien aux clients) et n'ECRIT
 * rien. Une politique RLS ne se verifie honnetement qu'en essayant
 * reellement, d'ou ce script plutot qu'un test unitaire.
 *
 * Piege a connaitre : un INSERT refuse par RLS remonte une erreur 42501,
 * parce que le WITH CHECK est evalue sur la nouvelle ligne. Un UPDATE ou
 * un DELETE refuse, lui, ne remonte AUCUNE erreur : aucune ligne ne passe
 * le filtre de lecture, donc zero ligne est touchee et PostgREST repond
 * 200/204 avec un ensemble vide. Attendre une erreur serait un faux
 * critere. Le seul critere valable est : aucune ligne modifiee, et la
 * ligne visee inchangee apres coup.
 *
 * Corollaire : ces sondes ne prouvent rien sur une base vide. Le script
 * seme donc lui-meme une ligne jetable avec la cle service_role avant de
 * l'attaquer avec la cle anon, puis nettoie derriere lui.
 */
import { createClient } from '@supabase/supabase-js'
import { generateRoomCode } from '../lib/utils/id'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !anonKey || !serviceKey) {
  console.error(
    'Variables requises : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY',
  )
  process.exit(1)
}

const anon = createClient(url, anonKey)
const service = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const TABLES = [
  'clips',
  'characters',
  'scenes',
  'rooms',
  'players',
  'assignments',
  'takes',
] as const

const PROBE_TITLE = 'rls-probe-jetable'

let failures = 0

function report(ok: boolean, message: string) {
  console.log(`${ok ? '  OK   ' : ' ECHEC '} ${message}`)
  if (!ok) failures++
}

/** Cree un clip et un salon jetables avec la cle service_role. */
async function seed(): Promise<{ clipId: string; roomId: string } | null> {
  const { data: clip, error: clipError } = await service
    .from('clips')
    .insert({
      title: PROBE_TITLE,
      source: 'custom',
      storage_path: 'rls-probe/source.mp4',
      duration_sec: 1,
    })
    .select('id')
    .single()

  if (clipError || !clip) {
    console.error(`Impossible de semer le clip : ${clipError?.message}`)
    return null
  }

  const { data: room, error: roomError } = await service
    .from('rooms')
    .insert({ code: generateRoomCode(), clip_id: clip.id })
    .select('id')
    .single()

  if (roomError || !room) {
    console.error(`Impossible de semer le salon : ${roomError?.message}`)
    await service.from('clips').delete().eq('id', clip.id)
    return null
  }

  return { clipId: clip.id, roomId: room.id }
}

/** Le clip supprime emporte le salon par cascade. */
async function cleanup(clipId: string) {
  await service.from('clips').delete().eq('id', clipId)

  const { data: leftovers } = await service
    .from('clips')
    .select('id')
    .eq('title', PROBE_TITLE)
  report(
    (leftovers?.length ?? 0) === 0,
    `nettoyage des donnees de sonde${(leftovers?.length ?? 0) === 0 ? '' : ' -> RESTES EN BASE'}`,
  )
}

async function probeReads() {
  console.log('\nLecture avec la cle anon - doit reussir partout\n')
  for (const table of TABLES) {
    const { error } = await anon.from(table).select('*').limit(1)
    report(!error, `select sur ${table}${error ? ` -> ${error.message}` : ''}`)
  }
}

async function probeInserts() {
  console.log('\nInsertion avec la cle anon - doit etre refusee\n')

  const { error: clipError } = await anon
    .from('clips')
    .insert({ title: PROBE_TITLE, source: 'custom', storage_path: 'x', duration_sec: 1 })
  report(
    clipError !== null,
    `insert sur clips refuse${clipError ? '' : ' -> A REUSSI, faille'}`,
  )

  const { error: roomError } = await anon
    .from('rooms')
    .insert({ code: generateRoomCode(), clip_id: '00000000-0000-0000-0000-000000000000' })
  report(
    roomError !== null,
    `insert sur rooms refuse${roomError ? '' : ' -> A REUSSI, faille'}`,
  )
}

async function probeUpdate(roomId: string) {
  const { data: before } = await service
    .from('rooms')
    .select('status')
    .eq('id', roomId)
    .single()

  const { data: updated } = await anon
    .from('rooms')
    .update({ status: 'done' })
    .eq('id', roomId)
    .select()

  // On relit avec la cle SERVICE : la cle anon pourrait montrer un etat
  // filtre et masquer une modification qui a bel et bien eu lieu.
  const { data: after } = await service
    .from('rooms')
    .select('status')
    .eq('id', roomId)
    .single()

  const untouched = (updated?.length ?? 0) === 0 && after?.status === before?.status
  report(
    untouched,
    `update sur rooms sans effet${untouched ? '' : ' -> A MODIFIE LA LIGNE, faille'}`,
  )
}

async function probeDelete(roomId: string) {
  const { data: deleted } = await anon.from('rooms').delete().eq('id', roomId).select()

  const { data: survivors } = await service.from('rooms').select('id').eq('id', roomId)

  const survived = (deleted?.length ?? 0) === 0 && (survivors?.length ?? 0) === 1
  report(
    survived,
    `delete sur rooms sans effet${survived ? '' : ' -> A SUPPRIME LA LIGNE, faille'}`,
  )
}

async function main() {
  await probeReads()
  await probeInserts()

  console.log('\nModification avec la cle anon sur une ligne reelle - doit rester sans effet\n')

  const seeded = await seed()
  if (!seeded) {
    console.error('\nSondes update/delete impossibles : echec du semis.\n')
    process.exit(1)
  }

  try {
    await probeUpdate(seeded.roomId)
    await probeDelete(seeded.roomId)
  } finally {
    await cleanup(seeded.clipId)
  }

  console.log(
    failures === 0
      ? '\nToutes les sondes RLS sont conformes.\n'
      : `\n${failures} sonde(s) non conforme(s).\n`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

void main()
