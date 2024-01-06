import { v4 as uuidv4 } from 'uuid'

import App from '../App'
import RoomGameTakeSix from '../lib/RoomGameTakeSix/Game'
import User from './User'

export type GameOptions = {
  type: 'takeSix'
  mode: 'normal' | 'expert'
  stepTimeout: number
  playerInactivityStrategy: 'forcePlay' | 'moveToSpectators' | 'kick'
}

export default class Room {
  public readonly app: App
  public name: string
  public readonly users: User[]
  public readonly id: string
  public owner: User
  public password: string
  public game?: RoomGameTakeSix
  public gameOptions: GameOptions
  public isDestroyed: boolean = false

  constructor(options: { app: App; id?: string; name: string; owner: User; password?: string }) {
    this.app = options.app
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
      this.game.stopGame({ reason: 'roomClosed' })
    }

    // Notify users that room is closed
    this.allUsers.forEach((user) => {
      user.socket.emit('s2c_roomClosed', { roomId: this.id })
    })
  }
}
