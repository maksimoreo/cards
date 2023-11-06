import { SocketT } from '../ISocketData'
import { RoomGameTakeSixPlayer } from '../lib/RoomGameTakeSix/Player'

import Room from './Room'

const DEFAULT_USER_COLOR = 'D1D5DB'

export interface UserIdentity {
  readonly name: string
  readonly color: string
  readonly id: string
}

export default class User {
  public readonly socket: SocketT
  public readonly isBot: boolean
  public name: string
  public color: string
  public room: Room | undefined | null
  public player?: RoomGameTakeSixPlayer

  constructor({ socket, name, color, isBot }: { socket: SocketT; name: string; color?: string; isBot?: boolean }) {
    this.socket = socket
    this.name = name
    this.color = color ?? DEFAULT_USER_COLOR
    this.isBot = !!isBot
  }

  public get id(): string {
    return this.socket.id
  }

  public get identity(): UserIdentity {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
    }
  }

  public isRoomOwner(): boolean {
    return this.room?.owner.id === this.id
  }
}
