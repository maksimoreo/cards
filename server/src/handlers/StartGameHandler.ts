import { z } from 'zod'

import { MessageHandlerReturnValue, ResponseReturningMessageHandler } from '../Router/MessageHandler'
import RoomGameTakeSix from '../lib/RoomGameTakeSix/Game'
import Card from '../lib/TakeSix/Card'
import TakeSix, { SerializedState } from '../lib/TakeSix/TakeSix'

const inputSchema = z
  .object({
    cardsPool: z
      .number()
      .array()
      .nonempty()
      .optional()
      .refine((value) => !value || new Set(value).size === value.length, { message: 'Must contain unique values' }),
    stepTimeout: z
      .number()
      .min(1000)
      .max(120 * 1000)
      .optional(),
    selectRowTimeout: z
      .number()
      .min(1000)
      .max(120 * 1000)
      .optional(),
  })
  .nullable()
  .optional()

export interface StartGameHandlerDataT {
  gameState: SerializedState
  playerCards?: Card[]
}

export default class StartGameHandler extends ResponseReturningMessageHandler<StartGameHandlerDataT> {
  public async handle(): Promise<MessageHandlerReturnValue<StartGameHandlerDataT>> {
    const { currentUser } = this
    const { room } = currentUser

    const validationResult = inputSchema.safeParse(this.input)
    if (!validationResult.success) {
      return { validationErrors: validationResult.error.errors }
    }

    if (!room) {
      return { badRequest: 'Not in a room' }
    }

    if (room.owner.id != currentUser.id) {
      return { badRequest: 'Not room owner' }
    }

    if (room.users.length == 0) {
      return { badRequest: 'Not enough players' }
    }

    if (room.game) {
      return { badRequest: 'Game is already running' }
    }

    const input = validationResult.data

    const minimumCardsPoolLength = TakeSix.minimumCardsPoolLength(room.allUsers.length)
    if (input && input.cardsPool) {
      if (input.cardsPool.length < minimumCardsPoolLength) {
        return {
          validationErrors: [
            {
              code: 'too_small',
              path: ['cardsPool'],
              message: 'Not enough cards in cardsPool',
              minimum: minimumCardsPoolLength,
              inclusive: true,
              type: 'array',
            },
          ],
        }
      }
    }

    const playerIds = room.allUsers.map((user) => user.id)
    const takeSix = TakeSix.createFromCardPool({
      playerIds,
      shuffle: process.env.NODE_ENV !== 'test',
      ...(room.gameOptions.mode === 'expert'
        ? { defaultCardPoolValues: Array.from(Array(minimumCardsPoolLength), (_value, index) => index + 1) }
        : input && input.cardsPool
        ? { defaultCardPoolValues: input.cardsPool }
        : { defaultCardPool: true }),
    })

    const game = new RoomGameTakeSix({
      room,
      game: takeSix,
      stepTimeout: input?.stepTimeout,
      selectRowTimeout: input?.selectRowTimeout,
    })

    room.game = game

    room.users.forEach((user) => {
      user.socket.emit('notifyGameStarted', {
        gameState: game.generateSerializedState(),
        ...(user.player && { playerCards: user.player.cards }),
      })
    })

    game.startGame()

    return {
      data: {
        gameState: game.generateSerializedState(),
        ...(currentUser.player && { playerCards: currentUser.player.cards }),
      },
    }
  }
}
