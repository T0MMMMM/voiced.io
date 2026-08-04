export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'voiced-theme'

/**
 * Le sombre est le défaut assumé du produit : toute valeur qui n'est pas
 * exactement 'light' retombe sur 'dark'. Aucune lecture de
 * prefers-color-scheme, l'utilisateur choisit explicitement.
 */
export function resolveTheme(stored: string | null | undefined): Theme {
  return stored === 'light' ? 'light' : 'dark'
}

export function toggleTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark'
}

export function readStoredTheme(): Theme {
  try {
    return resolveTheme(localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    // localStorage indisponible (navigation privée stricte, iframe cloisonnée)
    return 'dark'
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Le thème reste appliqué pour la session, il ne survivra pas au rechargement.
  }
}

/**
 * Injecté en synchrone dans <head>, avant le premier rendu, pour que la page
 * ne s'affiche jamais en sombre pendant une fraction de seconde chez un
 * utilisateur qui a choisi le thème clair.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}})()`
