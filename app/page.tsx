import { Button, Panel } from '@/components/ui'

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
      <h1 className="text-fg text-2xl font-semibold tracking-tight">
        Doublez une scène d&apos;anime à deux
      </h1>
      <p className="text-muted mt-3 max-w-md text-[15px]">
        Importez un clip, découpez-le en scènes, et enregistrez vos voix chacun
        votre tour. Aucun compte, aucune installation.
      </p>

      <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
        <Panel className="flex flex-col items-start gap-3 text-left">
          <div>
            <h2 className="text-fg text-[15px] font-medium">Créer une partie</h2>
            <p className="text-muted mt-1 text-[15px]">
              Importez votre propre clip MP4 et invitez un ami avec un code.
            </p>
          </div>
          <Button className="mt-auto" fullWidth>
            Commencer
          </Button>
        </Panel>

        <Panel sunken className="flex flex-col items-start gap-3 text-left">
          <div>
            <h2 className="text-muted text-[15px] font-medium">Bibliothèque</h2>
            <p className="text-faint mt-1 text-[15px]">
              Une sélection de scènes déjà découpées, prêtes à doubler.
            </p>
          </div>
          <Button variant="secondary" className="mt-auto" fullWidth disabled>
            Bientôt disponible
          </Button>
        </Panel>
      </div>

      <p className="text-faint mt-10 text-[13px]">
        L&apos;enregistrement nécessite un ordinateur avec un micro.
      </p>
    </main>
  )
}
