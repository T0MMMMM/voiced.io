'use client'

import { useCallback, useEffect, useState } from 'react'
import { EstimateQuestion } from '@/components/quiz/kinds/EstimateQuestion'
import { ListQuestion } from '@/components/quiz/kinds/ListQuestion'
import { RankingQuestion } from '@/components/quiz/kinds/RankingQuestion'
import { WrittenQuestion } from '@/components/quiz/kinds/WrittenQuestion'
import { Button, Panel } from '@/components/ui'
import { CheckIcon } from '@/components/ui/icons'
import {
  advanceQuiz,
  answeredPlayers,
  myAnswer,
  startGrading,
  submitAnswer,
} from '@/lib/quiz/actions'
import {
  KIND_LABELS,
  type AnswerPayload,
  type EstimatePayload,
  type ListPayload,
  type Question,
  type RankingPayload,
  type WrittenPayload,
} from '@/lib/quiz/kinds'
import { mergeOptions } from '@/lib/rooms/options'
import type { Player, Room } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'

export interface QuizGameProps {
  room: Room
  players: Player[]
  youId: string | null
  questions: Question[]
}

export function QuizGame({ room, players, youId, questions }: QuizGameProps) {
  const options = mergeOptions(room.options)
  const step = Math.min(room.current_step, Math.max(0, questions.length - 1))
  const question = questions[step]

  const you = players.find((player) => player.id === youId)
  const isHost = you?.is_host ?? false

  const [answer, setAnswer] = useState<AnswerPayload | null>(null)
  const [sent, setSent] = useState(false)
  const [answered, setAnswered] = useState<string[]>([])
  const [remaining, setRemaining] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Chaque question repart de zero, et sa reponse deja envoyee est relue :
  // rafraichir sa page ne doit rien faire perdre.
  useEffect(() => {
    setAnswer(null)
    setSent(false)
    if (!question || !youId) return

    void myAnswer(room.id, youId, question.id).then((stored) => {
      if (stored) {
        setAnswer(stored as AnswerPayload)
        setSent(true)
      }
    })
  }, [room.id, youId, question])

  // Qui a repondu, sans jamais dire quoi.
  useEffect(() => {
    if (!question) return
    const poll = () => void answeredPlayers(room.id, question.id).then(setAnswered)
    poll()
    const timer = window.setInterval(poll, 2500)
    return () => window.clearInterval(timer)
  }, [room.id, question])

  /**
   * Le minuteur se calcule sur l'heure de depart en base, jamais sur un
   * compte a rebours local : deux joueurs n'auraient pas le meme temps.
   */
  useEffect(() => {
    if (options.timerSec === 0 || !room.step_started_at) {
      setRemaining(null)
      return
    }

    const startedAt = new Date(room.step_started_at).getTime()
    const tick = () => {
      const left = options.timerSec * 1000 - (Date.now() - startedAt)
      setRemaining(Math.max(0, Math.ceil(left / 1000)))
    }

    tick()
    const timer = window.setInterval(tick, 500)
    return () => window.clearInterval(timer)
  }, [options.timerSec, room.step_started_at])

  const send = useCallback(async () => {
    if (!question || !youId || !answer) return
    setBusy(true)
    setError(null)
    try {
      await submitAnswer({
        roomId: room.id,
        playerId: youId,
        questionId: question.id,
        payload: answer,
      })
      setSent(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Réponse non envoyée.')
    } finally {
      setBusy(false)
    }
  }, [room.id, youId, question, answer])

  if (!question) {
    return (
      <p className="text-muted py-16 text-center text-[17px]">
        Aucune question dans cette partie.
      </p>
    )
  }

  const timeUp = remaining === 0
  const locked = sent || timeUp || busy
  const isLast = step >= questions.length - 1

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="eyebrow text-faint">
            Question {step + 1} sur {questions.length} · {KIND_LABELS[question.kind]}
          </span>
          <span className="eyebrow text-faint tnum">
            {remaining === null
              ? `${question.points} point${question.points > 1 ? 's' : ''}`
              : `${remaining} s`}
          </span>
        </div>

        {/* Avancement de la partie : on doit voir qu'on approche de la fin. */}
        <div className="bg-sunken h-1 w-full overflow-hidden rounded-full">
          <div
            className="bg-accent h-full rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>

        <h1 className="text-fg text-[clamp(1.375rem,3.2vw,2rem)] leading-[1.15] font-medium tracking-[-0.025em] text-balance">
          {question.prompt}
        </h1>

        {question.hint && options.allowHints && (
          <p className="text-muted text-[15px]">Indice : {question.hint}</p>
        )}
      </header>

      <Panel>
        {question.kind === 'ecrite' && (
          <WrittenQuestion
            payload={question.payload as WrittenPayload}
            value={answer?.kind === 'ecrite' ? answer : null}
            disabled={locked}
            onChange={setAnswer}
          />
        )}
        {question.kind === 'liste' && (
          <ListQuestion
            payload={question.payload as ListPayload}
            value={answer?.kind === 'liste' ? answer : null}
            disabled={locked}
            onChange={setAnswer}
          />
        )}
        {question.kind === 'estimation' && (
          <EstimateQuestion
            payload={question.payload as EstimatePayload}
            value={answer?.kind === 'estimation' ? answer : null}
            disabled={locked}
            onChange={setAnswer}
          />
        )}
        {question.kind === 'classement' && (
          <RankingQuestion
            payload={question.payload as RankingPayload}
            value={answer?.kind === 'classement' ? answer : null}
            disabled={locked}
            onChange={setAnswer}
          />
        )}
      </Panel>

      <div className="flex flex-col items-center gap-3">
        {sent ? (
          <p className="text-accent flex items-center gap-2 text-[15px] font-medium">
            <CheckIcon className="size-4" />
            Réponse envoyée
          </p>
        ) : (
          <Button
            size="lg"
            loading={busy}
            disabled={!answer || timeUp}
            onClick={() => void send()}
          >
            {timeUp ? 'Temps écoulé' : 'Valider ma réponse'}
          </Button>
        )}

        {/* On voit qui a repondu, jamais ce qu'ils ont repondu. */}
        <p className="text-faint text-[13px]">
          {answered.length} sur {players.length} ont répondu
        </p>

        <div className="flex flex-wrap justify-center gap-1.5">
          {players.map((player) => (
            <span
              key={player.id}
              title={player.nickname}
              className={cn(
                'rounded-token px-2 py-1 text-[13px] transition-colors duration-300',
                answered.includes(player.id)
                  ? 'bg-accent-soft text-accent'
                  : 'bg-sunken text-faint',
              )}
            >
              {player.nickname}
            </span>
          ))}
        </div>
      </div>

      {isHost && (
        <div className="flex flex-col items-center gap-2 border-t border-t-[var(--border)] pt-6">
          <Button
            variant="secondary"
            loading={busy}
            onClick={() => {
              setBusy(true)
              const action = isLast
                ? startGrading(room.id)
                : advanceQuiz(room.id, step + 1)
              void action
                .catch((cause: unknown) =>
                  setError(
                    cause instanceof Error ? cause.message : 'Action impossible.',
                  ),
                )
                .finally(() => setBusy(false))
            }}
          >
            {isLast ? 'Passer à la correction' : 'Question suivante'}
          </Button>
          <p className="text-faint text-[13px]">
            {answered.length < players.length
              ? `${players.length - answered.length} joueur(s) n’ont pas encore répondu.`
              : 'Tout le monde a répondu.'}
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-rec text-center text-[15px]">
          {error}
        </p>
      )}
    </div>
  )
}
