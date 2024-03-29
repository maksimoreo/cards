import { z } from 'zod'
import { VoidEventHandler, VoidEventHandlerReturnValue } from '../Router/EventHandler'

const inputSchema = z.object({
  rowIndex: z.number().nonnegative(),
})

export default class SelectRowHandler extends VoidEventHandler {
  public async handle(): Promise<VoidEventHandlerReturnValue> {
    const { currentUser, input } = this
    const { room } = currentUser

    if (!room) {
      return { badRequest: 'Not in a room' }
    }

    const { game } = room
    const { player } = currentUser

    if (!game || !player) {
      return { badRequest: 'Game is not started' }
    }

    if (!player.isWaitingThisPlayerToSelectRow()) {
      return { badRequest: 'Not waiting for row input' }
    }

    const validationResult = inputSchema.safeParse(input)
    if (!validationResult.success) {
      return { validationErrors: validationResult.error.errors }
    }

    const { rowIndex } = validationResult.data

    if (!game.isValidRow(rowIndex)) {
      return { validationErrors: [{ code: 'custom', path: ['rowIndex'], message: 'Invalid row' }] }
    }

    player.selectRow(rowIndex)
    game.handleRowSelected()
  }
}
