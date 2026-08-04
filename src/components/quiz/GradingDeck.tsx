'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Panel } from '@/components/ui'
import { CheckIcon } from '@/components/ui/icons'
import { AnswerKey } from '@/components/quiz/AnswerKey'
import {
  advanceQuiz,
  answersFor,
  expectedAnswer,
  gradeAnswers,
  publishResults,
  type PlayerAnswer,
} from '@/lib/quiz/actions'
import {
  DIFFICULTY_LABELS,
  isAutoScored,
  KIND_LABELS,
  type Question,
} from '@/lib/quiz/kinds'
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
    if (Array.isArray(value.items)) {
      return value.items.filter((item) => String(item).trim()).join(' · ') || '(vide)'
    }
    if (typeof value.choice === 'string') return value.choice
    if (typeof value.year === 'number') {
      return value.year < 0
        ? `${Math.abs(value.year)} av. J.-C.`
        : String(value.year)
    }
    if (typeof value.lat === 'number' && typeof value.lng === 'number') {
      const ns = value.lat >= 0 ? 'N' : 'S'
      const ew = value.lng >= 0 ? 'E' : 'O'
      return `${Math.abs(value.lat).toFixed(1)}° ${ns}, ${Math.abs(value.lng).toFixed(1)}° ${ew}`
    }
    if (typeof value.level === 'number') {
      const label = DIFFICULTY_LABELS[value.level] ?? '?'
      return `${label} : ${String(value.text ?? '').trim() || '(vide)'}`
    }
    if (value.pairs && typeof value.pairs === 'object') {
      return Object.entries(value.pairs as Record<string, string>)
        .map(([left, right]) => `${left} → ${right}`)
        .join(' · ')
    }
    if (value.words && typeof value.words === 'object') {
      // La catégorie est rappelée devant chaque mot : l'hôte tranche
      // « Nice » selon qu'on lui demandait une ville ou un prénom.
      return (
        Object.entries(value.words as Record<string, string>)
          .filter(([, word]) => String(word).trim())
          .map(([category, word]) => `${category} : ${word}`)
          .join(' · ') || '(vide)'
      )
    }
  }
  return '(vide)'
}

/**
 * L'écran de correction.
 *
 * C'est l'écran le plus risqué du projet : mal fait, il transforme une
 * bonne partie en quart d'heure pénible. Trois choses le rendent rapide :
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

  /**
   * La correction attendue, avec la question dont elle vient.
   *
   * Elle ne descend jamais avec l'enonce : elle se demande au serveur au
   * moment de corriger, et le couple evite d'afficher la reponse de la
   * question precedente pendant le rendu qui suit un changement d'etape.
   */
  const [key, setKey] = useState<{ questionId: string; expected: unknown }>({
    questionId: '',
    expected: null,
  })

  const load = useCallback(async () => {
    if (!question) return
    try {
      setAnswers(await answersFor(room.id, question.id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Lecture impossible.')
    }
  }, [room.id, question])

  useEffect(() => {
    if (!question) return
    const questionId = question.id
    void expectedAnswer(room.id, questionId)
      .then((expected) => setKey({ questionId, expected }))
      .catch(() => setKey({ questionId, expected: null }))
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

  // Les points poses sur la carte, avec leur auteur. La correction anonyme
  // les laisse sur la carte mais leur retire leur nom.
  const placed = answers
    .map((answer) => {
      const payload = answer.payload as { lat?: unknown; lng?: unknown } | null
      if (typeof payload?.lat !== 'number' || typeof payload?.lng !== 'number') {
        return null
      }
      return {
        nickname: options.anonymousGrading ? '' : answer.nickname,
        lat: payload.lat,
        lng: payload.lng,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

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

      {/* La bonne reponse en tete, avant les copies : on corrige avec le
          bareme sous les yeux, pas de memoire. */}
      {key.questionId === question.id && (
        <Panel sunken>
          <AnswerKey question={question} expected={key.expected} placed={placed} />
        </Panel>
      )}

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
