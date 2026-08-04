'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { mergeOptions } from '@/lib/rooms/options'
import { isAutoScored, type AnswerPayload, type Question } from './kinds'
import {
  scoreEstimate,
  scoreOddOneOut,
  scorePairs,
  scoreRanking,
  type LatLng,
} from './scoring'
import { scoreDistance } from './scoring'

export interface PlayerAnswer {
  playerId: string
  nickname: string
  payload: unknown
  autoScore: number | null
  finalScore: number | null
  graded: boolean
}

/**
 * Tire les questions de la partie et lance le quiz.
 *
 * Le tirage se fait au lancement et non a la volee : une partie doit rester
 * la meme si quelqu'un rafraichit sa page, et la liste doit exister avant
 * qu'on puisse afficher « question 3 sur 20 ».
 */
export async function startQuiz(roomId: string): Promise<void> {
  const supabase = createServiceClient()

  const { data: room } = await supabase
    .from('rooms')
    .select('options')
    .eq('id', roomId)
    .maybeSingle()

  const { questionCount, shuffle } = mergeOptions(room?.options)

  const { data: pool } = await supabase
    .from('questions')
    .select('id')
    .limit(500)

  if (!pool || pool.length === 0) {
    throw new Error('La banque de questions est vide.')
  }

  // On tire toujours au hasard dans la banque ; l'option « ordre aleatoire »
  // ne decide que de l'ordre dans lequel les questions tombent ensuite.
  const drawn = [...pool].sort(() => Math.random() - 0.5).slice(0, questionCount)
  const ordered = shuffle ? drawn.sort(() => Math.random() - 0.5) : drawn

  const { error } = await supabase
    .from('rooms')
    .update({
      status: 'playing',
      current_step: 0,
      step_started_at: new Date().toISOString(),
      question_ids: ordered.map((question) => question.id),
    })
    .eq('id', roomId)

  if (error) throw new Error(`Impossible de lancer le quiz : ${error.message}`)
}

/** Les questions de la partie, sans jamais la correction attendue. */
export async function loadQuestions(ids: string[]): Promise<Question[]> {
  if (ids.length === 0) return []

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('questions')
    .select('id, idx, kind, prompt, hint, points, payload')
    .in('id', ids)

  const byId = new Map((data ?? []).map((question) => [question.id, question]))

  // L'ordre du tirage fait foi, pas celui de la base.
  return ids
    .map((id) => byId.get(id))
    .filter((question): question is NonNullable<typeof question> => Boolean(question))
    .map((question, index) => ({
      id: question.id,
      idx: index,
      kind: question.kind as Question['kind'],
      prompt: question.prompt,
      hint: question.hint,
      points: question.points,
      payload: question.payload,
    }))
}

/**
 * Enregistre une reponse et la note quand la forme le permet.
 *
 * La note automatique est calculee ici, cote serveur : la correction
 * attendue ne doit jamais atteindre le navigateur pendant la partie.
 */
export async function submitAnswer(input: {
  roomId: string
  playerId: string
  questionId: string
  payload: AnswerPayload
  bet?: number
}): Promise<void> {
  const supabase = createServiceClient()

  const { data: question } = await supabase
    .from('questions')
    .select('kind, answer, points')
    .eq('id', input.questionId)
    .maybeSingle()

  if (!question) throw new Error('Question introuvable.')

  const kind = question.kind as Question['kind']
  const auto = isAutoScored(kind)
    ? scoreOf(kind, input.payload, question.answer) * question.points
    : null

  const { error } = await supabase.from('answers').upsert(
    {
      room_id: input.roomId,
      player_id: input.playerId,
      question_id: input.questionId,
      payload: input.payload as never,
      bet: Math.min(3, Math.max(1, input.bet ?? 1)),
      auto_score: auto,
      // La machine propose ; tant que l'hote n'est pas passe, sa note fait
      // foi par defaut, ce qui evite un ecran de correction vide.
      final_score: auto,
      graded_by_host: false,
    },
    { onConflict: 'room_id,player_id,question_id' },
  )

  if (error) throw new Error(`Réponse non enregistrée : ${error.message}`)
}

function scoreOf(
  kind: Question['kind'],
  given: AnswerPayload,
  expected: unknown,
): number {
  try {
    if (kind === 'estimation' && given.kind === 'estimation') {
      return scoreEstimate(given.value, Number(expected))
    }
    if ((kind === 'classement' || kind === 'frise') && given.kind === 'classement') {
      return scoreRanking(given.order, expected as string[])
    }
    if (kind === 'intrus' && given.kind === 'intrus') {
      return scoreOddOneOut(given.choice, String(expected))
    }
    if (kind === 'association') {
      return scorePairs(
        given as unknown as Record<string, string>,
        expected as Record<string, string>,
      )
    }
    if (kind === 'carte') {
      const target = expected as { point: LatLng; maxKm: number }
      return scoreDistance(
        given as unknown as LatLng,
        target.point,
        target.maxKm ?? 500,
      )
    }
  } catch {
    // Une correction mal formee ne doit pas interrompre la partie : la
    // question retombe simplement sur l'arbitrage de l'hote.
    return 0
  }
  return 0
}

/** Passe a la question suivante. Reservee a l'hote. */
export async function advanceQuiz(roomId: string, step: number): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('rooms')
    .update({ current_step: step, step_started_at: new Date().toISOString() })
    .eq('id', roomId)

  if (error) throw new Error(`Impossible d’avancer : ${error.message}`)
}

/** Fin des questions : on passe a la correction. */
export async function startGrading(roomId: string): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'grading', current_step: 0 })
    .eq('id', roomId)

  if (error) throw new Error(`Impossible de corriger : ${error.message}`)
}

/** L'hote tranche. Sa note remplace celle de la machine. */
export async function gradeAnswers(
  answerIds: string[],
  score: number,
): Promise<void> {
  if (answerIds.length === 0) return

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('answers')
    .update({ final_score: score, graded_by_host: true })
    .in('id', answerIds)

  if (error) throw new Error(`Correction non enregistrée : ${error.message}`)
}

export async function publishResults(roomId: string): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'results' })
    .eq('id', roomId)

  if (error) throw new Error(`Impossible de publier : ${error.message}`)
}
