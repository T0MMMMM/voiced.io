import type { Database } from '@/types/db'

type Tables = Database['public']['Tables']

export type Clip = Tables['clips']['Row']
export type Character = Tables['characters']['Row']
export type Scene = Tables['scenes']['Row']
export type Room = Tables['rooms']['Row']
export type Player = Tables['players']['Row']
export type Assignment = Tables['assignments']['Row']
export type Take = Tables['takes']['Row']

export type ClipInsert = Tables['clips']['Insert']
export type SceneInsert = Tables['scenes']['Insert']
export type RoomInsert = Tables['rooms']['Insert']
export type TakeInsert = Tables['takes']['Insert']

/**
 * Le schema exprime ces valeurs par des contraintes CHECK plutot que par
 * des types enum Postgres. Le generateur de types ne sait pas les traduire :
 * `Room['status']` resout donc vers `string`, ce qui ferait perdre tout le
 * benefice du typage sur la valeur qui pilote la machine a etats d'une partie.
 *
 * On declare donc les unions a la main. `Narrows` sert de garde-fou : il
 * exige que l'union declaree reste assignable a la colonne generee, ce qui
 * fait echouer la compilation si le schema change sous nos pieds.
 */
type Narrows<Union extends Column, Column> = Union

export type RoomStatus = Narrows<
  'lobby' | 'casting' | 'dubbing' | 'review' | 'done',
  Room['status']
>

export type ClipSource = Narrows<'library' | 'custom', Clip['source']>

export type PlayerSlot = Narrows<1 | 2, Player['slot']>
