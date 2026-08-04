import Link from 'next/link'
import { redirect } from 'next/navigation'
import { RoomScreen } from '@/components/room/RoomScreen'
import { buttonClassName } from '@/components/ui'
import { readIdentity } from '@/lib/rooms/identity'
import { listTakes } from '@/lib/takes/actions'
import { loadQuestions } from '@/lib/quiz/actions'
import type { Question } from '@/lib/quiz/kinds'
import { getUrl } from '@/lib/storage'
import type { DubContext } from '@/components/room/RoomScreen'
import { createServiceClient } from '@/lib/supabase/server'
import { normalizeRoomCode } from '@/lib/utils/id'

export const dynamic = 'force-dynamic'

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code: raw } = await params
  const code = normalizeRoomCode(raw)

  const supabase = createServiceClient()
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .maybeSingle()

  if (!room) {
    return (
      <main className="mx-auto max-w-lg px-6 pt-32 pb-24 text-center">
        <h1 className="text-fg text-2xl font-medium tracking-[-0.03em]">
          Aucun salon ne porte ce code.
        </h1>
        <p className="text-muted mt-4 text-[17px]">
          Il a peut-être expiré : les salons ne vivent que vingt-quatre heures.
        </p>
        <Link href="/join" className={`${buttonClassName()} mt-8`}>
          Saisir un autre code
        </Link>
      </main>
    )
  }

  // Sans identite pour CE salon, on ne peut pas savoir qui vous etes :
  // le formulaire de connexion s'en charge, code deja rempli.
  const identity = await readIdentity()
  if (!identity || identity.code !== code) {
    redirect(`/join?code=${code}`)
  }

  // L'état initial part avec la page : le salon s'affiche complet dès la
  // première image, et le temps réel prend le relais ensuite.
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', room.id)
    .order('slot')

  // Le contexte du doublage ne se charge que quand il sert : un salon de
  // quiz n'a ni clip ni prises a aller chercher.
  let dub: DubContext | null = null
  if (room.game === 'dub' && room.clip_id) {
    const { data: clip } = await supabase
      .from('clips')
      .select('storage_path, duration_sec, width, height')
      .eq('id', room.clip_id)
      .maybeSingle()

    if (clip) {
      try {
        dub = {
          videoUrl: await getUrl('clips', clip.storage_path),
          durationSec: Number(clip.duration_sec),
          aspectRatio:
            clip.width && clip.height ? clip.width / clip.height : 16 / 9,
          takes: await listTakes(room.id),
        }
      } catch {
        // Fichier introuvable : le salon retombe sur l'etape d'import.
        dub = null
      }
    }
  }

  // Les enonces sont charges cote serveur, jamais leur correction : elle
  // ne doit pas descendre dans le navigateur pendant la partie.
  let questions: Question[] = []
  if (room.game === 'quiz' && Array.isArray(room.question_ids)) {
    questions = await loadQuestions(room.question_ids as string[])
  }

  return (
    <main className="mx-auto max-w-4xl px-6 pt-28 pb-24 sm:px-10 sm:pt-32">
      <RoomScreen
        code={code}
        youId={identity.playerId}
        initialRoom={room}
        initialPlayers={players ?? []}
        dub={dub}
        questions={questions}
      />
    </main>
  )
}
