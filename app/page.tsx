import Link from 'next/link'
import { CursorGlow } from '@/components/home/CursorGlow'
import { GameLane } from '@/components/home/GameLane'
import { VoiceField } from '@/components/home/VoiceField'
import { buttonClassName } from '@/components/ui/Button'
import { GAMES } from '@/lib/games'

export default function Home() {
  return (
    <>
      <CursorGlow />

      <main className="mx-auto max-w-4xl px-6 pb-24 sm:px-10">
        <section className="flex min-h-[86vh] flex-col justify-center pt-28 sm:pt-32">
          <h1 className="text-fg max-w-2xl text-[clamp(2.25rem,6.4vw,4.25rem)] leading-[0.97] font-medium tracking-[-0.045em] text-balance">
            Quatre jeux, un code à quatre lettres.
          </h1>
          <p className="text-muted mt-6 max-w-lg text-[17px] leading-relaxed text-pretty">
            Vos amis vous rejoignent depuis leur navigateur. Pendant la partie,
            personne ne voit ce que font les autres — tout se révèle à la fin.
          </p>

          <div className="mt-12 sm:mt-16">
            <VoiceField />
          </div>

          <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link href="/create" className={buttonClassName({ size: 'lg' })}>
              Créer un salon
            </Link>
            <Link
              href="/join"
              className={buttonClassName({ variant: 'secondary', size: 'lg' })}
            >
              J’ai un code
            </Link>
          </div>
        </section>

        {/* La console. Chaque piste porte la silhouette sonore de son jeu :
            on distingue un quiz d'un doublage avant d'avoir lu le nom. */}
        <section className="pt-8 pb-4">
          <div className="mb-3 flex items-baseline justify-between px-1">
            <span className="eyebrow text-faint">Les jeux</span>
            <span className="eyebrow text-faint">Survolez une piste</span>
          </div>

          <ul className="bg-surface shadow-token rounded-token-lg overflow-hidden">
            {GAMES.map((game) => (
              <GameLane key={game.id} game={game} />
            ))}
          </ul>

          <p className="text-faint mt-6 text-[13px]">
            Le doublage est jouable dès maintenant. Les trois autres arrivent.
            L’enregistrement demande un ordinateur et un micro.
          </p>
        </section>
      </main>
    </>
  )
}
