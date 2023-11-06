import { c } from '../../../src/lib/TakeSix/__test__/testHelpers'
import { createRoom, joinRoom, playCard } from '../helpers/clientEventsHelpers'
import { emitEvent, waitForEvent, waitForNoEvents } from '../helpers/testHelpers'
import { useApp, useClients } from '../helpers/testHooks'

describe('Game #1', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 2)

  jest.setTimeout(30000)

  test('Game #1', async () => {
    const [client1, client2] = getClients()

    const cardsPool = [13, 4, 17, 11, 20, 16, 9, 15, 21, 18, 5, 8, 22, 24, 12, 7, 2, 14, 19, 6, 10, 3, 23, 1]

    await createRoom(client1, 'game_room')

    await expect(emitEvent(client1, 'startGame', null)).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Not enough players',
    })

    await joinRoom(client2, { name: 'game_room', otherClients: [client1] })

    await expect(emitEvent(client2, 'startGame', null)).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Not room owner',
    })

    {
      const client2Waiter = waitForEvent(client2, 'notifyGameStarted')

      await expect(
        emitEvent(client1, 'startGame', { cardsPool, stepTimeout: 5000, selectRowTimeout: 5000 }),
      ).resolves.toStrictEqual({
        code: 'SUCCESS',
        data: {
          gameState: {
            players: [
              {
                id: client1.id,
                hasSelectedCard: false,
                penaltyPoints: 0,
                isActive: true,
                user: { id: client1.id, color: 'D1D5DB', name: client1.id },
              },
              {
                id: client2.id,
                hasSelectedCard: false,
                penaltyPoints: 0,
                isActive: true,
                user: { id: client2.id, color: 'D1D5DB', name: client2.id },
              },
            ],
            rows: [
              c([10]), //
              c([3]),
              c([23]),
              c([1]),
            ],
            stepsLeft: 10,
          },
          playerCards: c([4, 9, 11, 13, 15, 16, 17, 18, 20, 21]),
        },
      })

      await expect(client2Waiter).resolves.toStrictEqual({
        gameState: {
          players: [
            {
              id: client1.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
          ],
          rows: [
            c([10]), //
            c([3]),
            c([23]),
            c([1]),
          ],
          stepsLeft: 10,
        },
        playerCards: c([2, 5, 6, 7, 8, 12, 14, 19, 22, 24]),
      })
    }

    // Random tests
    await expect(emitEvent(client1, 'selectRow', { rowIndex: 4 })).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Not waiting for row input',
    })

    // STEP 1
    // client1 plays a card
    const client1Waiter = waitForNoEvents(client1, 'notifyUserPlayedCard')

    await expect(playCard(client1, { cardValue: 4, otherClients: [client2] }))

    await expect(client1Waiter).resolves.toBeUndefined()

    // client2 plays a card
    {
      const client1GameStepPromise = waitForEvent(client1, 'notifyGameStep')
      const client2GameStepPromise = waitForEvent(client2, 'notifyGameStep')

      const client2Waiter = waitForNoEvents(client2, 'notifyUserPlayedCard')

      await expect(playCard(client2, { cardValue: 2, otherClients: [client1] }))

      await expect(client2Waiter).resolves.toBeUndefined()

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(4) },
            { playerId: client2.id, card: c(2) },
          ],
          moves: [
            { playerId: client2.id, card: c(2), rowIndex: 3, takesRow: false },
            { playerId: client1.id, card: c(4), rowIndex: 1, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([10]), //
            c([3, 4]),
            c([23]),
            c([1, 2]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
          ],
          stepsLeft: 9,
        },
      }

      await expect(client1GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([9, 11, 13, 15, 16, 17, 18, 20, 21]),
      })

      await expect(client2GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([5, 6, 7, 8, 12, 14, 19, 22, 24]),
      })
    }

    // STEP 2
    // client1 plays a card
    {
      const client1Promise = waitForNoEvents(client1, 'notifyUserPlayedCard')

      await expect(playCard(client1, { cardValue: 11, otherClients: [client2] }))

      await expect(client1Promise).resolves.not.toThrow()
    }

    // client2 plays a card
    {
      const client1GameStepPromise = waitForEvent(client1, 'notifyGameStep')
      const client2GameStepPromise = waitForEvent(client2, 'notifyGameStep')

      const client2Waiter = waitForNoEvents(client2, 'notifyUserPlayedCard')

      await expect(playCard(client2, { cardValue: 12, otherClients: [client1] }))

      await expect(client2Waiter).resolves.not.toThrow()

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(11) },
            { playerId: client2.id, card: c(12) },
          ],

          moves: [
            { playerId: client1.id, card: c(11), rowIndex: 0, takesRow: false },
            { playerId: client2.id, card: c(12), rowIndex: 0, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([10, 11, 12]), //
            c([3, 4]),
            c([23]),
            c([1, 2]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
          ],
          stepsLeft: 8,
        },
      }

      await expect(client1GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([9, 13, 15, 16, 17, 18, 20, 21]),
      })

      await expect(client2GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([5, 6, 7, 8, 14, 19, 22, 24]),
      })
    }

    // STEP 3
    // client2 plays a card
    await expect(playCard(client2, { cardValue: 5, otherClients: [client1] }))

    // client1 plays a card
    {
      const client1GameStepPromise = waitForEvent(client1, 'notifyGameStep')
      const client2GameStepPromise = waitForEvent(client2, 'notifyGameStep')

      await expect(playCard(client1, { cardValue: 9, otherClients: [client2] }))

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(9) },
            { playerId: client2.id, card: c(5) },
          ],

          moves: [
            { playerId: client2.id, card: c(5), rowIndex: 1, takesRow: false },
            { playerId: client1.id, card: c(9), rowIndex: 1, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([10, 11, 12]), //
            c([3, 4, 5, 9]),
            c([23]),
            c([1, 2]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
          ],
          stepsLeft: 7,
        },
      }

      await expect(client1GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([13, 15, 16, 17, 18, 20, 21]),
      })

      await expect(client2GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([6, 7, 8, 14, 19, 22, 24]),
      })
    }

    // STEP 4
    // client2 plays a card
    await expect(playCard(client2, { cardValue: 8, otherClients: [client1] }))

    // client2 changes played card
    await expect(playCard(client2, { cardValue: 14, otherClients: [client1] }))

    // client1 plays a card
    {
      const client1GameStepPromise = waitForEvent(client1, 'notifyGameStep')
      const client2GameStepPromise = waitForEvent(client2, 'notifyGameStep')

      await expect(playCard(client1, { cardValue: 15, otherClients: [client2] }))

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(15) },
            { playerId: client2.id, card: c(14) },
          ],
          moves: [
            { playerId: client2.id, card: c(14), rowIndex: 0, takesRow: false },
            { playerId: client1.id, card: c(15), rowIndex: 0, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([10, 11, 12, 14, 15]), //
            c([3, 4, 5, 9]),
            c([23]),
            c([1, 2]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
          ],
          stepsLeft: 6,
        },
      }

      await expect(client1GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([13, 16, 17, 18, 20, 21]),
      })

      await expect(client2GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([6, 7, 8, 19, 22, 24]),
      })
    }

    // STEP 5
    // client1 plays invalid card
    {
      const client1Promise = waitForNoEvents(client1, 'notifyUserPlayedCard')
      const client2Promise = waitForNoEvents(client2, 'notifyUserPlayedCard')

      await expect(emitEvent(client1, 'playCard', { card: 6 })).resolves.toStrictEqual({
        code: 'BAD_REQUEST',
        message: 'Invalid data',
        validationErrors: [{ code: 'custom', message: 'Invalid card', path: ['card'] }],
      })

      await expect(client1Promise).resolves.toBeUndefined()
      await expect(client2Promise).resolves.toBeUndefined()
    }

    // client1 plays valid card
    await expect(playCard(client1, { cardValue: 16, otherClients: [client2] })).toResolve()

    // client2 plays invalid card
    {
      const client1Promise = waitForNoEvents(client1, 'notifyUserPlayedCard')
      const client2Promise = waitForNoEvents(client2, 'notifyUserPlayedCard')

      await expect(emitEvent(client2, 'playCard', { card: 99 })).resolves.toStrictEqual({
        code: 'BAD_REQUEST',
        message: 'Invalid data',
        validationErrors: [{ code: 'custom', message: 'Invalid card', path: ['card'] }],
      })

      await expect(client1Promise).resolves.toBeUndefined()
      await expect(client2Promise).resolves.toBeUndefined()
    }

    // client2 plays valid card
    {
      const client1GameStepPromise = waitForEvent(client1, 'notifyGameStep')
      const client2GameStepPromise = waitForEvent(client2, 'notifyGameStep')

      const client1Promise = waitForEvent(client1, 'notifyUserPlayedCard')
      const client2Promise = waitForNoEvents(client2, 'notifyUserPlayedCard')

      await expect(playCard(client2, { cardValue: 24, otherClients: [client1] })).toResolve()

      await expect(client1Promise).resolves.toStrictEqual({ userId: client2.id })
      await expect(client2Promise).resolves.toBeUndefined()

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(16) },
            { playerId: client2.id, card: c(24) },
          ],
          moves: [
            { playerId: client1.id, card: c(16), rowIndex: 0, takesRow: true },
            { playerId: client2.id, card: c(24), rowIndex: 2, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([16]),
            c([3, 4, 5, 9]), //
            c([23, 24]),
            c([1, 2]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: false,
              penaltyPoints: 12,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
          ],
          stepsLeft: 5,
        },
      }

      await expect(client1GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([13, 17, 18, 20, 21]),
      })

      await expect(client2GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([6, 7, 8, 19, 22]),
      })
    }

    // STEP 6
    // client1 plays a card
    await expect(playCard(client1, { cardValue: 13, otherClients: [client2] })).toResolve()

    // client2 did not select a card in time
    // Note: Should select automatically the highest number if no input is provided from this client
    {
      const client1GameStepPromise = waitForEvent(client1, 'notifyGameStep', 6000)
      const client2GameStepPromise = waitForEvent(client2, 'notifyGameStep', 6000)

      const client1Promise = waitForNoEvents(client1, 'notifyUserPlayedCard', 3000)
      const client2Promise = waitForNoEvents(client2, 'notifyUserPlayedCard', 3000)

      await expect(client1Promise).resolves.toBeUndefined()
      await expect(client2Promise).resolves.toBeUndefined()

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(13) },
            { playerId: client2.id, card: c(22) },
          ],
          moves: [
            { playerId: client1.id, card: c(13), rowIndex: 1, takesRow: false },
            { playerId: client2.id, card: c(22), rowIndex: 0, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([16, 22]), //
            c([3, 4, 5, 9, 13]),
            c([23, 24]),
            c([1, 2]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: false,
              penaltyPoints: 12,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
          ],
          stepsLeft: 4,
        },
      }

      await expect(client1GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([17, 18, 20, 21]),
      })

      await expect(client2GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([6, 7, 8, 19]),
      })
    }

    // STEP 7
    // client2 plays a card
    await expect(playCard(client2, { cardValue: 8, otherClients: [client1] })).toResolve()

    // client1 plays a card
    {
      const client1GameStepPromise = waitForEvent(client1, 'notifyGameStep')
      const client2GameStepPromise = waitForEvent(client2, 'notifyGameStep')

      await expect(playCard(client1, { cardValue: 21, otherClients: [client2] })).toResolve()

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(21) },
            { playerId: client2.id, card: c(8) },
          ],
          moves: [
            { playerId: client2.id, card: c(8), rowIndex: 3, takesRow: false },
            { playerId: client1.id, card: c(21), rowIndex: 1, takesRow: true },
          ],
        },
        gameState: {
          rows: [
            c([16, 22]), //
            c([21]),
            c([23, 24]),
            c([1, 2, 8]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: false,
              penaltyPoints: 18,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
          ],
          stepsLeft: 3,
        },
      }

      await expect(client1GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([17, 18, 20]),
      })

      await expect(client2GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([6, 7, 19]),
      })
    }

    // STEP 8
    // client1 plays a card
    await expect(playCard(client1, { cardValue: 20, otherClients: [client2] })).toResolve()

    // client2 plays a card
    {
      const client1GameStepPromise = waitForEvent(client1, 'notifyGameStep')
      const client2GameStepPromise = waitForEvent(client2, 'notifyGameStep')

      await expect(playCard(client2, { cardValue: 7, otherClients: [client1] })).toResolve()

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(20) },
            { playerId: client2.id, card: c(7) },
          ],
          waitingPlayer: client2.id,
        },
        gameState: {
          rows: [
            c([16, 22]), //
            c([21]),
            c([23, 24]),
            c([1, 2, 8]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: true,
              penaltyPoints: 18,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: true,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
          ],
          stepsLeft: 3,
        },
      }

      await expect(client1GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([17, 18, 20]),
      })

      await expect(client2GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([6, 7, 19]),
      })
    }

    // Step 8.1
    // client1 selects row
    {
      const client1GameStepPromise = waitForNoEvents(client1, 'notifyGameStep')
      const client2GameStepPromise = waitForNoEvents(client2, 'notifyGameStep')

      await expect(emitEvent(client1, 'selectRow', { rowIndex: 1 })).resolves.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Not waiting for row input',
      })

      await expect(client1GameStepPromise).resolves.toBeUndefined()
      await expect(client2GameStepPromise).resolves.toBeUndefined()
    }

    // client2 selects invalid row
    {
      const client1GameStepPromise = waitForNoEvents(client1, 'notifyGameStep')
      const client2GameStepPromise = waitForNoEvents(client2, 'notifyGameStep')

      await expect(emitEvent(client2, 'selectRow', { rowIndex: 4 })).resolves.toStrictEqual({
        code: 'BAD_REQUEST',
        message: 'Invalid data',
        validationErrors: [{ code: 'custom', message: 'Invalid row', path: ['rowIndex'] }],
      })

      await expect(client1GameStepPromise).resolves.toBeUndefined()
      await expect(client2GameStepPromise).resolves.toBeUndefined()
    }

    // client2 selects valid row
    {
      const client1GameStepPromise = waitForEvent(client1, 'notifyGameStep')
      const client2GameStepPromise = waitForEvent(client2, 'notifyGameStep')

      await expect(emitEvent(client2, 'selectRow', { rowIndex: 1 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(20) },
            { playerId: client2.id, card: c(7) },
          ],
          moves: [
            { playerId: client2.id, card: c(7), rowIndex: 1, takesRow: true },
            { playerId: client1.id, card: c(20), rowIndex: 3, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([16, 22]), //
            c([7]),
            c([23, 24]),
            c([1, 2, 8, 20]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: false,
              penaltyPoints: 18,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: false,
              penaltyPoints: 1,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
          ],
          stepsLeft: 2,
        },
      }

      await expect(client1GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([17, 18]),
      })

      await expect(client2GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([6, 19]),
      })
    }

    // Step 9
    await expect(playCard(client1, { cardValue: 18, otherClients: [client2] })).toResolve()

    // client2 plays a card
    {
      const client1GameStepPromise = waitForEvent(client1, 'notifyGameStep')
      const client2GameStepPromise = waitForEvent(client2, 'notifyGameStep')

      await expect(playCard(client2, { cardValue: 19, otherClients: [client1] })).toResolve()

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(18) },
            { playerId: client2.id, card: c(19) },
          ],
          moves: [
            { playerId: client1.id, card: c(18), rowIndex: 1, takesRow: false },
            { playerId: client2.id, card: c(19), rowIndex: 1, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([16, 22]), //
            c([7, 18, 19]),
            c([23, 24]),
            c([1, 2, 8, 20]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: false,
              penaltyPoints: 18,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: false,
              penaltyPoints: 1,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
          ],
          stepsLeft: 1,
        },
      }

      await expect(client1GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([17]),
      })

      await expect(client2GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([6]),
      })
    }

    // Step 10
    await expect(playCard(client1, { cardValue: 17, otherClients: [client2] })).toResolve()

    // client2 plays a card
    {
      const client1GameStepPromise = waitForEvent(client1, 'notifyGameStep')
      const client2GameStepPromise = waitForEvent(client2, 'notifyGameStep')

      await expect(playCard(client2, { cardValue: 6, otherClients: [client1] })).toResolve()

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(17) },
            { playerId: client2.id, card: c(6) },
          ],
          waitingPlayer: client2.id,
        },
        gameState: {
          rows: [
            c([16, 22]), //
            c([7, 18, 19]),
            c([23, 24]),
            c([1, 2, 8, 20]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: true,
              penaltyPoints: 18,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: true,
              penaltyPoints: 1,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
          ],
          stepsLeft: 1,
        },
      }

      await expect(client1GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([17]),
      })

      await expect(client2GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([6]),
      })
    }

    // Step 10.1
    // client2 selects row
    {
      const client1GameStepPromise = waitForEvent(client1, 'notifyGameStep', 6000)
      const client2GameStepPromise = waitForEvent(client2, 'notifyGameStep', 6000)

      // client2 does not select row in time, game automatically selects first row

      // await expect(emitEvent(client2, 'selectRow', { rowIndex: 2 })).resolves.toStrictEqual({ success: true })

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(17) },
            { playerId: client2.id, card: c(6) },
          ],
          moves: [
            { playerId: client2.id, card: c(6), rowIndex: 0, takesRow: true },
            { playerId: client1.id, card: c(17), rowIndex: 0, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([6, 17]), //
            c([7, 18, 19]),
            c([23, 24]),
            c([1, 2, 8, 20]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: false,
              penaltyPoints: 18,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: false,
              penaltyPoints: 7,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
          ],
          stepsLeft: 0,
        },
      }

      await expect(client1GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: [],
      })

      await expect(client2GameStepPromise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: [],
      })
    }

    // Game. Ends. Now. (ensure room cleanup is correct)
    await expect(emitEvent(client1, 'selectRow', { rowIndex: 4 })).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Game is not started',
    })

    await expect(emitEvent(client2, 'playCard', { card: 99 })).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Game is not started',
    })
  })
})
