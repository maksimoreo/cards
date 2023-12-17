import { z } from 'zod'

import { MessageHandlerReturnValue, ResponseReturningMessageHandler } from '../Router/MessageHandler'
import { LOBBY_ROOM_NAME } from '../constants'
import { DecoratedRoom, decorateRoom } from '../decorators/RoomDecorator'
import Room from '../models/Room'
import ScheduleRoomsEventToLobbyUsers from '../services/ScheduleRoomsEventToLobbyUsers'

const MIN_USERNAME_LENGTH = 1
const MAX_USERNAME_LENGTH = 20

const inputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(MIN_USERNAME_LENGTH, `Name must contain at least ${MIN_USERNAME_LENGTH} characters`)
    .max(MAX_USERNAME_LENGTH, `Name must contain at most ${MAX_USERNAME_LENGTH} characters`)
    .regex(/^[a-zA-Z0-9\s]+$/, 'Name must contain only a-z, A-Z or 0-9 characters'),
  password: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[a-zA-Z0-9_-]*$/, 'Can only contain letters and digits')
    .optional(),
})

type OutputT = {
  readonly room: DecoratedRoom
}

export default class CreateRoomHandler extends ResponseReturningMessageHandler<OutputT> {
  public async handle(): Promise<MessageHandlerReturnValue<OutputT>> {
    const { app, socket, currentUser } = this

    if (currentUser.room) {
      return { badRequest: 'Cannot create room while in another room' }
    }

    const validationResult = inputSchema.safeParse(this.input)
    if (!validationResult.success) {
      return { validationErrors: validationResult.error.errors }
    }

    const input = validationResult.data

    const { name, password } = input

    if (app.rooms.find((room) => room.name === name)) {
      return { validationErrors: [{ code: 'custom', path: ['name'], message: 'This name is currently unavailable' }] }
    }

    const room = new Room({ app, name, owner: currentUser, password })

    app.rooms.push(room)

    socket.join(name)
    socket.leave(LOBBY_ROOM_NAME)

    currentUser.room = room

    ScheduleRoomsEventToLobbyUsers.call({ app })

    return { data: { room: decorateRoom(room) } }
  }
}
