import { VoidMessageHandler, VoidMessageHandlerReturnValue } from '../Router/MessageHandler'

export default class StopGameHandler extends VoidMessageHandler {
  public async handle(): Promise<VoidMessageHandlerReturnValue> {
    const { currentUser } = this
    const { room } = currentUser

    if (!room) {
      return { badRequest: 'Not in a room' }
    }

    if (room.owner.id != currentUser.id) {
      return { badRequest: 'Not room owner' }
    }

    const { game } = room

    if (!game) {
      return { badRequest: 'Game is not running' }
    }

    game.stopGame({ reason: 'roomOwnerAction' })
  }
}
