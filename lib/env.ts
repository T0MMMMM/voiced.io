function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Voir .env.example.`,
    )
  }
  return value
}

/**
 * Les valeurs sont lues à l'appel et non au chargement du module : sinon
 * le simple fait d'importer ce fichier ferait échouer le build quand une
 * variable manque, y compris dans du code qui ne s'en sert pas.
 */
export const env = {
  supabaseUrl: () =>
    required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () =>
    required(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  supabaseServiceRoleKey: () =>
    required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),
  cronSecret: () => required('CRON_SECRET', process.env.CRON_SECRET),
}
