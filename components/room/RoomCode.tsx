'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

/**
 * Le code est fait pour etre lu a voix haute au telephone, d'ou la chasse
 * fixe et l'interlettrage genereux : quatre consonnes bien detachees se
 * dictent sans se tromper.
 */
export function RoomCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/join?code=${code}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Presse-papiers refuse : le code reste lisible a l'ecran, on n'a
      // rien perdu d'essentiel.
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="text-center">
        <p className="eyebrow text-faint">Code du salon</p>
        <p className="text-fg mt-2 font-mono text-[clamp(2.5rem,9vw,4.5rem)] leading-none font-bold tracking-[0.18em]">
          {code}
        </p>
      </div>

      <Button variant="secondary" size="sm" onClick={() => void copyLink()}>
        {copied ? 'Lien copié' : 'Copier le lien d’invitation'}
      </Button>
    </div>
  )
}
