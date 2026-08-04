'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { EstimateQuestion } from '@/components/quiz/kinds/EstimateQuestion'
import { ListQuestion } from '@/components/quiz/kinds/ListQuestion'
import { OddOneOutQuestion } from '@/components/quiz/kinds/OddOneOutQuestion'
import { PairsQuestion } from '@/components/quiz/kinds/PairsQuestion'
import { PetitBacQuestion } from '@/components/quiz/kinds/PetitBacQuestion'
import { MapQuestion } from '@/components/quiz/kinds/MapQuestion'
import { RankingQuestion } from '@/components/quiz/kinds/RankingQuestion'
import { SilhouetteQuestion } from '@/components/quiz/kinds/SilhouetteQuestion'
import { ThemeQuestion } from '@/components/quiz/kinds/ThemeQuestion'
import { TimelineQuestion } from '@/components/quiz/kinds/TimelineQuestion'
import { WrittenQuestion } from '@/components/quiz/kinds/WrittenQuestion'
import { QuestionMeta } from '@/components/quiz/QuestionMeta'
import { IconButton, Panel } from '@/components/ui'
import { CheckIcon } from '@/components/ui/icons'
import {
  advanceQuiz,
  answeredPlayers,
  lockAnswer,
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
  type PairsPayload,
  type PetitBacPayload,
  type Question,
  type MapPayload,
  type RankingPayload,
  type SilhouettePayload,
  type ThemePayload,
  type TimelinePayload,
  type WrittenPayload,
} from '@/lib/quiz/kinds'
import { mergeOptions } from '@/lib/rooms/options'
import { secondsFor } from '@/lib/quiz/timing'
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
  const [saved, setSaved] = useState(false)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Ce qui est deja parti au serveur, sous sa forme serialisee.
   *
   * La reponse s'enregistre au fil de la saisie et non au clic : le bouton
   * de validation ne l'envoie pas, il annonce qu'on a fini. Une reponse
   * commencee puis abandonnee compte donc quand meme. Cette reference evite
   * de reecrire la meme reponse a chaque frappe.
   */
  const stored = useRef('')

  /**
   * Combien de temps cette question-ci merite.
   *
   * Le salon ne choisit plus une duree mais un rythme : trente secondes
   * noyaient une question a un mot et etranglaient un petit bac.
   */
  const durationSec = question
    ? secondsFor(question.kind, question.difficulty, options.pace)
    : 0

  /**
   * Les repondants, avec la question dont ils viennent.
   *
   * C'est ce couple qui corrige le double saut. Une liste seule survivait a
   * un changement de question : au rendu ou l'etape avance, elle portait
   * encore les reponses de la precedente, l'ecran concluait que tout le
   * monde avait deja repondu et sautait aussitot la suivante. Une reponse
   * qui ne dit pas de quelle question elle parle ne peut rien decider.
   */
  const [replies, setReplies] = useState<{ questionId: string; ids: string[] }>({
    questionId: '',
    ids: [],
  })
  const answered = replies.questionId === question?.id ? replies.ids : []

  /**
   * Le temps restant, avec le depart dont il vient.
   *
   * Meme piege que ci-dessus : un compte a rebours tombe a zero restait a
   * zero le temps d'un rendu apres le changement de question, ce qui
   * relancait immediatement un passage.
   */
  const [clock, setClock] = useState<{ startedAt: string; left: number }>({
    startedAt: '',
    left: 0,
  })
  const remaining =
    clock.startedAt === room.step_started_at ? clock.left : durationSec
  const timeUp = remaining <= 0

  // Chaque question repart de zero, et sa reponse deja envoyee est relue :
  // rafraichir sa page ne doit rien faire perdre.
  useEffect(() => {
    setAnswer(null)
    setSaved(false)
    setDone(false)
    stored.current = ''
    if (!question || !youId) return

    void myAnswer(room.id, youId, question.id).then((previous) => {
      if (!previous) return
      setDone(previous.submitted)
      if (previous.payload === null) return
      setAnswer(previous.payload as AnswerPayload)
      stored.current = JSON.stringify(previous.payload)
      setSaved(true)
    })
  }, [room.id, youId, question])

  // Qui a repondu, sans jamais dire quoi.
  useEffect(() => {
    if (!question) return
    const questionId = question.id

    const poll = () =>
      void answeredPlayers(room.id, questionId).then((ids) =>
        setReplies({ questionId, ids }),
      )

    poll()
    // Une seconde et demie : c'est ce qui separe la derniere validation du
    // passage a la question suivante, et trois secondes se sentent.
    const timer = window.setInterval(poll, 1500)
    return () => window.clearInterval(timer)
  }, [room.id, question])

  /**
   * Le minuteur se calcule sur l'heure de depart en base, jamais sur un
   * compte a rebours local : deux joueurs n'auraient pas le meme temps.
   */
  useEffect(() => {
    const startedAtIso = room.step_started_at
    if (!startedAtIso) return

    const startedAt = new Date(startedAtIso).getTime()
    const tick = () => {
      const left = durationSec * 1000 - (Date.now() - startedAt)
      setClock({ startedAt: startedAtIso, left: Math.max(0, left / 1000) })
    }

    tick()
    // Dix fois par seconde : la barre doit descendre sans a-coups, un
    // rafraichissement a la seconde la ferait sauter par paliers.
    const timer = window.setInterval(tick, 100)
    return () => window.clearInterval(timer)
  }, [durationSec, room.step_started_at])

  const send = useCallback(async () => {
    if (!question || !youId || !answer) return

    const body = JSON.stringify(answer)
    if (body === stored.current) return

    stored.current = body
    setError(null)
    try {
      await submitAnswer({
        roomId: room.id,
        playerId: youId,
        questionId: question.id,
        payload: answer,
      })
      setSaved(true)
    } catch (cause) {
      // La prochaine frappe reessaiera : on oublie ce qui n'est pas passe.
      stored.current = ''
      setSaved(false)
      setError(cause instanceof Error ? cause.message : 'Réponse non enregistrée.')
    }
  }, [room.id, youId, question, answer])

  /**
   * L'enregistrement suit la saisie, avec un temps mort.
   *
   * Une demi-seconde sans rien taper suffit : ecrire a chaque lettre
   * multiplierait les ecritures pour rien, et attendre davantage risquerait
   * de perdre les derniers mots au moment ou le temps tombe.
   */
  useEffect(() => {
    if (!answer || timeUp || done) return

    // Une reponse relue depuis le serveur est deja a jour : l'annoncer en
    // cours d'enregistrement laisserait le message tourner indefiniment.
    if (JSON.stringify(answer) === stored.current) {
      setSaved(true)
      return
    }

    setSaved(false)
    const timer = window.setTimeout(() => void send(), 500)
    return () => window.clearTimeout(timer)
  }, [answer, timeUp, done, send])

  // Le temps est ecoule : ce qui n'est pas encore parti part maintenant,
  // sans attendre le temps mort.
  useEffect(() => {
    if (timeUp) void send()
  }, [timeUp, send])

  /**
   * Question deja quittee, pour ne pas ecrire deux fois la meme transition
   * pendant le court instant ou l'ecriture est en vol.
   */
  const leaving = useRef<string | null>(null)

  /**
   * C'est le temps qui fait avancer la partie, plus un bouton.
   *
   * Un seul client declenche le passage, celui de l'hote : sinon six
   * navigateurs ecriraient la meme transition en meme temps. Les autres la
   * recoivent par le temps reel, comme tout le reste.
   */
  useEffect(() => {
    if (!isHost || !question) return
    if (leaving.current === question.id) return
    // Le passage se decide sur des donnees qui portent leur question : rien
    // de ce qui vient de la precedente ne peut declencher celui-ci.
    if (replies.questionId !== question.id) return
    if (clock.startedAt !== room.step_started_at) return

    const everyoneDone =
      players.length > 0 && replies.ids.length >= players.length
    if (clock.left > 0 && !everyoneDone) return

    leaving.current = question.id
    const action =
      step >= questions.length - 1 ? startGrading(room.id) : advanceQuiz(room.id, step + 1)
    void action.catch(() => {
      // Une transition refusee doit rester rejouable, sinon la partie se
      // fige sur une question au premier hoquet reseau.
      leaving.current = null
    })
  }, [
    isHost,
    question,
    clock,
    replies,
    players.length,
    room.id,
    room.step_started_at,
    step,
    questions.length,
  ])

  if (!question) {
    return (
      <p className="text-muted py-16 text-center text-[17px]">
        Aucune question dans cette partie.
      </p>
    )
  }

  const locked = timeUp || done

  /** Valider, c'est dire « j'ai fini » : la reponse ne bouge plus. */
  async function validate() {
    if (!question || !youId || done) return
    setBusy(true)
    setError(null)
    try {
      await lockAnswer({
        roomId: room.id,
        playerId: youId,
        questionId: question.id,
        payload: answer,
      })
      stored.current = answer ? JSON.stringify(answer) : ''
      setSaved(Boolean(answer))
      setDone(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Validation impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        {/* La barre garde son dessin d'origine : l'enonce a gauche, la
            difficulte a droite. Le bouton de validation se pose par-dessus,
            hors du flux, pour ne rien deplacer. */}
        <div className="relative flex flex-wrap items-center justify-between gap-3 pr-12">
          <span className="eyebrow text-faint">
            Question {step + 1} sur {questions.length} · {KIND_LABELS[question.kind]}
          </span>
          {/* Le theme au choix n'annonce ni difficulte ni points : c'est le
              joueur qui les fixe, et les afficher d'avance mentirait. */}
          {question.kind !== 'theme' && (
            <QuestionMeta difficulty={question.difficulty} points={question.points} />
          )}

          {/* Valider ne sert pas a envoyer la reponse, qui part deja toute
              seule : c'est dire « j'ai fini ». Quand toute la table a
              valide, on passe sans attendre le minuteur. */}
          <IconButton
            label={done ? 'Réponse validée' : 'Valider ma réponse'}
            size="sm"
            variant={done ? 'ghost' : 'raised'}
            disabled={done || timeUp || busy}
            onClick={() => void validate()}
            className={cn(
              'absolute top-1/2 right-0 -translate-y-1/2',
              done && 'text-accent disabled:opacity-100',
            )}
          >
            <CheckIcon className="size-[18px]" />
          </IconButton>
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
                width: `${Math.max(0, Math.min(100, (remaining / durationSec) * 100))}%`,
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
        {question.kind === 'association' && (
          <PairsQuestion
            payload={question.payload as PairsPayload}
            value={answer?.kind === 'association' ? answer : null}
            disabled={locked}
            onChange={setAnswer}
          />
        )}
        {question.kind === 'petit_bac' && (
          <PetitBacQuestion
            payload={question.payload as PetitBacPayload}
            value={answer?.kind === 'petit_bac' ? answer : null}
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
        {question.kind === 'frise' && (
          <TimelineQuestion
            payload={question.payload as TimelinePayload}
            value={answer?.kind === 'frise' ? answer : null}
            disabled={locked}
            onChange={setAnswer}
          />
        )}
        {question.kind === 'carte' && (
          <MapQuestion
            payload={question.payload as MapPayload}
            value={answer?.kind === 'carte' ? answer : null}
            disabled={locked}
            onChange={setAnswer}
          />
        )}
        {question.kind === 'silhouette' && (
          <SilhouetteQuestion
            payload={question.payload as SilhouettePayload}
            value={answer?.kind === 'silhouette' ? answer : null}
            disabled={locked}
            onChange={setAnswer}
          />
        )}
        {question.kind === 'theme' && (
          <ThemeQuestion
            payload={question.payload as ThemePayload}
            value={answer?.kind === 'theme' ? answer : null}
            disabled={locked}
            onChange={setAnswer}
          />
        )}
      </Panel>

      <div className="flex flex-col items-center gap-3">
        {/* Plus rien a valider : l'etat dit simplement ou en est la
            reponse, pour qu'on sache qu'elle compte sans avoir a cliquer. */}
        <p
          className={cn(
            'flex items-center gap-2 text-[15px]',
            saved ? 'text-accent font-medium' : 'text-faint',
          )}
        >
          {saved && <CheckIcon className="size-4" />}
          {timeUp
            ? 'Temps écoulé'
            : saved
              ? 'Réponse enregistrée'
              : answer
                ? 'Enregistrement…'
                : 'Votre réponse s’enregistre toute seule'}
        </p>

        {/* On voit qui a repondu, jamais ce qu'ils ont repondu. */}
        <p className="text-faint text-[13px]">
          {answered.length} sur {players.length} ont validé
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

      {error && (
        <p role="alert" className="text-rec text-center text-[15px]">
          {error}
        </p>
      )}
    </div>
  )
}
