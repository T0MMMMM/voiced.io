'use client'

import { useEffect } from 'react'
import { RoomLobby } from '@/components/room/RoomLobby'
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
export function RoomScreen({
  code,
  youId,
  initialRoom,
  initialPlayers,
}: {
  code: string
  youId: string | null
  initialRoom: Room
  initialPlayers: Player[]
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
