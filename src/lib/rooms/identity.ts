import { cookies } from 'next/headers'

const COOKIE = 'voiced-player'
const MAX_AGE_SEC = 60 * 60 * 24 // les salons expirent en 24 h

export interface Identity {
  code: string
  playerId: string
}

/**
 * Sans comptes, c'est ce cookie qui fait qu'on retrouve sa place apres un
 * rafraichissement, et ses reponses avec. Un seul salon a la fois : en
 * rejoindre un autre remplace le precedent, ce qui correspond a l'usage.
 */
export async function readIdentity(): Promise<Identity | null> {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      typeof (parsed as Identity).code === 'string' &&
      typeof (parsed as Identity).playerId === 'string'
    ) {
      return parsed as Identity
    }
  } catch {
    // Cookie illisible : on repart de zero plutot que de planter.
  }
  return null
}

/** Ne peut etre appele que depuis une server action ou une route. */
export async function writeIdentity(identity: Identity): Promise<void> {
  ;(await cookies()).set(COOKIE, JSON.stringify(identity), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SEC,
  })
}

export async function clearIdentity(): Promise<void> {
  ;(await cookies()).delete(COOKIE)
}
