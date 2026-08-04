'use client'

import { useEffect, useState } from 'react'
import { ClipStep } from '@/components/room/ClipStep'
import { DubGame } from '@/components/dub/DubGame'
import { DubResult } from '@/components/dub/DubResult'
import { GradingDeck } from '@/components/quiz/GradingDeck'
import { Podium } from '@/components/quiz/Podium'
import { QuizGame } from '@/components/quiz/QuizGame'
import { loadQuestions } from '@/lib/quiz/actions'
import type { Question } from '@/lib/quiz/kinds'
import { RoomLobby } from '@/components/room/RoomLobby'
import type { SavedTake } from '@/lib/takes/actions'
import type { Player, Room } from '@/lib/supabase/types'
import { useRoomStore } from '@/stores/useRoomStore'

/**
 * Aiguilleur du salon : le même écran suit l'état en base et bascule du
 * lobby au jeu sans que personne ait à recharger.
 *
 * L'état initial vient du serveur, et le temps réel prend le relais dès
 * qu'il est prêt. Sans ce relais, on afficherait un chargement à chaque
 * arrivée alors que la donnée est déjà là.
 */
export interface DubContext {
  videoUrl: string
  durationSec: number
  aspectRatio: number
  takes: SavedTake[]
}

export function RoomScreen({
  code,
  youId,
  initialRoom,
  initialPlayers,
  dub,
  questions,
}: {
  code: string
  youId: string | null
  initialRoom: Room
  initialPlayers: Player[]
  dub: DubContext | null
  questions: Question[]
}) {
  /**
   * Les questions recues en props datent du rendu serveur, c'est-a-dire de
   * l'ouverture de la page — donc d'avant le tirage. Sans ce rechargement,
   * lancer une partie affichait « aucune question » alors qu'elles venaient
   * d'etre tirees.
   */
  const [drawn, setDrawn] = useState<Question[]>(questions)
  useEffect(() => setDrawn(questions), [questions])
  const {
    room: liveRoom,
    players: livePlayers,
    error,
    connect,
    disconnect,
  } = useRoomStore()

  useEffect(() => {
    void connect(code)
    return () => disconnect()
  }, [code, connect, disconnect])

  const room = liveRoom ?? initialRoom
  const players = liveRoom ? livePlayers : initialPlayers

  const ids = Array.isArray(room.question_ids) ? (room.question_ids as string[]) : []
  const idsKey = ids.join(',')

  useEffect(() => {
    if (idsKey === '') return
    // Le tirage a change sous nos pieds : on va chercher les enonces.
    if (drawn.length === ids.length && drawn.every((q, i) => q.id === ids[i])) return
    void loadQuestions(ids).then(setDrawn)
    // `idsKey` resume le tirage : comparer le tableau lui-meme relancerait
    // l'effet a chaque rendu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-fg text-[17px]">{error}</p>
      </div>
    )
  }

  if (room.status === 'lobby') {
    return <RoomLobby room={room} players={players} youId={youId} />
  }

  if (room.game === 'quiz') {
    if (room.status === 'results') return <Podium room={room} youId={youId} />
    if (room.status === 'grading') {
      return (
        <GradingDeck
          room={room}
          players={players}
          youId={youId}
          questions={drawn}
        />
      )
    }
    return (
      <QuizGame room={room} players={players} youId={youId} questions={drawn} />
    )
  }

  // Le doublage ne peut pas commencer sans matiere : l'import devient une
  // etape a part entiere, apres le lobby et avant le jeu.
  if (room.game === 'dub' && !room.clip_id) {
    const you = players.find((player) => player.id === youId)
    return <ClipStep room={room} isHost={you?.is_host ?? false} />
  }

  if (room.game === 'dub' && dub && room.status === 'results') {
    return (
      <DubResult
        room={room}
        players={players}
        youId={youId}
        videoUrl={dub.videoUrl}
        durationSec={dub.durationSec}
        aspectRatio={dub.aspectRatio}
        takes={dub.takes}
      />
    )
  }

  if (room.game === 'dub' && dub) {
    return (
      <DubGame
        room={room}
        players={players}
        youId={youId}
        videoUrl={dub.videoUrl}
        durationSec={dub.durationSec}
        aspectRatio={dub.aspectRatio}
        initialTakes={dub.takes}
      />
    )
  }

  return (
    <div className="py-16 text-center">
      <p className="eyebrow text-accent">Partie lancée</p>
      <p className="text-fg mt-3 text-[17px]">
        Le jeu « {room.game} » n’est pas encore branché sur le salon.
      </p>
      <p className="text-faint mt-2 text-[13px]">
        Le socle fonctionne : {players.length} joueur
        {players.length > 1 ? 's' : ''} connecté
        {players.length > 1 ? 's' : ''}, état partagé en direct.
      </p>
    </div>
  )
}
