'use client'

import { useState } from 'react'
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  IconButton,
  Input,
  Panel,
  Spinner,
  Timecode,
} from '@/components/ui'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-faint text-[13px] font-medium tracking-widest uppercase">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

export default function UiKitchenSink() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <main className="mx-auto max-w-3xl space-y-10 p-10">
      <h1 className="text-fg text-2xl font-semibold">Kit UI</h1>

      <Section title="Button — variantes">
        <Button variant="primary">Enregistrer</Button>
        <Button variant="secondary">Rejouer</Button>
        <Button variant="ghost">Annuler</Button>
        <Button variant="danger">Supprimer</Button>
      </Section>

      <Section title="Button — tailles">
        <Button size="sm">Petit</Button>
        <Button size="md">Moyen</Button>
        <Button size="lg">Grand</Button>
      </Section>

      <Section title="Button — états">
        <Button disabled>Désactivé</Button>
        <Button loading>Chargement</Button>
        <Button variant="secondary" disabled>
          Désactivé secondaire
        </Button>
      </Section>

      <Section title="Button — pleine largeur">
        <div className="w-full">
          <Button fullWidth>Créer une partie</Button>
        </div>
      </Section>

      <Section title="IconButton">
        <IconButton label="Rejouer">⟲</IconButton>
        <IconButton label="Supprimer" variant="danger">
          ×
        </IconButton>
        <IconButton label="Options" variant="ghost">
          ⋯
        </IconButton>
        <IconButton label="Ajouter" size="sm">
          +
        </IconButton>
      </Section>

      <Section title="Panel">
        <Panel className="flex-1">
          <p className="text-fg text-[15px]">Panneau standard sur surface.</p>
          <p className="text-muted mt-1 text-[15px]">Texte secondaire.</p>
        </Panel>
      </Section>

      <Section title="Panel — creusé">
        <Panel sunken className="flex-1">
          <p className="text-muted text-[15px]">Panneau creusé, sans ombre.</p>
        </Panel>
      </Section>

      <Section title="Input">
        <div className="w-full space-y-4">
          <Input label="Pseudo" placeholder="Ton pseudo" />
          <Input label="Code du salon" mono placeholder="BCDF" maxLength={4} />
          <Input label="Avec aide" hint="4 lettres, sans accent" placeholder="BCDF" />
          <Input label="En erreur" error="Ce salon n'existe pas" defaultValue="ZZZZ" />
          <Input label="Désactivé" disabled defaultValue="Indisponible" />
        </div>
      </Section>

      <Section title="Badge">
        <Badge>Neutre</Badge>
        <Badge tone="accent">Ton tour</Badge>
        <Badge tone="rec">Enregistrement</Badge>
        <Badge tone="ok">Validé</Badge>
        <Badge tone="warn">Micro faible</Badge>
        <Badge tone="player-1">Tom</Badge>
        <Badge tone="player-2">Léa</Badge>
      </Section>

      <Section title="Spinner">
        <Spinner size="sm" />
        <Spinner />
      </Section>

      <Section title="Timecode">
        <Timecode seconds={83.45} />
        <Timecode seconds={4.2} />
        <Timecode seconds={83.45} mode="duration" />
        <Timecode seconds={8.4} mode="duration" />
      </Section>

      <Section title="EmptyState">
        <EmptyState
          className="flex-1"
          title="Aucune scène pour l'instant"
          description="Place un marqueur sur la timeline pour découper ton clip en scènes."
          action={<Button size="sm">Couper ici</Button>}
        />
      </Section>

      <Section title="Dialog">
        <Button variant="secondary" onClick={() => setDialogOpen(true)}>
          Ouvrir la modale
        </Button>
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Supprimer cette scène ?"
          description="Les prises enregistrées pour cette scène seront perdues."
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button variant="danger" onClick={() => setDialogOpen(false)}>
                Supprimer
              </Button>
            </>
          }
        />
      </Section>
    </main>
  )
}
