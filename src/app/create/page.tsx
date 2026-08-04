'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Button, Input } from '@/components/ui'
import { PlusIcon } from '@/components/ui/icons'
import { createRoom } from '@/lib/rooms/actions'
import { GAMES, type GameId } from '@/lib/games'

/**
 * On ouvre le salon d'abord, on choisit le jeu ensuite.
 *
 * C'est l'inverse de l'ordre precedent, et c'est le bon : on cree un salon
 * pour retrouver des amis, pas pour jouer a un jeu decide a l'avance. Le
 * choix se fait a plusieurs, une fois tout le monde arrive.
 */
function CreateForm() {
  const router = useRouter()
  const params = useSearchParams()

  // Le jeu vient de la piste cliquee sur l'accueil ; il reste modifiable
  // dans le salon, c'est la qu'on le choisit vraiment.
  const requested = params.get('game')
  const game: GameId = GAMES.some((candidate) => candidate.id === requested)
    ? (requested as GameId)
    : 'quiz'
  const [nickname, setNickname] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const room = await createRoom({ game, nickname })
      router.push(`/room/${room.code}`)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Impossible de créer le salon.',
      )
      setBusy(false)
    }
  }

  return (
    <>
      <h1
        className="rise text-fg text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.035em]"
        style={{ animationDelay: '40ms' }}
      >
        Ouvrir un salon.
      </h1>
      <p
        className="rise text-muted mt-4 text-[17px] leading-relaxed"
        style={{ animationDelay: '120ms' }}
      >
        Vous recevrez un code à quatre lettres. Le jeu se choisit ensuite, à
        plusieurs.
      </p>

      <form
        onSubmit={submit}
        className="rise mt-10 space-y-6"
        style={{ animationDelay: '200ms' }}
      >
        <Input
          label="Votre pseudo"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="Tom"
          maxLength={20}
          autoFocus
          required
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={busy}
          disabled={nickname.trim().length === 0}
          className="gap-2.5"
        >
          <PlusIcon />
          Créer le salon
        </Button>

        {error && (
          <p role="alert" className="text-rec text-[15px]">
            {error}
          </p>
        )}
      </form>
    </>
  )
}

export default function CreatePage() {
  return (
    <main className="mx-auto max-w-sm px-6 pt-32 pb-24 sm:pt-40">
      <Suspense fallback={null}>
        <CreateForm />
      </Suspense>
    </main>
  )
}
