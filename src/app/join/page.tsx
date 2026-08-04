'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Button, Input } from '@/components/ui'
import { joinRoom } from '@/lib/rooms/actions'
import { normalizeRoomCode } from '@/lib/utils/id'
import { useT } from '@/lib/i18n'

function JoinForm() {
  const t = useT()
  const router = useRouter()
  const params = useSearchParams()

  const [nickname, setNickname] = useState('')
  const [code, setCode] = useState(normalizeRoomCode(params.get('code') ?? ''))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const joined = await joinRoom({ code, nickname })
      router.push(`/room/${joined.code}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.join.failed)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Input
        label={t.join.nickname}
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        placeholder={t.join.nicknamePlaceholder}
        maxLength={20}
        autoFocus
        required
      />

      <Input
        label={t.join.code}
        mono
        value={code}
        // On normalise a la saisie : personne ne devrait avoir a se
        // demander si le code s'ecrit en majuscules.
        onChange={(event) => setCode(normalizeRoomCode(event.target.value))}
        placeholder="BCDF"
        maxLength={4}
        required
      />

      <Button type="submit" fullWidth loading={busy}>
        {t.join.submit}
      </Button>

      {error && (
        <p role="alert" className="text-rec text-[15px]">
          {error}
        </p>
      )}
    </form>
  )
}

export default function JoinPage() {
  const t = useT()

  return (
    <main className="mx-auto max-w-sm px-6 pt-32 pb-24 sm:pt-40">
      <h1 className="text-fg text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.035em]">
        {t.join.title}
      </h1>
      <p className="text-muted mt-4 text-[17px] leading-relaxed">
        {t.join.lead}
      </p>

      <div className="mt-10">
        <Suspense fallback={null}>
          <JoinForm />
        </Suspense>
      </div>
    </main>
  )
}
