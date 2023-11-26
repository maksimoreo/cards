import { DecoratedGlobalRoom, DecoratedRoom } from './decorators/RoomDecorator'
import { DecoratedUser } from './decorators/UserDecorator'
import { SerializedState } from './lib/RoomGameTakeSix/Game'
import Card from './lib/TakeSix/Card'
import { SerializedStep } from './lib/TakeSix/TakeSix'
import { GameOptions } from './models/Room'

// Events data types
export interface NotifyUserLeftData {
  userId: string
  newRoomState: DecoratedRoom
  game: SerializedState | null
}

export interface NotifyOwnerLeftData {
  newOwner: DecoratedUser
  newRoomState: DecoratedRoom
  game: SerializedState | null
}

export interface NotifyUserJoinedData {
  user: DecoratedUser
  newRoomState: DecoratedRoom
}

export interface NotifyUserPlayedCardData {
  userId: string
}

export interface NotifyGameStartedData {
  // TODO: Rename gameState -> game
  gameState: SerializedState
  playerCards?: Card[]
}

export interface NotifyGameStoppedData {
  reason: string
}

export interface NotifyGameStepData {
  step: SerializedStep
  // TODO: Rename gameState -> game
  gameState: SerializedState
  playerCards?: Card[]
}

export interface NotifyRoomClosedData {
  roomId: string
}

export interface NotifyUserMessageData {
  message: string
  user: DecoratedUser
}

export interface EventData_Rooms {
  readonly rooms: readonly DecoratedGlobalRoom[]
}

export interface EventData_GameOptionsUpdated {
  readonly gameOptions: GameOptions
}

type UserMovedToSpectatorsReason = 'inactivity' | 'ownerAction' | 'selfAction'

export interface EventData_UserMovedToSpectators {
  readonly reason: UserMovedToSpectatorsReason
  readonly userId: string
  readonly newRoomState: DecoratedRoom
  readonly game: SerializedState | null
}

export interface EventData_UsersMovedToSpectators {
  readonly reason: UserMovedToSpectatorsReason
  readonly userIds: string[]
  readonly newRoomState: DecoratedRoom
  readonly game: SerializedState | null
}

export interface EventData_YouHaveBeenMovedToSpectators {
  readonly reason: UserMovedToSpectatorsReason
  readonly newRoomState: DecoratedRoom
  readonly game: SerializedState | null
}

// All events type

type ServerToClientEventCallback<DataT> = (data: DataT) => void

export interface ServerToClientEvents {
  notifyUserLeft: ServerToClientEventCallback<NotifyUserLeftData>
  notifyOwnerLeft: ServerToClientEventCallback<NotifyOwnerLeftData>
  notifyUserJoined: ServerToClientEventCallback<NotifyUserJoinedData>
  notifyUserPlayedCard: ServerToClientEventCallback<NotifyUserPlayedCardData>
  notifyGameStarted: ServerToClientEventCallback<NotifyGameStartedData>
  notifyGameStopped: ServerToClientEventCallback<NotifyGameStoppedData>
  notifyGameStep: ServerToClientEventCallback<NotifyGameStepData>
  notifyRoomClosed: ServerToClientEventCallback<NotifyRoomClosedData>
  notifyUserMessage: ServerToClientEventCallback<NotifyUserMessageData>
  rooms: ServerToClientEventCallback<EventData_Rooms>
  gameOptionsUpdated: ServerToClientEventCallback<EventData_GameOptionsUpdated>
  userMovedToSpectators: ServerToClientEventCallback<EventData_UserMovedToSpectators>
  usersMovedToSpectators: ServerToClientEventCallback<EventData_UsersMovedToSpectators>
  youHaveBeenMovedToSpectators: ServerToClientEventCallback<EventData_YouHaveBeenMovedToSpectators>
}
