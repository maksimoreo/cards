import App from '../App'
import { LOBBY_ROOM_NAME } from '../constants'
import Room from '../models/Room'
import User from '../models/User'
import { findSingleByIdOrThrow, removeSingleByIdOrThrow } from '../utils'

export type RemoveUsersFromRoomProps =
  | {
      readonly app: App
      readonly room: Room
      readonly userIds: readonly string[]
    }
  | {
      readonly app: App
      readonly room: Room
      readonly users: readonly User[]
    }

/**
 * Removes users from room, and if one of them was owner, passes ownership to next active user. If all users are removed from the room, also removes room from App's rooms database.
 */
export default class RemoveUsersFromRoom {
  public readonly app: App
  public readonly room: Room
  public readonly users: readonly User[]

  public static call(props: RemoveUsersFromRoomProps): void {
    new RemoveUsersFromRoom(props).call()
  }

  public constructor(props: RemoveUsersFromRoomProps) {
    const { room } = props

    if ('userIds' in props) {
      const invalidIds = props.userIds.filter((userId) => !room.allUsers.find((user) => user.id === userId))

      if (invalidIds.length > 0) {
        throw new Error('Given users IDs are not in the given room.')
      }

      this.users = props.userIds.map((userId) => findSingleByIdOrThrow(room.allUsers, userId))
    } else {
      this.users = props.users
    }

    this.app = props.app
    this.room = room
  }

  public call(): void {
    const { room, users } = this

    if (users.length === room.allUsers.length) {
      room.users.splice(0)
      removeSingleByIdOrThrow(this.app.rooms, room.id)
      room.isDestroyed = true
    } else {
      users.forEach((user) => {
        const index = room.users.findIndex((member) => member.id === user.id)

        if (index === -1) {
          return
        }

        room.users.splice(index, 1)
      })

      // Set new room owner
      if (users.some((user) => user.id === room.owner.id)) {
        room.owner = room.users[0]
        room.users.splice(0, 1)
      }
    }

    users.forEach((user) => {
      // Move socket room
      user.socket.leave(room.name)
      user.socket.join(LOBBY_ROOM_NAME)

      // Nullify room
      user.room = null
    })
  }
}
