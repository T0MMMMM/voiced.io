/**
 * Regroupement des reponses ecrites.
 *
 * C'est ce qui rend la correction supportable. Sur vingt questions a six
 * joueurs, l'hote a cent vingt reponses a trancher ; s'il doit lire
 * « Napoleon », « napoleon » et « Napoléon Bonaparte » comme trois cas
 * distincts, la partie finit dans l'ennui.
 *
 * On regroupe donc les variantes proches pour qu'un seul geste les valide
 * toutes. Le regroupement ne decide jamais si une reponse est juste — il
 * range, l'hote tranche.
 */

/**
 * Forme comparable d'une reponse : sans casse, sans accents, sans
 * ponctuation, espaces normalises. Les articles courants tombent aussi,
 * « la Loire » et « Loire » etant la meme reponse.
 */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(le|la|les|un|une|des|du|de|d|l)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Distance d'edition, en nombre de caracteres a changer. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)

  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost,
      )
    }
    previous = current
  }

  return previous[b.length] ?? 0
}

/**
 * Deux reponses se rangent ensemble si l'une contient l'autre, ou si elles
 * different de peu au regard de leur longueur.
 *
 * La tolerance est relative : sur un mot de quatre lettres, une faute
 * change le sens ; sur vingt, elle ne change rien.
 */
export function areClose(a: string, b: string): boolean {
  if (a === b) return true
  if (a.length === 0 || b.length === 0) return false

  // « Napoleon » et « Napoleon Bonaparte » : la reponse courte est
  // contenue dans la longue, c'est la meme reponse plus ou moins detaillee.
  if (a.includes(b) || b.includes(a)) return true

  const longest = Math.max(a.length, b.length)
  return editDistance(a, b) <= Math.max(1, Math.floor(longest / 5))
}

export interface Entry {
  id: string
  text: string
}

export interface Group {
  /** Forme normalisee du premier arrive, qui sert de representant. */
  key: string
  /** Reponse la plus courte du groupe : la plus lisible a l'ecran. */
  label: string
  entries: Entry[]
}

/**
 * Range les reponses par similitude. Les groupes les plus fournis d'abord :
 * ce que tout le monde a repondu se tranche en premier, et l'hote avance
 * du plus rentable au plus marginal.
 */
export function groupAnswers(entries: Entry[]): Group[] {
  const groups: Group[] = []

  for (const entry of entries) {
    const normalized = normalizeAnswer(entry.text)
    const home = groups.find((group) => areClose(group.key, normalized))

    if (home) {
      home.entries.push(entry)
      if (entry.text.length < home.label.length) home.label = entry.text
    } else {
      groups.push({ key: normalized, label: entry.text, entries: [entry] })
    }
  }

  return groups.sort((a, b) => b.entries.length - a.entries.length)
}
