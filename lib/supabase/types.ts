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

export type RoomStatus = Room['status']
