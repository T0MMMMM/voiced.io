'use client'

import { Input } from '@/components/ui'
import type { QuestionComponentProps, SilhouettePayload } from '@/lib/quiz/kinds'

/**
 * La silhouette d'un pays.
 *
 * On ne montre que les frontières, sans mer, sans voisins, sans nom : il ne
 * reste que la forme. Et elle arrive tournée, parce qu'un pays se reconnaît
 * beaucoup trop facilement à son orientation habituelle. Tourné, il faut
 * vraiment l'avoir en tête.
 *
 * Le tracé voyage dans la question, jamais le nom du pays : l'envoyer
 * reviendrait à livrer la réponse dans le navigateur, à la portée de qui
 * ouvre les outils de développement.
 */
export function SilhouetteQuestion({
  payload,
  value,
  disabled,
  onChange,
}: QuestionComponentProps<SilhouettePayload, { kind: 'silhouette'; text: string }>) {
  return (
    <div className="space-y-4">
      <div className="bg-sunken rounded-token flex aspect-[4/3] items-center justify-center p-6">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          role="img"
          aria-label="Silhouette d’un pays"
        >
          {/* La rotation se fait autour du centre du cadre : autour de
              l'origine, la forme sortirait de l'image. */}
          <g transform={`rotate(${payload.rotate} 50 50)`}>
            <path
              d={payload.shape}
              fill="var(--accent)"
              stroke="var(--accent)"
              strokeWidth="0.6"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      <Input
        label="Quel est ce pays ?"
        value={value?.text ?? ''}
        placeholder="Écrivez son nom"
        disabled={disabled}
        maxLength={60}
        autoFocus
        onChange={(event) =>
          onChange({ kind: 'silhouette', text: event.target.value })
        }
      />
    </div>
  )
}
