import { cookies } from 'next/headers'
import { dictionaryFor, type Dictionary } from './dictionaries'
import { LOCALE_STORAGE_KEY, resolveLocale, type Locale } from './locales'

/**
 * Le dictionnaire, côté serveur.
 *
 * Les composants serveur ne peuvent pas lire un contexte React : ils
 * relisent donc le cookie, comme le fait la mise en page. C'est la même
 * source, il n'y a pas deux vérités.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  return resolveLocale(store.get(LOCALE_STORAGE_KEY)?.value)
}

export async function getT(): Promise<Dictionary> {
  return dictionaryFor(await getLocale())
}
