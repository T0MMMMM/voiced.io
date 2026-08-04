'use client'

import { useCallback, useEffect, useState } from 'react'
import { EstimateQuestion } from '@/components/quiz/kinds/EstimateQuestion'
import { ListQuestion } from '@/components/quiz/kinds/ListQuestion'
import { OddOneOutQuestion } from '@/components/quiz/kinds/OddOneOutQuestion'
import { RankingQuestion } from '@/components/quiz/kinds/RankingQuestion'
import { WrittenQuestion } from '@/components/quiz/kinds/WrittenQuestion'
import { QuestionMeta } from '@/components/quiz/QuestionMeta'
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
  type OddOneOutPayload,
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
  const [remaining, setRemaining] = useState(Number.POSITIVE_INFINITY)
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
    if (!room.step_started_at) return

    const startedAt = new Date(room.step_started_at).getTime()
    const tick = () => {
      const left = options.timerSec * 1000 - (Date.now() - startedAt)
      setRemaining(Math.max(0, left / 1000))
    }

    tick()
    // Dix fois par seconde : la barre doit descendre sans a-coups, un
    // rafraichissement a la seconde la ferait sauter par paliers.
    const timer = window.setInterval(tick, 100)
    return () => window.clearInterval(timer)
  }, [options.timerSec, room.step_started_at, step])

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

  /**
   * C'est le temps qui fait avancer la partie, plus un bouton.
   *
   * Un seul client declenche le passage — celui de l'hote — sinon six
   * navigateurs ecriraient la meme transition en meme temps. Les autres la
   * recoivent par le temps reel, comme tout le reste.
   */
  useEffect(() => {
    if (!isHost || !question) return
    const everyoneAnswered = players.length > 0 && answered.length >= players.length
    if (remaining > 0 && !everyoneAnswered) return

    const action =
      step >= questions.length - 1 ? startGrading(room.id) : advanceQuiz(room.id, step + 1)
    void action.catch(() => {
      // Une transition refusee sera retentee a la prochaine image : inutile
      // d'alarmer, la partie n'est pas bloquee pour autant.
    })
  }, [isHost, question, remaining, answered.length, players.length, room.id, step, questions.length])

  if (!question) {
    return (
      <p className="text-muted py-16 text-center text-[17px]">
        Aucune question dans cette partie.
      </p>
    )
  }

  const timeUp = remaining <= 0
  const locked = sent || timeUp || busy

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="eyebrow text-faint">
            Question {step + 1} sur {questions.length} · {KIND_LABELS[question.kind]}
          </span>
          <QuestionMeta difficulty={question.difficulty} points={question.points} />
        </div>

        {/* Le temps se lit d'un coup d'oeil : une barre qui se vide dit
            l'urgence mieux qu'un nombre qu'il faut aller chercher. Elle
            passe au rouge dans les cinq dernieres secondes. */}
        <div className="space-y-1.5">
          <div className="bg-sunken h-2 w-full overflow-hidden rounded-full">
            <div
              className={cn(
                'h-full rounded-full transition-[width,background-color] duration-100 ease-linear',
                remaining <= 5 ? 'bg-rec' : 'bg-accent',
              )}
              style={{
                width: `${Math.max(0, Math.min(100, (remaining / options.timerSec) * 100))}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="eyebrow text-faint">
              Progression : {step + 1} / {questions.length}
            </span>
            <span
              className={cn(
                'eyebrow tnum',
                remaining <= 5 ? 'text-rec' : 'text-faint',
              )}
            >
              {Math.ceil(remaining)} s
            </span>
          </div>
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
        {question.kind === 'intrus' && (
          <OddOneOutQuestion
            payload={question.payload as OddOneOutPayload}
            value={answer?.kind === 'intrus' ? answer : null}
            disabled={locked}
            onChange={setAnswer}
          />
        )}
        {(question.kind === 'classement' || question.kind === 'frise') && (
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

      <p className="text-faint text-center text-[13px]">
        La question suivante arrive à la fin du temps, ou dès que tout le
        monde a répondu.
      </p>

      {error && (
        <p role="alert" className="text-rec text-center text-[15px]">
          {error}
        </p>
      )}
    </div>
  )
}
