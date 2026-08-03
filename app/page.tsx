import Link from 'next/link'
import { CursorGlow } from '@/components/home/CursorGlow'
import { GameLane } from '@/components/home/GameLane'
import { buttonClassName } from '@/components/ui/Button'
import { GAMES } from '@/lib/games'

export default function Home() {
  return (
    <>
      <CursorGlow />

      <main className="mx-auto max-w-4xl px-6 pt-32 pb-24 sm:px-10 sm:pt-40">
        <section className="max-w-2xl">
          <h1 className="text-fg text-[clamp(2.25rem,6vw,4rem)] leading-[0.98] font-medium tracking-[-0.045em] text-balance">
            Quatre jeux, un code à quatre lettres.
          </h1>
          <p className="text-muted mt-6 max-w-lg text-[17px] leading-relaxed text-pretty">
            Vos amis vous rejoignent depuis leur navigateur. Pendant la partie,
            personne ne voit ce que font les autres — tout se révèle à la fin.
          </p>
        </section>

        {/* La console. Chaque piste porte la silhouette sonore de son jeu :
            on distingue un quiz d'un doublage avant d'avoir lu le nom. */}
        <section className="mt-16 sm:mt-20">
          <div className="mb-3 flex items-baseline justify-between px-1">
            <span className="eyebrow text-faint">Les jeux</span>
            <span className="eyebrow text-faint">Survolez une piste</span>
          </div>

          <ul className="bg-surface shadow-token rounded-token-lg overflow-hidden">
            {GAMES.map((game) => (
              <GameLane key={game.id} game={game} />
            ))}
          </ul>
        </section>

        <section className="mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Link href="/create" className={buttonClassName({ size: 'lg' })}>
            Doubler un clip
          </Link>
          <p className="text-faint text-[13px] leading-relaxed">
            Le doublage est jouable dès maintenant.
            <br className="hidden sm:block" /> Les trois autres jeux arrivent.
          </p>
        </section>

        <p className="text-faint mt-20 text-[13px]">
          L’enregistrement demande un ordinateur et un micro.
        </p>
      </main>
    </>
  )
}
