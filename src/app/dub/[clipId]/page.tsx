import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DubStage } from '@/components/dub/DubStage'
import { buttonClassName } from '@/components/ui'
import { getUrl } from '@/lib/storage'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DubPage({
  params,
}: {
  params: Promise<{ clipId: string }>
}) {
  const { clipId } = await params
  const supabase = createServiceClient()

  const { data: clip } = await supabase
    .from('clips')
    .select('id, title, storage_path, duration_sec, width, height')
    .eq('id', clipId)
    .maybeSingle()

  if (!clip) notFound()

  // Un envoi interrompu laisse une ligne sans fichier : sans ce garde-fou,
  // la signature échoue et l'écran renvoie une erreur opaque.
  let videoUrl: string
  try {
    videoUrl = await getUrl('clips', clip.storage_path)
  } catch {
    return (
      <main className="mx-auto max-w-2xl px-6 pt-32 pb-24 text-center sm:px-10">
        <h1 className="text-fg text-2xl font-medium tracking-[-0.03em]">
          Ce clip n’a pas fini d’être importé.
        </h1>
        <p className="text-muted mt-4 text-[17px] leading-relaxed">
          Le fichier est introuvable — l’envoi a probablement été interrompu.
        </p>
        <Link href="/create" className={`${buttonClassName()} mt-8`}>
          Reprendre l’import
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-6 pt-28 pb-24 sm:px-10 sm:pt-32">
      <div className="mb-8 flex items-baseline justify-between gap-4">
        <h1 className="text-fg truncate text-[17px] font-medium tracking-[-0.015em]">
          {clip.title}
        </h1>
        <span className="eyebrow text-faint shrink-0">Doublage</span>
      </div>

      <DubStage
        videoUrl={videoUrl}
        durationSec={Number(clip.duration_sec)}
        aspectRatio={
          clip.width && clip.height ? clip.width / clip.height : 16 / 9
        }
        nickname="Vous"
      />
    </main>
  )
}
