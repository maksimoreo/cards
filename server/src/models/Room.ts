import { v4 as uuidv4 } from 'uuid'

import RoomGameTakeSix from '../lib/RoomGameTakeSix/Game'
import User from './User'

export type GameOptions = {
  type: 'takeSix'
  mode: 'normal' | 'expert'
  stepTimeout: number
  playerInactivityStrategy: 'forcePlay' | 'moveToSpectators' | 'kick'
}

export default class Room {
  public name: string
  public readonly users: User[]
  public readonly id: string
  public owner: User
  public password: string
  public game?: RoomGameTakeSix
  public gameOptions: GameOptions

  constructor(options: { id?: string; name: string; owner: User; password?: string }) {
    this.users = []
    this.name = options.name
    this.id = options.id ?? uuidv4()
    this.owner = options.owner
    this.password = options.password ?? ''
    this.gameOptions = { type: 'takeSix', mode: 'normal', stepTimeout: 30000, playerInactivityStrategy: 'forcePlay' }
  }

  public get allUsers(): User[] {
    return [this.owner].concat(this.users)
  }

  public isProtectedByPassword(): boolean {
    return this.password.length > 0
  }

  public close(): void {
    if (this.game) {
      this.game.stopGame({ reason: 'Room closed' })
    }

    // Notify users that room is closed
    this.allUsers.forEach((user) => {
      user.socket.emit('notifyRoomClosed', { roomId: this.id })
    })
  }
}
