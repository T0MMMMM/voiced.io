import Link from 'next/link'
import { buttonClassName } from '@/components/ui/Button'
import { CursorGlow } from '@/components/home/CursorGlow'
import { VoiceField } from '@/components/home/VoiceField'

/**
 * Les trois temps du parcours. L'ordre porte l'information : ce sont des
 * étapes qui s'enchaînent, d'où la ligne qui les traverse — la même ligne
 * que la timeline de l'éditeur.
 */
const STEPS = [
  {
    title: 'Importez',
    body: 'Un MP4 de moins de trois minutes. Rien à installer.',
  },
  {
    title: 'Découpez',
    body: 'Un marqueur à chaque changement de réplique. C’est tout l’éditeur.',
  },
  {
    title: 'Doublez',
    body: 'Chacun ses personnages, chacun son tour, en direct.',
  },
]

export default function Home() {
  return (
    <>
      <CursorGlow />

      <main className="px-6 sm:px-10">
        <section className="mx-auto flex max-w-5xl flex-col items-center pt-32 pb-20 text-center sm:pt-40">
          <h1 className="text-fg max-w-3xl text-[clamp(2.25rem,6.4vw,4.5rem)] leading-[0.97] font-medium tracking-[-0.045em] text-balance">
            Prêtez vos voix à une scène d’anime.
          </h1>

          <p className="text-muted mt-6 max-w-xl text-[17px] leading-relaxed text-pretty">
            Importez un clip, découpez-le, et doublez chacun votre tour. À
            deux, dans le navigateur, sans créer de compte.
          </p>

          <div className="mt-16 w-full sm:mt-20">
            <VoiceField />
          </div>

          <div className="mt-14 flex flex-col items-center gap-5">
            <Link href="/create" className={buttonClassName({ size: 'lg' })}>
              Créer une partie
            </Link>
            <p className="text-faint text-[13px]">
              La bibliothèque de scènes déjà découpées arrive bientôt.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl pb-28">
          <div className="relative">
            {/* La ligne ne relie les étapes que lorsqu'elles sont côte à côte ;
                empilées, elle n'aurait plus rien à relier. */}
            <div className="bg-strong absolute top-[5px] right-8 left-8 hidden h-px sm:block" />

            <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
              {STEPS.map(({ title, body }) => (
                <li key={title} className="relative sm:text-center">
                  <span className="bg-accent mb-5 block size-[11px] rounded-full sm:mx-auto" />
                  <h2 className="text-fg text-[17px] font-medium tracking-[-0.015em]">
                    {title}
                  </h2>
                  <p className="text-muted mx-auto mt-1.5 max-w-[15rem] text-[15px] leading-relaxed">
                    {body}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <p className="text-faint mt-24 text-center text-[13px]">
            L’enregistrement demande un ordinateur et un micro.
          </p>
        </section>
      </main>
    </>
  )
}
