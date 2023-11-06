import Room, { GameOptions } from '../models/Room'
import { DecoratedUser, decorateUser } from './UserDecorator'

export interface DecoratedRoom {
  readonly id: string
  readonly name: string
  readonly users: readonly DecoratedUser[]
  readonly owner: DecoratedUser
  readonly gameOptions: GameOptions
}

export interface DecoratedGlobalRoom {
  readonly id: string
  readonly name: string
  readonly userCount: number
  readonly owner: string
  readonly isPlaying: boolean
}

export function decorateRoom(room: Room): DecoratedRoom {
  return {
    id: room.id,
    name: room.name,
    users: room.users.map(decorateUser),
    owner: decorateUser(room.owner),
    gameOptions: room.gameOptions,
  }
}

export function decorateGlobalRoom(room: Room): DecoratedGlobalRoom {
  return {
    id: room.id,
    name: room.name,
    userCount: room.allUsers.length,
    owner: room.owner.name,
    isPlaying: !!room.game,
  }
}
