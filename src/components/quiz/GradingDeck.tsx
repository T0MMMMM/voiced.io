'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Panel } from '@/components/ui'
import { CheckIcon } from '@/components/ui/icons'
import {
  advanceQuiz,
  answersFor,
  gradeAnswers,
  publishResults,
  type PlayerAnswer,
} from '@/lib/quiz/actions'
import { isAutoScored, KIND_LABELS, type Question } from '@/lib/quiz/kinds'
import { groupAnswers, type Group } from '@/lib/quiz/similarity'
import { mergeOptions } from '@/lib/rooms/options'
import type { Player, Room } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'

type Graded = PlayerAnswer & { id: string }

/** Le texte d'une reponse, quelle que soit sa forme. */
function readable(payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const value = payload as Record<string, unknown>
    if (typeof value.text === 'string') return value.text
    if (typeof value.value === 'number') return String(value.value)
    if (Array.isArray(value.order)) return value.order.join(' · ')
    if (typeof value.choice === 'string') return value.choice
  }
  return '—'
}

/**
 * L'écran de correction.
 *
 * C'est l'écran le plus risqué du projet : mal fait, il transforme une
 * bonne partie en quart d'heure pénible. Trois choses le rendent rapide —
 * les variantes d'une même réponse arrivent groupées et se valident d'un
 * geste, les formes notées automatiquement arrivent déjà tranchées, et
 * tout se pilote au clavier.
 */
export function GradingDeck({
  room,
  players,
  youId,
  questions,
}: {
  room: Room
  players: Player[]
  youId: string | null
  questions: Question[]
}) {
  const options = mergeOptions(room.options)
  const step = Math.min(room.current_step, Math.max(0, questions.length - 1))
  const question = questions[step]

  const you = players.find((player) => player.id === youId)
  const isHost = you?.is_host ?? false

  const [answers, setAnswers] = useState<Graded[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!question) return
    try {
      setAnswers(await answersFor(room.id, question.id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Lecture impossible.')
    }
  }, [room.id, question])

  useEffect(() => {
    void load()
  }, [load])

  const auto = question ? isAutoScored(question.kind) : false

  const grade = useCallback(
    async (ids: string[], correct: boolean) => {
      if (!question) return
      setBusy(true)
      try {
        await gradeAnswers(ids, correct ? question.points : 0)
        await load()
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Correction impossible.')
      } finally {
        setBusy(false)
      }
    },
    [question, load],
  )

  const next = useCallback(async () => {
    setBusy(true)
    try {
      if (step >= questions.length - 1) await publishResults(room.id)
      else await advanceQuiz(room.id, step + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action impossible.')
    } finally {
      setBusy(false)
    }
  }, [room.id, step, questions.length])

  // Tout au clavier : J juste, F faux, → suivante. Une correction se mène
  // au rythme de la parole, pas à celui de la souris.
  useEffect(() => {
    if (!isHost) return
    function onKey(event: KeyboardEvent) {
      const focused = event.target as HTMLElement | null
      if (focused?.closest('input, textarea')) return

      if (event.code === 'ArrowRight' || event.code === 'Enter') {
        event.preventDefault()
        void next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isHost, next])

  if (!question) return null

  if (!isHost) {
    return (
      <div className="py-16 text-center">
        <p className="eyebrow text-accent">Correction en cours</p>
        <p className="text-fg mt-3 text-[17px]">
          {you ? 'L’hôte passe les réponses en revue.' : 'Correction en cours.'}
        </p>
        <p className="text-faint mt-2 text-[13px]">
          Question {step + 1} sur {questions.length}
        </p>
      </div>
    )
  }

  const groups: Group[] = groupAnswers(
    answers.map((answer) => ({ id: answer.id, text: readable(answer.payload) })),
  )
  const byId = new Map(answers.map((answer) => [answer.id, answer]))

  return (
    <div className="space-y-7">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-faint">
            Correction {step + 1} sur {questions.length} · {KIND_LABELS[question.kind]}
          </span>
          <span className="eyebrow text-faint">
            {question.points} point{question.points > 1 ? 's' : ''}
          </span>
        </div>

        <div className="bg-sunken h-1 w-full overflow-hidden rounded-full">
          <div
            className="bg-accent h-full rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Lisible de loin : cet écran se projette, tout le monde regarde. */}
        <h1 className="text-fg text-[clamp(1.5rem,3.6vw,2.25rem)] leading-[1.15] font-medium tracking-[-0.025em] text-balance">
          {question.prompt}
        </h1>
      </header>

      {auto && (
        <p className="text-muted text-[15px]">
          Cette forme se note toute seule. Vous pouvez rectifier si besoin.
        </p>
      )}

      <ul className="space-y-2.5">
        {groups.map((group) => {
          const members = group.entries
            .map((entry) => byId.get(entry.id))
            .filter((answer): answer is Graded => Boolean(answer))
          const ids = members.map((member) => member.id)
          const score = members[0]?.finalScore ?? 0
          const settled = members.every((member) => member.graded)

          return (
            <li key={group.key || group.label}>
              <Panel
                className={cn(
                  'flex flex-wrap items-center gap-4 transition-colors duration-200',
                  settled && score > 0 && 'bg-accent-soft',
                  settled && score === 0 && 'opacity-60',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="text-fg block text-[17px] font-medium">
                    {group.label}
                  </span>
                  {!options.anonymousGrading && (
                    <span className="text-faint mt-0.5 block text-[13px]">
                      {members.map((member) => member.nickname).join(', ')}
                    </span>
                  )}
                  {options.anonymousGrading && (
                    <span className="text-faint mt-0.5 block text-[13px]">
                      {members.length} joueur{members.length > 1 ? 's' : ''}
                    </span>
                  )}
                </span>

                <span className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant={settled && score > 0 ? 'primary' : 'secondary'}
                    disabled={busy}
                    onClick={() => void grade(ids, true)}
                  >
                    <CheckIcon className="size-4" />
                    Juste
                  </Button>
                  <Button
                    size="sm"
                    variant={settled && score === 0 ? 'danger' : 'secondary'}
                    disabled={busy}
                    onClick={() => void grade(ids, false)}
                  >
                    Faux
                  </Button>
                </span>
              </Panel>
            </li>
          )
        })}

        {groups.length === 0 && (
          <li className="text-faint border-default rounded-token border border-dashed px-4 py-8 text-center text-[15px]">
            Personne n’a répondu à cette question.
          </li>
        )}
      </ul>

      <div className="flex flex-col items-center gap-2">
        <Button size="lg" loading={busy} onClick={() => void next()}>
          {step >= questions.length - 1
            ? 'Publier les résultats'
            : 'Question suivante'}
        </Button>
        <p className="text-faint text-[13px]">Entrée ou → pour avancer</p>
      </div>

      {error && (
        <p role="alert" className="text-rec text-center text-[15px]">
          {error}
        </p>
      )}
    </div>
  )
}
