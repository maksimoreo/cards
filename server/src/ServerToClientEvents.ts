import { DecoratedGlobalRoom, DecoratedRoom } from './decorators/RoomDecorator'
import { DecoratedUser } from './decorators/UserDecorator'
import { SerializedState } from './lib/RoomGameTakeSix/Game'
import Card from './lib/TakeSix/Card'
import { SerializedStep } from './lib/TakeSix/TakeSix'
import { GameOptions } from './models/Room'

export type UserLeftReason = 'selfAction' | 'kickedForInactivity' | 'kickedByOwner' | 'kickedByVote' | 'disconnected'

// Events data types
export interface EventData_s2c_userLeft {
  userId: string
  reason: UserLeftReason
  newRoomState: DecoratedRoom
  game: SerializedState | null
}

export interface EventData_s2c_usersLeft {
  userIds: string[]
  reason: UserLeftReason
  newRoomState: DecoratedRoom
  game: SerializedState | null
}

export interface EventData_s2c_ownerLeft {
  newOwner: DecoratedUser
  newRoomState: DecoratedRoom
  game: SerializedState | null
}

export interface EventData_s2c_userJoined {
  user: DecoratedUser
  newRoomState: DecoratedRoom
}

export interface EventData_s2c_userPlayedCard {
  userId: string
}

export interface EventData_s2c_gameStarted {
  // TODO: Rename gameState -> game
  gameState: SerializedState
  playerCards?: Card[]
}

export interface EventData_s2c_gameStopped {
  reason: string
}

export interface EventData_s2c_gameStep {
  step: SerializedStep
  // TODO: Rename gameState -> game
  gameState: SerializedState
  playerCards?: Card[]
}

export interface EventData_s2c_roomClosed {
  roomId: string
}

export interface EventData_s2c_userMessage {
  message: string
  user: DecoratedUser
}

export interface EventData_s2c_rooms {
  readonly rooms: readonly DecoratedGlobalRoom[]
}

export interface EventData_s2c_gameOptionsUpdated {
  readonly gameOptions: GameOptions
}

type UserMovedToSpectatorsReason = 'inactivity' | 'ownerAction' | 'selfAction'

export interface EventData_s2c_usersMovedToSpectators {
  readonly reason: UserMovedToSpectatorsReason
  readonly userIds: string[]
  readonly newRoomState: DecoratedRoom
  readonly game: SerializedState | null
}

export interface EventData_s2c_youHaveBeenMovedToSpectators {
  readonly reason: UserMovedToSpectatorsReason
  readonly newRoomState: DecoratedRoom
  readonly game: SerializedState | null
}

type UserKickedReason = 'inactivity' | 'ownerAction' | 'roomClosed'

export interface EventData_s2c_youHaveBeenKicked {
  readonly reason: UserKickedReason
}

type ServerToClientEventCallback<DataT> = (data: DataT) => void

// prettier-ignore
export interface ServerToClientEvents {
  s2c_userLeft:                     ServerToClientEventCallback<EventData_s2c_userLeft>
  s2c_usersLeft:                    ServerToClientEventCallback<EventData_s2c_usersLeft>
  s2c_ownerLeft:                    ServerToClientEventCallback<EventData_s2c_ownerLeft>
  s2c_userJoined:                   ServerToClientEventCallback<EventData_s2c_userJoined>
  s2c_userPlayedCard:               ServerToClientEventCallback<EventData_s2c_userPlayedCard>
  s2c_gameStarted:                  ServerToClientEventCallback<EventData_s2c_gameStarted>
  s2c_gameStopped:                  ServerToClientEventCallback<EventData_s2c_gameStopped>
  s2c_gameStep:                     ServerToClientEventCallback<EventData_s2c_gameStep>
  s2c_roomClosed:                   ServerToClientEventCallback<EventData_s2c_roomClosed>
  s2c_userMessage:                  ServerToClientEventCallback<EventData_s2c_userMessage>
  s2c_rooms:                        ServerToClientEventCallback<EventData_s2c_rooms>
  s2c_gameOptionsUpdated:           ServerToClientEventCallback<EventData_s2c_gameOptionsUpdated>
  s2c_usersMovedToSpectators:       ServerToClientEventCallback<EventData_s2c_usersMovedToSpectators>
  s2c_youHaveBeenMovedToSpectators: ServerToClientEventCallback<EventData_s2c_youHaveBeenMovedToSpectators>
  s2c_youHaveBeenKicked:            ServerToClientEventCallback<EventData_s2c_youHaveBeenKicked>
}
