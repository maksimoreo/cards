import { z } from 'zod'
import { MessageHandlerReturnValue, ResponseReturningMessageHandler } from '../Router/MessageHandler'
import { LOBBY_ROOM_NAME } from '../constants'
import { DecoratedRoom, decorateRoom } from '../decorators/RoomDecorator'
import { decorateUser } from '../decorators/UserDecorator'
import { SerializedState, SerializedStep } from '../lib/TakeSix/TakeSix'
import ScheduleRoomsEventToLobbyUsers from '../services/ScheduleRoomsEventToLobbyUsers'

const inputSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  password: z.string().optional(),
})

interface IJoinRoomResponse {
  room: DecoratedRoom
  game?: {
    state: SerializedState
    playersWithSelectedCard: string[]
    lastStep?: SerializedStep
  }
}

export default class JoinRoomHandler extends ResponseReturningMessageHandler<IJoinRoomResponse> {
  public async handle(): Promise<MessageHandlerReturnValue<IJoinRoomResponse>> {
    const { currentUser, socket, app } = this

    if (currentUser.room) {
      return { badRequest: 'Cannot join room while in another room' }
    }

    const validationResult = inputSchema.safeParse(this.input)
    if (!validationResult.success) {
      return { validationErrors: validationResult.error.errors }
    }

    const input = validationResult.data

    const { id, name } = input

    const room = app.rooms.find((room) => room.id === id || room.name === name)

    if (!room) {
      return { badRequest: 'Cannot find room by specified parameters' }
    }

    if (room.allUsers.length >= 8) {
      return { badRequest: 'Room is full' }
    }

    if (room.isProtectedByPassword()) {
      const { password } = input

      if (!password) {
        return { badRequest: 'This room is protected by password' }
      }

      if (room.password !== password) {
        return { badRequest: 'Incorrect password' }
      }
    }

    currentUser.room = room
    room.users.push(currentUser)
    socket.leave(LOBBY_ROOM_NAME)
    socket.join(room.name)

    room.allUsers.forEach((user) => {
      if (user !== currentUser) {
        user.socket.emit('notifyUserJoined', {
          user: decorateUser(currentUser),
          newRoomState: decorateRoom(room),
        })
      }
    })

    ScheduleRoomsEventToLobbyUsers.call({ app })

    return {
      data: {
        room: decorateRoom(room),
        ...(room.game && { game: room.game.getDataForJoinedUser() }),
      },
    }
  }
}
