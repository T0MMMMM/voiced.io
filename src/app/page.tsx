import Link from 'next/link'
import { CursorGlow } from '@/components/home/CursorGlow'
import { GameLane } from '@/components/home/GameLane'
import { VoiceField } from '@/components/home/VoiceField'
import { buttonClassName } from '@/components/ui/Button'
import { ArrowRightIcon, PlusIcon } from '@/components/ui/icons'
import { GAMES } from '@/lib/games'
import { getT } from '@/lib/i18n/server'

export default async function Home() {
  const t = await getT()

  return (
    <>
      <CursorGlow />

      <main className="mx-auto max-w-4xl px-6 pb-24 sm:px-10">
        <section className="flex min-h-[86vh] flex-col justify-center pt-28 sm:pt-32">
          <h1
            className="rise text-fg max-w-2xl text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.95] font-medium tracking-[-0.05em] text-balance"
            style={{ animationDelay: '60ms' }}
          >
            {t.home.title}
          </h1>
          <div className="rise mt-12 sm:mt-14" style={{ animationDelay: '260ms' }}>
            <VoiceField />
          </div>

          {/* Créer un salon est l'action du site : elle occupe quatre
              cinquièmes de la ligne, rejoindre se contente du reste. */}
          <div
            className="rise mt-12 flex w-full gap-3"
            style={{ animationDelay: '380ms' }}
          >
            <Link
              href="/create"
              className={buttonClassName({
                size: 'lg',
                className: 'basis-4/5 gap-2.5',
              })}
            >
              <PlusIcon />
              {t.home.create}
            </Link>
            <Link
              href="/join"
              aria-label={t.home.join}
              className={buttonClassName({
                variant: 'secondary',
                size: 'lg',
                className: 'basis-1/5 gap-2 px-0',
              })}
            >
              <span className="hidden sm:inline">{t.home.join}</span>
              <ArrowRightIcon />
            </Link>
          </div>
        </section>

        {/* La console. Chaque piste porte la silhouette sonore de son jeu :
            on distingue un quiz d'un doublage avant d'avoir lu le nom. */}
        <section className="pt-8 pb-4">
          <div className="mb-3 flex items-baseline justify-between px-1">
            <span className="eyebrow text-faint">Les jeux</span>
            <span className="eyebrow text-faint">{t.home.hoverHint}</span>
          </div>

          <ul className="bg-surface shadow-token rounded-token-lg overflow-hidden">
            {GAMES.map((game) => (
              <GameLane key={game.id} game={game} />
            ))}
          </ul>
        </section>
      </main>
    </>
  )
}
