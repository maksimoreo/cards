import { c } from '../../../src/lib/TakeSix/__test__/testHelpers'
import { sleep } from '../../../src/utils'
import { createRoom, joinRoom, playCard } from '../helpers/clientEventsHelpers'
import { expectClientsExpectedEventsQueuesClean } from '../helpers/testHelpers'
import { useApp, useClients } from '../helpers/testHooks'

describe('Game #1', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 2)

  jest.setTimeout(30000)

  test('Game #1', async () => {
    const [client1, client2] = getClients()

    const cardsPool = [13, 4, 17, 11, 20, 16, 9, 15, 21, 18, 5, 8, 22, 24, 12, 7, 2, 14, 19, 6, 10, 3, 23, 1]

    await createRoom(client1, { name: 'gameroom' }, { globalClients: [client2] })

    await expect(client1.emitEvent('startGame', null)).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Not enough players',
    })

    await joinRoom(client2, { name: 'gameroom' }, { roomClients: [client1] })

    await expect(client2.emitEvent('startGame', null)).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Not room owner',
    })

    {
      const client2Promise_s2c_gameStarted = client2.waitForEvent('s2c_gameStarted')

      await expect(
        client1.emitEvent('startGame', { cardsPool, stepTimeout: 5000, selectRowTimeout: 5000 }),
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

      await expect(client2Promise_s2c_gameStarted).resolves.toStrictEqual({
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
    await expect(client1.emitEvent('selectRow', { rowIndex: 4 })).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Not waiting for row input',
    })

    console.log('Step 1')

    // client1 plays a card
    await expect(playCard(client1, { cardValue: 4, otherClients: [client2] })).resolves.toBeUndefined()

    // client2 plays a card
    {
      const client1Promise_s2c_userPlayedCard = client1.waitForEvent('s2c_userPlayedCard')
      const client1GameStepPromise = client1.waitForEvent('s2c_gameStep')
      const client2GameStepPromise = client2.waitForEvent('s2c_gameStep')

      await expect(client2.emitEvent('playCard', { card: 2 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client2.id })

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

    console.log('Step 2')

    // client1 plays a card
    await expect(playCard(client1, { cardValue: 11, otherClients: [client2] })).resolves.toBeUndefined()

    // client2 plays a card
    {
      const client1Promise_s2c_userPlayedCard = client1.waitForEvent('s2c_userPlayedCard')
      const client1GameStepPromise = client1.waitForEvent('s2c_gameStep')
      const client2GameStepPromise = client2.waitForEvent('s2c_gameStep')

      await expect(client2.emitEvent('playCard', { card: 12 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client2.id })

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

    console.log('Step 3')

    // client2 plays a card
    await expect(playCard(client2, { cardValue: 5, otherClients: [client1] })).resolves.toBeUndefined()

    // client1 plays a card
    {
      const client1GameStepPromise = client1.waitForEvent('s2c_gameStep')
      const client2Promise_s2c_userPlayedCard = client2.waitForEvent('s2c_userPlayedCard')
      const client2GameStepPromise = client2.waitForEvent('s2c_gameStep')

      await expect(client1.emitEvent('playCard', { card: 9 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client2Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client1.id })

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

    console.log('Step 4')

    // client2 plays a card
    await expect(playCard(client2, { cardValue: 8, otherClients: [client1] })).resolves.toBeUndefined()

    // client2 changes played card
    await expect(playCard(client2, { cardValue: 14, otherClients: [client1] })).resolves.toBeUndefined()

    // client1 plays a card
    {
      const client1GameStepPromise = client1.waitForEvent('s2c_gameStep')
      const client2Promise_s2c_userPlayedCard = client2.waitForEvent('s2c_userPlayedCard')
      const client2GameStepPromise = client2.waitForEvent('s2c_gameStep')

      await expect(client1.emitEvent('playCard', { card: 15 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client2Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client1.id })

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

    console.log('Step 5')

    // client1 plays invalid card
    await expect(client1.emitEvent('playCard', { card: 6 })).resolves.toStrictEqual({
      code: 'BAD_REQUEST',
      message: 'Invalid data',
      validationErrors: [{ code: 'custom', message: 'Invalid card', path: ['card'] }],
    })

    // client1 plays valid card
    await expect(playCard(client1, { cardValue: 16, otherClients: [client2] })).toResolve()

    // client2 plays invalid card

    await expect(client2.emitEvent('playCard', { card: 99 })).resolves.toStrictEqual({
      code: 'BAD_REQUEST',
      message: 'Invalid data',
      validationErrors: [{ code: 'custom', message: 'Invalid card', path: ['card'] }],
    })

    // client2 plays valid card
    {
      const client1Promise_s2c_userPlayedCard = client1.waitForEvent('s2c_userPlayedCard')
      const client1GameStepPromise = client1.waitForEvent('s2c_gameStep')
      const client2GameStepPromise = client2.waitForEvent('s2c_gameStep')

      await expect(client2.emitEvent('playCard', { card: 24 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client2.id })

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

    console.log('Step 6')

    // client1 plays a card
    await expect(playCard(client1, { cardValue: 13, otherClients: [client2] })).toResolve()

    // client2 did not select a card in time
    // Note: Should select automatically the highest number if no input is provided from this client
    {
      const client1GameStepPromise = client1.waitForEvent('s2c_gameStep', { timeout: 6000 })
      const client2GameStepPromise = client2.waitForEvent('s2c_gameStep', { timeout: 6000 })

      await sleep(3000)

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

    console.log('Step 7')

    // client2 plays a card
    await expect(playCard(client2, { cardValue: 8, otherClients: [client1] })).toResolve()

    // client1 plays a card
    {
      const client1GameStepPromise = client1.waitForEvent('s2c_gameStep')
      const client2Promise_s2c_userPlayedCard = client2.waitForEvent('s2c_userPlayedCard')
      const client2GameStepPromise = client2.waitForEvent('s2c_gameStep')

      await expect(client1.emitEvent('playCard', { card: 21 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client2Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client1.id })

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

    console.log('Step 8.1')

    // client1 plays a card
    await expect(playCard(client1, { cardValue: 20, otherClients: [client2] })).toResolve()

    // client2 plays a card
    {
      const client1Promise_s2c_userPlayedCard = client1.waitForEvent('s2c_userPlayedCard')
      const client1GameStepPromise = client1.waitForEvent('s2c_gameStep')
      const client2GameStepPromise = client2.waitForEvent('s2c_gameStep')

      await expect(client2.emitEvent('playCard', { card: 7 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client2.id })

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

    console.log('Step 8.2')

    // client1 selects row
    await expect(client1.emitEvent('selectRow', { rowIndex: 1 })).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Not waiting for row input',
    })

    // client2 selects invalid row
    await expect(client2.emitEvent('selectRow', { rowIndex: 4 })).resolves.toStrictEqual({
      code: 'BAD_REQUEST',
      message: 'Invalid data',
      validationErrors: [{ code: 'custom', message: 'Invalid row', path: ['rowIndex'] }],
    })

    // client2 selects valid row
    {
      const client1GameStepPromise = client1.waitForEvent('s2c_gameStep')
      const client2GameStepPromise = client2.waitForEvent('s2c_gameStep')

      await expect(client2.emitEvent('selectRow', { rowIndex: 1 })).resolves.toStrictEqual({ code: 'SUCCESS' })

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

    console.log('Step 9')

    await expect(playCard(client1, { cardValue: 18, otherClients: [client2] })).toResolve()

    // client2 plays a card
    {
      const client1Promise_s2c_userPlayedCard = client1.waitForEvent('s2c_userPlayedCard')
      const client1GameStepPromise = client1.waitForEvent('s2c_gameStep')
      const client2GameStepPromise = client2.waitForEvent('s2c_gameStep')

      await expect(client2.emitEvent('playCard', { card: 19 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client2.id })

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

    console.log('Step 10')

    await expect(playCard(client1, { cardValue: 17, otherClients: [client2] })).toResolve()

    // client2 plays a card
    {
      const client1Promise_s2c_userPlayedCard = client1.waitForEvent('s2c_userPlayedCard')
      const client1GameStepPromise = client1.waitForEvent('s2c_gameStep')
      const client2GameStepPromise = client2.waitForEvent('s2c_gameStep')

      await expect(client2.emitEvent('playCard', { card: 6 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client2.id })

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

    console.log('Step 10.1')

    // client2 selects row
    {
      const client1GameStepPromise = client1.waitForEvent('s2c_gameStep', { timeout: 6000 })
      const client1Promise_s2c_gameStopped = client1.waitForEvent('s2c_gameStopped', { timeout: 6000 })
      const client2GameStepPromise = client2.waitForEvent('s2c_gameStep', { timeout: 6000 })
      const client2Promise_s2c_gameStopped = client2.waitForEvent('s2c_gameStopped', { timeout: 6000 })

      // client2 does not select row in time, game automatically selects first row

      // await expect(client2.emitEvent('selectRow', { rowIndex: 2 })).resolves.toStrictEqual({ success: true })

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

      await expect(client1Promise_s2c_gameStopped).resolves.toStrictEqual({
        reason: 'Completed',
      })

      await expect(client2Promise_s2c_gameStopped).resolves.toStrictEqual({
        reason: 'Completed',
      })
    }

    // Game. Ends. Now. (ensure room cleanup is correct)
    await expect(client1.emitEvent('selectRow', { rowIndex: 4 })).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Game is not started',
    })

    await expect(client2.emitEvent('playCard', { card: 99 })).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Game is not started',
    })

    await sleep(1000) // Ensure no unexpected events
    expectClientsExpectedEventsQueuesClean(getClients())
  })
})
