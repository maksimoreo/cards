import { z } from 'zod'

import { decorateUser } from '../decorators/UserDecorator'
import { VoidMessageHandler, VoidMessageHandlerReturnValue } from '../Router/MessageHandler'

const MAX_MESSAGE_LENGTH = 1000

const inputSchema = z.object({
  message: z.string().max(MAX_MESSAGE_LENGTH),
})

export default class SendMessageHandler extends VoidMessageHandler {
  public async handle(): Promise<VoidMessageHandlerReturnValue> {
    const { socket, currentUser } = this
    const { room } = currentUser

    if (!room) {
      return { badRequest: 'Not in a room' }
    }

    const validationResult = inputSchema.safeParse(this.input)
    if (!validationResult.success) {
      return { validationErrors: validationResult.error.errors }
    }

    const input = validationResult.data

    const { message } = input

    // Notify all users about the message
    socket.in(room.name).emit('s2c_userMessage', {
      message,
      user: decorateUser(currentUser),
    })
  }
}
