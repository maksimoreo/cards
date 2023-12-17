import { z } from 'zod'
import { BasicMessageHandler } from '../Router/MessageHandler'

const inputSchema = z.object({
  card: z.number().nonnegative(),
})

export default class PlayCardHandler extends BasicMessageHandler<void> {
  public async handle(): Promise<void> {
    const { currentUser, input } = this
    const { room } = currentUser

    if (!room) {
      return this.respondWithBadRequest('Not in a room')
    }

    const { game } = room

    if (!game) {
      return this.respondWithBadRequest('Game is not started')
    }

    const { player } = currentUser

    if (!player) {
      return this.respondWithBadRequest('Cannot play cards while spectating')
    }

    const validationResult = inputSchema.safeParse(input)
    if (!validationResult.success) {
      return this.respondWithValidationErrors(validationResult.error.errors)
    }

    const { card } = validationResult.data

    if (!player.isValidCard(card)) {
      return this.respondWithValidationErrors([{ code: 'custom', path: ['card'], message: 'Invalid card' }])
    }

    player.player.selectCard(card)

    room.allUsers
      .filter((user) => user.id !== currentUser.id)
      .forEach((user) => user.socket.emit('s2c_userPlayedCard', { userId: currentUser.id }))

    this.respondWithSuccess()

    game.handleCardPlayed()
  }
}
