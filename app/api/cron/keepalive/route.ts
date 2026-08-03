import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Touche la base une fois par jour.
 *
 * Un projet Supabase gratuit est mis en pause apres 7 jours sans activite.
 * Cette requete triviale suffit a le maintenir eveille — sans elle,
 * l'environnement meurt des la premiere semaine calme du developpement.
 *
 * En Phase 2, cette meme route se chargera aussi de supprimer les clips et
 * salons expires : le plan Hobby de Vercel limite a 2 crons journaliers,
 * on regroupe donc les deux responsabilites dans un seul appel.
 */
export async function GET(request: Request) {
  const authorization = request.headers.get('authorization')
  if (authorization !== `Bearer ${env.cronSecret()}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from('clips')
    .select('*', { count: 'exact', head: true })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, clips: count ?? 0, at: new Date().toISOString() })
}
