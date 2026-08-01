import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from '@/types/db'

let cached: SupabaseClient<Database> | null = null

/**
 * Client navigateur : clé anon, soumis à RLS, donc en lecture seule.
 * Sert aux lectures et aux abonnements Realtime. Toutes les écritures
 * passent par des server actions.
 *
 * Mis en cache : ouvrir plusieurs connexions Realtime pour un même
 * onglet consommerait le quota gratuit pour rien.
 */
export function createBrowserClient(): SupabaseClient<Database> {
  cached ??= createClient<Database>(env.supabaseUrl(), env.supabaseAnonKey(), {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 5 } },
  })
  return cached
}
