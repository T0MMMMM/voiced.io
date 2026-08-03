import Link from 'next/link'
import { redirect } from 'next/navigation'
import { RoomScreen } from '@/components/room/RoomScreen'
import { buttonClassName } from '@/components/ui'
import { readIdentity } from '@/lib/rooms/identity'
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
    .select('id, code')
    .eq('code', code)
    .maybeSingle()

  if (!room) {
    return (
      <main className="mx-auto max-w-lg px-6 pt-32 pb-24 text-center">
        <h1 className="text-fg text-2xl font-medium tracking-[-0.03em]">
          Aucun salon ne porte ce code.
        </h1>
        <p className="text-muted mt-4 text-[17px]">
          Il a peut-être expiré — les salons ne vivent que vingt-quatre heures.
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

  return (
    <main className="mx-auto max-w-3xl px-6 pt-28 pb-24 sm:px-10 sm:pt-32">
      <RoomScreen code={code} youId={identity.playerId} />
    </main>
  )
}
