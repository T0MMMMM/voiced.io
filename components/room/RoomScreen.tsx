'use client'

import { useEffect } from 'react'
import { RoomLobby } from '@/components/room/RoomLobby'
import { Spinner } from '@/components/ui'
import { useRoomStore } from '@/stores/useRoomStore'

/**
 * Aiguilleur du salon : le meme ecran suit l'etat en base et bascule du
 * lobby au jeu sans que personne ait a recharger. C'est ce que garantit
 * la source de verite unique.
 */
export function RoomScreen({
  code,
  youId,
}: {
  code: string
  youId: string | null
}) {
  const { room, players, loading, error, connect, disconnect } = useRoomStore()

  useEffect(() => {
    void connect(code)
    return () => disconnect()
  }, [code, connect, disconnect])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Connexion au salon" />
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="py-16 text-center">
        <p className="text-fg text-[17px]">{error ?? 'Salon introuvable.'}</p>
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
