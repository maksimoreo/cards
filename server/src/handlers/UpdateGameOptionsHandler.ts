import { z } from 'zod'
import { VoidMessageHandler, VoidMessageHandlerReturnValue } from '../Router/MessageHandler'

const inputSchema = z.object({
  type: z.literal('takeSix'),
  mode: z.union([z.literal('normal'), z.literal('expert')]).optional(),
  stepTimeout: z.number().optional(),
  stepTimeoutDoneStrategy: z
    .union([z.literal('forcePlay'), z.literal('moveToSpectators'), z.literal('kick')])
    .optional(),
})

export default class UpdateGameOptionsHandler extends VoidMessageHandler {
  public async handle(): Promise<VoidMessageHandlerReturnValue> {
    const { currentUser } = this
    const { room } = currentUser

    if (!room) {
      return { badRequest: 'Not in a room' }
    }

    if (room.owner.id != currentUser.id) {
      return { badRequest: 'Not room owner' }
    }

    if (room.game) {
      return { badRequest: 'Cannot change game options while game is in progress' }
    }

    const { input } = this

    const validationResult = inputSchema.safeParse(input)
    if (!validationResult.success) {
      return { validationErrors: validationResult.error.errors }
    }

    if (validationResult.data.mode) {
      room.gameOptions.mode = validationResult.data.mode
    }

    if (validationResult.data.stepTimeout) {
      room.gameOptions.stepTimeout = validationResult.data.stepTimeout
    }

    if (validationResult.data.stepTimeoutDoneStrategy) {
      room.gameOptions.stepTimeoutDoneStrategy = validationResult.data.stepTimeoutDoneStrategy
    }

    // Notify all room members except owner.
    // TODO: Debounce to 1 emit/sec
    room.users.forEach((user) => {
      user.socket.emit('gameOptionsUpdated', {
        gameOptions: room.gameOptions,
      })
    })
  }
}
