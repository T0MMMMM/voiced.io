/**
 * La langue de l'interface.
 *
 * Elle vit dans un cookie, comme le thème, et non dans l'URL. C'est la
 * décision qui structure tout le reste : un préfixe `/fr/` ferait changer
 * l'adresse d'un salon selon la langue de celui qui la partage, alors que
 * ce lien se dicte au téléphone et doit rester unique.
 *
 * Elle est donc personnelle : deux joueurs de la même partie peuvent lire
 * l'écran dans deux langues différentes. Seul le contenu des questions
 * fera exception, puisqu'on ne peut pas poser deux questions différentes à
 * la même table.
 */

export type Locale = 'fr' | 'en'

export const LOCALE_STORAGE_KEY = 'voiced-lang'

export const LOCALE_CHOICES: { value: Locale; label: string }[] = [
  { value: 'fr', label: 'FR' },
  { value: 'en', label: 'EN' },
]

/**
 * Le français est le défaut assumé : toute valeur qui n'est pas exactement
 * 'en' y retombe. Aucune lecture de la langue du navigateur, le site
 * propose et n'impose pas.
 */
export function resolveLocale(stored: string | null | undefined): Locale {
  return stored === 'en' ? 'en' : 'fr'
}

export function readStoredLocale(): Locale {
  try {
    return resolveLocale(document.cookie.match(/voiced-lang=(\w+)/)?.[1])
  } catch {
    return 'fr'
  }
}

/**
 * Le cookie survit un an et reste lisible par le serveur : c'est lui qui
 * rend la première image déjà traduite, sans clignotement.
 */
export function applyLocale(locale: Locale): void {
  document.cookie = `${LOCALE_STORAGE_KEY}=${locale};path=/;max-age=31536000;samesite=lax`
  document.documentElement.lang = locale
}
