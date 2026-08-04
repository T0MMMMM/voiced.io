import { en } from './en'
import { fr } from './fr'
import type { Locale } from './locales'

export type Dictionary = typeof fr

/**
 * Ce module ne porte pas de directive : il est lu aussi bien par le
 * serveur que par le navigateur. Le fournisseur React, lui, est forcement
 * client, et un serveur ne peut pas appeler une fonction qui vit dans un
 * fichier `'use client'` : d'ou la separation.
 */
const DICTIONARIES: Record<Locale, Dictionary> = { fr, en }

export function dictionaryFor(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? fr
}
