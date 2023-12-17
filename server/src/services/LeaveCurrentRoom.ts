import App from '../App'
import { LOBBY_ROOM_NAME } from '../constants'
import { decorateRoom } from '../decorators/RoomDecorator'
import { decorateUser } from '../decorators/UserDecorator'
import Room from '../models/Room'
import User from '../models/User'
import { removeSingleByIdOrThrow, removeSingleByPropertyOrThrow } from '../utils'
import ScheduleRoomsEventToLobbyUsers from './ScheduleRoomsEventToLobbyUsers'

interface LeaveCurrentRoomProps {
  readonly app: App
  readonly user: User
  readonly room: Room
}

// Removes User from current Room
export default class LeaveCurrentRoom {
  public readonly isOwner: boolean
  public readonly isOwnerAndLastUserInRoom: boolean

  public static call(props: LeaveCurrentRoomProps): void {
    new LeaveCurrentRoom(props).call()
  }

  constructor(private readonly props: LeaveCurrentRoomProps) {
    this.isOwner = props.room.owner.id === props.user.id
    this.isOwnerAndLastUserInRoom = props.room.users.length === 0
  }

  call(): void {
    const { app, room, user } = this.props

    if (user.room !== room) {
      throw 'Not in a room'
    }

    user.socket.leave(room.name)
    user.socket.join(LOBBY_ROOM_NAME)
    user.room = null

    this.removeFromRoom()

    if (room.game) {
      this.removeFromGame()
    } else {
      this.notifyMembers()
    }

    ScheduleRoomsEventToLobbyUsers.call({ app })
  }

  private removeFromGame(): void {
    const { room, user } = this.props
    const { game } = room
    const { player } = user

    if (!game || !player) {
      return
    }

    game.handlePlayerLeave({
      playerId: player.id,
      notifyAboutPlayerLeave: () => {
        this.notifyMembers()
      },
    })
  }

  private removeFromRoom(): void {
    if (this.isOwnerAndLastUserInRoom) {
      return this.removeAsOwnerWithoutOtherUsersInRoom()
    }

    if (this.isOwner) {
      return this.removeAsOwnerWithOtherUsersInRoom()
    }

    this.removeAsMember()
  }

  private removeAsOwnerWithoutOtherUsersInRoom(): void {
    removeSingleByIdOrThrow(this.props.app.rooms, this.props.room.id)
  }

  private removeAsOwnerWithOtherUsersInRoom(): void {
    const { room } = this.props

    // Make next user an owner
    room.owner = room.users[0]
    room.users.splice(0, 1)
  }

  private removeAsMember(): void {
    const {
      room,
      user: { id: userId },
    } = this.props

    removeSingleByPropertyOrThrow(room.users, 'id', userId)
  }

  private notifyMembers(): void {
    if (this.isOwnerAndLastUserInRoom) {
      return
    }

    const { app, room } = this.props

    if (this.isOwner) {
      app.io.in(room.name).emit('s2c_ownerLeft', {
        newOwner: decorateUser(room.owner),
        game: this.getGameStateForNotifyMemberLeftMessage(),
        newRoomState: decorateRoom(room),
      })

      return
    }

    app.io.in(room.name).emit('s2c_userLeft', {
      reason: 'selfAction',
      userId: this.props.user.id,
      game: this.getGameStateForNotifyMemberLeftMessage(),
      newRoomState: decorateRoom(room),
    })
  }

  private getGameStateForNotifyMemberLeftMessage() {
    return this.props.room.game?.generateSerializedState() ?? null
  }
}
