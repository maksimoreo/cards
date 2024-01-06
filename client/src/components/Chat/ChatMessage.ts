import UserIdentity from './UserName/UserIdentity'
import { UsersLeftRoomReason } from './lines/utils'

export interface MessageBase<MessageType> {
  readonly type: MessageType

  // Will be used as React element key when rendering.
  // This field does not match index in the array
  // This ID is not stored on the server
  // The same message on a different client with have a different ID
  readonly id: string

  readonly timestamp: number
}

export interface RemoteUserMessage extends MessageBase<'remoteUserMessage'> {
  readonly sender: UserIdentity
  readonly text: string
}

export type LocalUserMessageDeliveryStatus = 'pending' | 'delivered' | 'error'
export interface LocalUserMessage extends MessageBase<'localUserMessage'> {
  readonly deliveryStatus: LocalUserMessageDeliveryStatus
  readonly sender: UserIdentity
  readonly text: string
}

export interface ServerMessage extends MessageBase<'serverMessage'> {
  readonly text: string
}

export interface LocalNotification extends MessageBase<'localNotification'> {
  readonly text: string
}

export interface Command extends MessageBase<'command'> {
  readonly text: string
}

export interface UserJoinedRoom extends MessageBase<'userJoinedRoom'> {
  readonly user: UserIdentity
  readonly roomName: string
}

export interface UserLeftRoom extends MessageBase<'userLeftRoom'> {
  readonly user: UserIdentity
  readonly roomName: string
}

export interface UsersLeftRoom extends MessageBase<'usersLeftRoom'> {
  readonly users: UserIdentity[]
  readonly roomName: string
  readonly reason: UsersLeftRoomReason
}

export interface OwnerLeftRoom extends MessageBase<'ownerLeftRoom'> {
  readonly user: UserIdentity
  readonly newRoomOwner: UserIdentity
  readonly roomName: string
}

export interface CurrentUserJoinedRoom extends MessageBase<'currentUserJoinedRoom'> {
  readonly roomName: string
}

export interface CurrentUserLeftRoom extends MessageBase<'currentUserLeftRoom'> {
  readonly roomName: string
  readonly reason: 'selfAction' | 'kickedForInactivity' // | 'kickedByOwner' | 'kickedByVote' | ...
}

export interface UserNameChange extends MessageBase<'userNameChange'> {
  readonly previousName: string
  readonly newName: string
  readonly newUserIdentity: UserIdentity
}

export interface GameStarted extends MessageBase<'gameStarted'> {
  readonly players: UserIdentity[]
}

export interface GameEnded extends MessageBase<'gameEnded'> {
  readonly sortedPlayers?:
    | {
        readonly user: UserIdentity
        readonly penaltyPoints: number
      }[]
    | null
    | undefined
  readonly reason: string
}

export interface UsersMovedToSpectators extends MessageBase<'usersMovedToSpectators'> {
  readonly users: UserIdentity[]
  readonly reason: 'inactivity' // | 'ownerAction' | ...
}

export interface YouHaveBeenMovedToSpectators extends MessageBase<'youHaveBeenMovedToSpectators'> {
  readonly reason: 'inactivity' // | 'ownerAction' | ...
}

export interface NewRoomOwner extends MessageBase<'newRoomOwner'> {
  readonly owner: UserIdentity
  readonly roomName: string
}

export type ChatMessage =
  | RemoteUserMessage
  | LocalUserMessage
  | ServerMessage
  | LocalNotification
  | Command
  | UserJoinedRoom
  | UserLeftRoom
  | UsersLeftRoom
  | OwnerLeftRoom
  | CurrentUserLeftRoom
  | CurrentUserJoinedRoom
  | GameStarted
  | GameEnded
  | UsersMovedToSpectators
  | YouHaveBeenMovedToSpectators
  | NewRoomOwner
