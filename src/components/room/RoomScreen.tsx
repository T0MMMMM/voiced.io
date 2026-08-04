'use client'

import { useEffect } from 'react'
import { ClipStep } from '@/components/room/ClipStep'
import { DubGame } from '@/components/dub/DubGame'
import { DubResult } from '@/components/dub/DubResult'
import { GradingDeck } from '@/components/quiz/GradingDeck'
import { Podium } from '@/components/quiz/Podium'
import { QuizGame } from '@/components/quiz/QuizGame'
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
          questions={questions}
        />
      )
    }
    return (
      <QuizGame room={room} players={players} youId={youId} questions={questions} />
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
