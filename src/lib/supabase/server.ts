import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from '@/types/db'

/**
 * Client serveur : clé service_role, contourne RLS.
 *
 * L'import de `server-only` fait échouer la compilation si ce module est
 * jamais importé depuis un composant client — le garde-fou qui empêche
 * la clé de fuiter dans le bundle navigateur.
 *
 * Non mis en cache : chaque invocation serveur est isolée.
 */
export function createServiceClient(): SupabaseClient<Database> {
  return createClient<Database>(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
