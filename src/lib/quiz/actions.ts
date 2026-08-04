'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { mergeOptions } from '@/lib/rooms/options'
import { drawQuestions, spreadKinds } from './draw'
import { isAutoScored, type AnswerPayload, type Question } from './kinds'
import {
  scoreDistance,
  scoreEstimate,
  scoreList,
  scoreOddOneOut,
  scorePairs,
  scoreRanking,
  scoreTimeline,
  scoreWritten,
  type LatLng,
} from './scoring'

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

  const { questionCount, shuffle, kinds } = mergeOptions(room?.options)

  const { data: pool } = await supabase
    .from('questions')
    .select('id, kind, idx')
    .in('kind', kinds)
    .limit(500)

  if (!pool || pool.length === 0) {
    throw new Error(
      'Aucune question ne correspond aux formes choisies. Réactivez-en une.',
    )
  }

  // On tire toujours au hasard dans la banque ; l'option « ordre aleatoire »
  // ne decide que de l'ordre dans lequel les questions tombent ensuite.
  // Rangee, la partie suit l'ordre de la banque, donc ses themes.
  const drawn = drawQuestions(
    pool as { id: string; kind: Question['kind']; idx: number }[],
    questionCount,
  )
  // L'espacement des formes est refait apres le rangement, sinon trier par
  // theme remettrait toutes les cartes bout a bout.
  const ordered = shuffle
    ? drawn
    : spreadKinds([...drawn].sort((a, b) => a.idx - b.idx))

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
    .select('id, idx, kind, prompt, hint, points, difficulty, payload')
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
      difficulty: question.difficulty,
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
    if (kind === 'ecrite' && given.kind === 'ecrite') {
      const accepted = (expected as { accepted?: string[] })?.accepted ?? []
      return scoreWritten(given.text, accepted)
    }
    if (kind === 'liste' && given.kind === 'liste') {
      const target = expected as { accepted?: string[]; count?: number }
      return scoreList(given.items, target?.accepted ?? [], target?.count ?? 1)
    }
    if (kind === 'estimation' && given.kind === 'estimation') {
      return scoreEstimate(given.value, Number(expected))
    }
    if (kind === 'classement' && given.kind === 'classement') {
      return scoreRanking(given.order, expected as string[])
    }
    if (kind === 'frise' && given.kind === 'frise') {
      const target = expected as { year: number; maxGap: number; exact?: number }
      return scoreTimeline(given.year, target.year, target.maxGap, target.exact ?? 0)
    }
    if (kind === 'intrus' && given.kind === 'intrus') {
      return scoreOddOneOut(given.choice, String(expected))
    }
    if (kind === 'association' && given.kind === 'association') {
      return scorePairs(given.pairs, expected as Record<string, string>)
    }
    if (kind === 'carte' && given.kind === 'carte') {
      const target = expected as { point: LatLng; maxKm: number }
      return scoreDistance(given, target.point, target.maxKm ?? 500)
    }
    if (kind === 'silhouette' && given.kind === 'silhouette') {
      const accepted = (expected as { accepted?: string[] })?.accepted ?? []
      return scoreWritten(given.text, accepted)
    }
    if (kind === 'theme' && given.kind === 'theme') {
      const target = expected as {
        max: number
        levels: Record<string, { accepted: string[]; points: number }>
      }
      const level = target.levels[String(given.level)]
      if (!level) return 0
      // Le joueur a choisi ce que sa question vaut : une facile juste ne
      // peut pas rapporter autant qu'une difficile juste, sans quoi le
      // choix n'en serait plus un.
      return scoreWritten(given.text, level.accepted) * (level.points / target.max)
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

/**
 * Qui a repondu, sans dire quoi.
 *
 * La politique RLS interdit toute lecture des reponses avant les resultats,
 * y compris les siennes : faute de comptes, elle ne peut pas distinguer un
 * joueur d'un autre. Tout ce dont le client a besoin passe donc par ici,
 * et on ne rend que ce qui ne renseigne sur rien.
 */
export async function answeredPlayers(
  roomId: string,
  questionId: string,
): Promise<string[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('answers')
    .select('player_id')
    .eq('room_id', roomId)
    .eq('question_id', questionId)
    .eq('submitted', true)

  return (data ?? []).map((answer) => answer.player_id)
}

/** Sa propre reponse, pour la retrouver apres un rafraichissement. */
export async function myAnswer(
  roomId: string,
  playerId: string,
  questionId: string,
): Promise<{ payload: unknown; submitted: boolean } | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('answers')
    .select('payload, submitted')
    .eq('room_id', roomId)
    .eq('player_id', playerId)
    .eq('question_id', questionId)
    .maybeSingle()

  if (!data) return null

  // Valider sans rien saisir laisse une reponse vide en base : elle n'a pas
  // de forme, et la rendre telle quelle remplirait l'ecran d'un objet qui
  // ne veut rien dire.
  const payload = data.payload as { kind?: unknown } | null
  const real = payload && typeof payload === 'object' && 'kind' in payload

  return { payload: real ? data.payload : null, submitted: data.submitted }
}

/**
 * « J'ai fini. »
 *
 * La reponse s'enregistre deja toute seule ; valider dit autre chose : que
 * le joueur ne la retouchera plus. Quand toute la table a valide, la
 * question suivante arrive sans attendre le minuteur.
 */
export async function lockAnswer(input: {
  roomId: string
  playerId: string
  questionId: string
  payload: AnswerPayload | null
}): Promise<void> {
  // Valider sans avoir rien saisi doit rester possible : on cree alors une
  // reponse vide, sans quoi la table attendrait indefiniment quelqu'un qui
  // a renonce.
  if (input.payload) {
    await submitAnswer({
      roomId: input.roomId,
      playerId: input.playerId,
      questionId: input.questionId,
      payload: input.payload,
    })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('answers').upsert(
    {
      room_id: input.roomId,
      player_id: input.playerId,
      question_id: input.questionId,
      // La colonne n'accepte pas l'absence de valeur : un objet vide dit
      // « rien saisi » sans mentir sur la forme.
      ...(input.payload ? {} : { payload: {} as never }),
      submitted: true,
    },
    { onConflict: 'room_id,player_id,question_id' },
  )

  if (error) throw new Error(`Validation impossible : ${error.message}`)
}

/**
 * Toutes les reponses a une question, pour l'hote.
 *
 * Refuse tant que la partie n'est pas en correction : sans comptes, rien
 * n'empeche un joueur d'appeler cette action depuis sa console, et la
 * seule barriere possible est l'etat du salon.
 */
export async function answersFor(
  roomId: string,
  questionId: string,
): Promise<(PlayerAnswer & { id: string })[]> {
  const supabase = createServiceClient()

  const { data: room } = await supabase
    .from('rooms')
    .select('status')
    .eq('id', roomId)
    .maybeSingle()

  if (room?.status !== 'grading' && room?.status !== 'results') {
    throw new Error('Les réponses ne sont pas encore consultables.')
  }

  const { data } = await supabase
    .from('answers')
    .select('id, player_id, payload, auto_score, final_score, graded_by_host')
    .eq('room_id', roomId)
    .eq('question_id', questionId)

  const { data: players } = await supabase
    .from('players')
    .select('id, nickname')
    .eq('room_id', roomId)

  const names = new Map((players ?? []).map((p) => [p.id, p.nickname]))

  return (data ?? []).map((answer) => ({
    id: answer.id,
    playerId: answer.player_id,
    nickname: names.get(answer.player_id) ?? 'Anonyme',
    payload: answer.payload,
    autoScore: answer.auto_score === null ? null : Number(answer.auto_score),
    finalScore: answer.final_score === null ? null : Number(answer.final_score),
    graded: answer.graded_by_host,
  }))
}

/**
 * La correction attendue d'une question.
 *
 * Meme verrou que les reponses des joueurs : tant que la partie n'est pas
 * arrivee a la correction, elle ne sort pas de la base. C'est tout
 * l'interet de passer par une action serveur plutot que de la livrer avec
 * l'enonce.
 */
export async function expectedAnswer(
  roomId: string,
  questionId: string,
): Promise<unknown> {
  const supabase = createServiceClient()

  const { data: room } = await supabase
    .from('rooms')
    .select('status')
    .eq('id', roomId)
    .maybeSingle()

  if (room?.status !== 'grading' && room?.status !== 'results') {
    throw new Error('La correction n’est pas encore consultable.')
  }

  const { data } = await supabase
    .from('questions')
    .select('answer')
    .eq('id', questionId)
    .maybeSingle()

  return data?.answer ?? null
}

export interface Standing {
  playerId: string
  nickname: string
  score: number
  /** Ce que l'hote a ajoute ou retire a la main, deja compris dans `score`. */
  bonus: number
  answered: number
}

/** Le classement final. Seule la note retenue par l'hote compte. */
export async function standings(roomId: string): Promise<Standing[]> {
  const supabase = createServiceClient()

  const { data: players } = await supabase
    .from('players')
    .select('id, nickname, bonus')
    .eq('room_id', roomId)
    .order('slot')

  const { data: answers } = await supabase
    .from('answers')
    .select('player_id, final_score')
    .eq('room_id', roomId)

  return (players ?? [])
    .map((player) => {
      const own = (answers ?? []).filter((a) => a.player_id === player.id)
      const earned = own.reduce((sum, a) => sum + Number(a.final_score ?? 0), 0)
      return {
        playerId: player.id,
        nickname: player.nickname,
        // Le rattrapage de l'hote fait partie du score, il ne s'affiche pas
        // a cote : le podium doit montrer un total, pas une addition.
        score: earned + Number(player.bonus ?? 0),
        bonus: Number(player.bonus ?? 0),
        answered: own.length,
      }
    })
    .sort((a, b) => b.score - a.score)
}

/**
 * Le rattrapage de fin de correction.
 *
 * La machine se trompe, l'hote aussi : une reponse juste refusee, un
 * doublon compte deux fois. Revenir en arriere question par question
 * couterait dix minutes ; on corrige le total.
 */
export async function adjustScore(playerId: string, delta: number): Promise<void> {
  const supabase = createServiceClient()

  const { data: player } = await supabase
    .from('players')
    .select('bonus')
    .eq('id', playerId)
    .maybeSingle()

  if (!player) throw new Error('Joueur introuvable.')

  const { error } = await supabase
    .from('players')
    .update({ bonus: Number(player.bonus ?? 0) + delta })
    .eq('id', playerId)

  if (error) throw new Error(`Ajustement impossible : ${error.message}`)
}

export async function publishResults(roomId: string): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('rooms')
    .update({ status: 'results' })
    .eq('id', roomId)

  if (error) throw new Error(`Impossible de publier : ${error.message}`)
}
