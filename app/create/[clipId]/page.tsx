import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buttonClassName } from '@/components/ui'
import { CutEditor } from '@/components/cut/CutEditor'
import { getUrl } from '@/lib/storage'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function CutPage({
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

  // Les scènes déjà enregistrées se reconvertissent en marqueurs : ce sont
  // les débuts de scène, sauf le premier qui est le bord du clip.
  const { data: scenes } = await supabase
    .from('scenes')
    .select('start_sec')
    .eq('clip_id', clipId)
    .order('idx')

  const initialMarkers = (scenes ?? [])
    .map((scene) => Number(scene.start_sec))
    .filter((start) => start > 0)

  // Un envoi interrompu laisse une ligne sans fichier. Sans ce garde-fou,
  // la signature échoue et l'écran renvoie une erreur 500 opaque.
  let videoUrl: string
  try {
    videoUrl = await getUrl('clips', clip.storage_path)
  } catch {
    return (
      <main className="mx-auto max-w-2xl px-6 pt-32 pb-24 text-center sm:px-10 sm:pt-40">
        <h1 className="text-fg text-2xl font-medium tracking-[-0.03em]">
          Ce clip n’a pas fini d’être importé.
        </h1>
        <p className="text-muted mt-4 text-[17px] leading-relaxed">
          Le fichier est introuvable — l’envoi a probablement été interrompu.
          Importez-le à nouveau.
        </p>
        <Link href="/create" className={`${buttonClassName()} mt-8`}>
          Reprendre l’import
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pt-32 pb-24 sm:px-10 sm:pt-40">
      <p className="eyebrow text-faint">Étape 2 sur 3</p>
      <h1 className="text-fg mt-3 text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.035em]">
        Découpez en scènes.
      </h1>
      <p className="text-muted mt-4 max-w-lg text-[17px] leading-relaxed">
        Une coupe à chaque changement de réplique. Une scène = un personnage
        qui parle.
      </p>

      <div className="mt-12">
        <CutEditor
          clipId={clip.id}
          title={clip.title}
          videoUrl={videoUrl}
          durationSec={Number(clip.duration_sec)}
          aspectRatio={
            clip.width && clip.height ? clip.width / clip.height : 16 / 9
          }
          initialMarkers={initialMarkers}
        />
      </div>
    </main>
  )
}
