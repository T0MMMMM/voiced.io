/**
 * Sonde les politiques RLS contre la vraie base avec la clé anon.
 * Lancer avec : npm run check:rls
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY requis')
  process.exit(1)
}

const supabase = createClient(url, anonKey)

const TABLES = [
  'clips',
  'characters',
  'scenes',
  'rooms',
  'players',
  'assignments',
  'takes',
] as const

let failures = 0

function report(ok: boolean, message: string) {
  console.log(`${ok ? '  OK  ' : ' ECHEC'} ${message}`)
  if (!ok) failures++
}

async function main() {
  console.log('\nLecture avec la cle anon - doit reussir sur toutes les tables\n')
  for (const table of TABLES) {
    const { error } = await supabase.from(table).select('*').limit(1)
    report(!error, `select sur ${table}${error ? ` -> ${error.message}` : ''}`)
  }

  console.log('\nEcriture avec la cle anon - doit echouer sur toutes les tables\n')

  const { error: clipError } = await supabase
    .from('clips')
    .insert({ title: 'rls-probe', source: 'custom', storage_path: 'x', duration_sec: 1 })
  report(clipError !== null, `insert sur clips refuse${clipError ? '' : ' -> A REUSSI, faille'}`)

  const { error: roomError } = await supabase
    .from('rooms')
    .insert({ code: 'BCDF', clip_id: '00000000-0000-0000-0000-000000000000' })
  report(roomError !== null, `insert sur rooms refuse${roomError ? '' : ' -> A REUSSI, faille'}`)

  // Un update ou un delete refuse par RLS ne remonte PAS d'erreur : sans
  // politique for update/delete, aucune ligne ne passe le filtre, donc zero
  // ligne est touchee et PostgREST repond 200/204 avec un ensemble vide.
  // Le seul critere honnete est donc : aucune ligne modifiee, et la ligne
  // visee inchangee apres coup. On sonde une vraie ligne quand il en existe
  // une, sinon la sonde ne prouverait rien et on le dit.
  const { data: existing } = await supabase
    .from('rooms')
    .select('id, status')
    .limit(1)
  const target = existing?.[0]

  if (!target) {
    console.log('  N/A   update sur rooms : aucun salon en base, sonde non concluante')
  } else {
    const nextStatus = target.status === 'done' ? 'lobby' : 'done'
    const { data: updated, error: updateError } = await supabase
      .from('rooms')
      .update({ status: nextStatus })
      .eq('id', target.id)
      .select()

    const { data: after } = await supabase
      .from('rooms')
      .select('status')
      .eq('id', target.id)
      .single()

    const untouched = (updated?.length ?? 0) === 0 && after?.status === target.status
    report(
      updateError !== null || untouched,
      `update sur rooms sans effet${updateError !== null || untouched ? '' : ' -> A MODIFIE LA LIGNE, faille'}`,
    )

    const { data: deleted, error: deleteError } = await supabase
      .from('rooms')
      .delete()
      .eq('id', target.id)
      .select()

    const { data: stillThere } = await supabase
      .from('rooms')
      .select('id')
      .eq('id', target.id)
    const survived = (deleted?.length ?? 0) === 0 && (stillThere?.length ?? 0) === 1
    report(
      deleteError !== null || survived,
      `delete sur rooms sans effet${deleteError !== null || survived ? '' : ' -> A SUPPRIME LA LIGNE, faille'}`,
    )
  }

  console.log(
    failures === 0
      ? '\nToutes les sondes RLS sont conformes.\n'
      : `\n${failures} sonde(s) non conforme(s).\n`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

void main()
