import { c } from '../../../src/lib/TakeSix/__test__/testHelpers'
import { sleep } from '../../../src/utils'
import { createRoom, joinRoom, playCard } from '../helpers/clientEventsHelpers'
import { expectClientsExpectedEventsQueuesClean } from '../helpers/testHelpers'
import { useApp, useClients } from '../helpers/testHooks'

describe('Player Inactivity Strategy: Kick', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 3)

  jest.setTimeout(30000)

  test('Kick after step timeout and select row timeout', async () => {
    const [client1, client2, client3] = getClients()

    await expect(createRoom(client2, { name: 'HELLO' }, { globalClients: [client1, client3] })).resolves.toBeUndefined()

    const roomId = getApp().rooms[0].id

    await expect(
      joinRoom(client1, { name: 'HELLO' }, { roomClients: [client2], globalClients: [client3] }),
    ).resolves.toBeUndefined()
    await expect(
      joinRoom(client3, { name: 'HELLO' }, { roomClients: [client1, client2], globalClients: [] }),
    ).resolves.toBeUndefined()

    console.log('client2 changes game options')

    {
      const client1Promise_gameOptionsUpdated = client1.waitForEvent('gameOptionsUpdated')
      const client3Promise_gameOptionsUpdated = client3.waitForEvent('gameOptionsUpdated')

      await expect(
        client2.emitEvent('updateGameOptions', {
          type: 'takeSix',
          stepTimeout: 5000,
          playerInactivityStrategy: 'kick',
        }),
      ).resolves.toStrictEqual({ code: 'SUCCESS' })

      const expectedEventData = {
        gameOptions: {
          type: 'takeSix',
          mode: 'normal',
          stepTimeout: 5000,
          playerInactivityStrategy: 'kick',
        },
      }

      await expect(client1Promise_gameOptionsUpdated).resolves.toStrictEqual(expectedEventData)
      await expect(client3Promise_gameOptionsUpdated).resolves.toStrictEqual(expectedEventData)
    }

    console.log('Starting the game')

    {
      const client1Promise_notifyGameStarted = client1.waitForEvent('notifyGameStarted')
      const client3Promise_notifyGameStarted = client3.waitForEvent('notifyGameStarted')

      const gameState = {
        players: [
          {
            id: client2.id,
            hasSelectedCard: false,
            penaltyPoints: 0,
            isActive: true,
            user: { id: client2.id, color: 'D1D5DB', name: client2.id },
          },
          {
            id: client1.id,
            hasSelectedCard: false,
            penaltyPoints: 0,
            isActive: true,
            user: { id: client1.id, color: 'D1D5DB', name: client1.id },
          },
          {
            id: client3.id,
            hasSelectedCard: false,
            penaltyPoints: 0,
            isActive: true,
            user: { id: client3.id, color: 'D1D5DB', name: client3.id },
          },
        ],
        rows: [
          c([7]), //
          c([13]),
          c([23]),
          c([20]),
        ],
        stepsLeft: 10,
      }

      //  28,  21,  19,  24,   3,  10,  31,  32,   1,  15
      //  18,  12,   6,  17,   5,   8,   2,  30,   9,  27
      //  22,  34,  33,  29,  14,  26,   4,  25,  11,  16
      //   7,  13,  23,  20
      const cardsPool = [
        28, 21, 19, 24, 3, 10, 31, 32, 1, 15, 18, 12, 6, 17, 5, 8, 2, 30, 9, 27, 22, 34, 33, 29, 14, 26, 4, 25, 11, 16,
        7, 13, 23, 20,
      ]

      await expect(client2.emitEvent('startGame', { cardsPool })).resolves.toStrictEqual({
        code: 'SUCCESS',
        data: {
          gameState,
          playerCards: c([1, 3, 10, 15, 19, 21, 24, 28, 31, 32]),
        },
      })

      await expect(client1Promise_notifyGameStarted).resolves.toStrictEqual({
        gameState,
        playerCards: c([2, 5, 6, 8, 9, 12, 17, 18, 27, 30]),
      })

      await expect(client3Promise_notifyGameStarted).resolves.toStrictEqual({
        gameState,
        playerCards: c([4, 11, 14, 16, 22, 25, 26, 29, 33, 34]),
      })
    }

    console.log('Step 1.1')

    await expect(playCard(client2, { cardValue: 15, otherClients: [client1, client3] })).resolves.toBeUndefined()
    await expect(playCard(client3, { cardValue: 34, otherClients: [client1, client2] })).resolves.toBeUndefined()

    {
      const client2Promise_notifyUserPlayedCard = client2.waitForEvent('notifyUserPlayedCard')
      const client3Promise_notifyUserPlayedCard = client3.waitForEvent('notifyUserPlayedCard')
      const client1Promise_notifyGameStep = client1.waitForEvent('notifyGameStep')
      const client2Promise_notifyGameStep = client2.waitForEvent('notifyGameStep')
      const client3Promise_notifyGameStep = client3.waitForEvent('notifyGameStep')

      await expect(client1.emitEvent('playCard', { card: 2 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client2Promise_notifyUserPlayedCard).resolves.toStrictEqual({ userId: client1.id })
      await expect(client3Promise_notifyUserPlayedCard).resolves.toStrictEqual({ userId: client1.id })

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client2.id, card: c(15) },
            { playerId: client1.id, card: c(2) },
            { playerId: client3.id, card: c(34) },
          ],
          waitingPlayer: client1.id,
        },
        gameState: {
          rows: [
            c([7]), //
            c([13]),
            c([23]),
            c([20]),
          ],
          players: [
            {
              id: client2.id,
              hasSelectedCard: true,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
            {
              id: client1.id,
              hasSelectedCard: true,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client3.id,
              hasSelectedCard: true,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client3.id, color: 'D1D5DB', name: client3.id },
            },
          ],
          stepsLeft: 10,
        },
      }

      await expect(client1Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([2, 5, 6, 8, 9, 12, 17, 18, 27, 30]),
      })

      await expect(client2Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([1, 3, 10, 15, 19, 21, 24, 28, 31, 32]),
      })

      await expect(client3Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([4, 11, 14, 16, 22, 25, 26, 29, 33, 34]),
      })
    }

    console.log('Step 1.2')

    await sleep(4500)

    {
      const client1Promise_youHaveBeenKicked = client1.waitForEvent('youHaveBeenKicked')
      const client2Promise_usersLeft = client2.waitForEvent('usersLeft')
      const client3Promise_usersLeft = client3.waitForEvent('usersLeft')
      const client2Promise_notifyGameStep = client2.waitForEvent('notifyGameStep')
      const client3Promise_notifyGameStep = client3.waitForEvent('notifyGameStep')

      // client1 receives 'youHaveBeenKicked' event
      await expect(client1Promise_youHaveBeenKicked).resolves.toStrictEqual({
        reason: 'inactivity',
      })

      const sharedData_gameState = {
        rows: [
          c([2]), //
          c([13, 15]),
          c([23, 34]),
          c([20]),
        ],
        players: [
          {
            id: client2.id,
            hasSelectedCard: false,
            penaltyPoints: 0,
            isActive: true,
            user: { id: client2.id, color: 'D1D5DB', name: client2.id },
          },
          {
            id: client1.id,
            hasSelectedCard: false,
            penaltyPoints: 1,
            isActive: false,
            user: { id: client1.id, color: 'D1D5DB', name: client1.id },
          },
          {
            id: client3.id,
            hasSelectedCard: false,
            penaltyPoints: 0,
            isActive: true,
            user: { id: client3.id, color: 'D1D5DB', name: client3.id },
          },
        ],
        stepsLeft: 9,
      }

      const sharedData_newRoomState = {
        id: roomId,
        name: 'HELLO',
        owner: { id: client2.id, color: 'D1D5DB', name: client2.id },
        users: [{ id: client3.id, color: 'D1D5DB', name: client3.id }],
        gameOptions: {
          mode: 'normal',
          playerInactivityStrategy: 'kick',
          stepTimeout: 5000,
          type: 'takeSix',
        },
      }

      const sharedData_usersLeft = {
        userIds: [client1.id],
        reason: 'kickedForInactivity',
        game: sharedData_gameState,
        newRoomState: sharedData_newRoomState,
      }

      // client2, client3 receive 'usersLeft' event
      await expect(client2Promise_usersLeft).resolves.toStrictEqual(sharedData_usersLeft)
      await expect(client3Promise_usersLeft).resolves.toStrictEqual(sharedData_usersLeft)

      // all clients receive 'notifyGameStep' event
      const sharedData_notifyGameStep = {
        step: {
          selectedCards: [
            { playerId: client2.id, card: c(15) },
            { playerId: client1.id, card: c(2) },
            { playerId: client3.id, card: c(34) },
          ],
          moves: [
            { playerId: client1.id, card: c(2), rowIndex: 0, takesRow: true },
            { playerId: client2.id, card: c(15), rowIndex: 1, takesRow: false },
            { playerId: client3.id, card: c(34), rowIndex: 2, takesRow: false },
          ],
        },
        gameState: sharedData_gameState,
      }

      await expect(client2Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData_notifyGameStep,
        playerCards: c([1, 3, 10, 19, 21, 24, 28, 31, 32]),
      })

      await expect(client3Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData_notifyGameStep,
        playerCards: c([4, 11, 14, 16, 22, 25, 26, 29, 33]),
      })
    }

    console.log('Step 2')

    await expect(playCard(client2, { cardValue: 10, otherClients: [client3] })).resolves.toBeUndefined()

    {
      const client2Promise_notifyUserPlayedCard = client2.waitForEvent('notifyUserPlayedCard')
      const client2Promise_notifyGameStep = client2.waitForEvent('notifyGameStep')
      const client3Promise_notifyGameStep = client3.waitForEvent('notifyGameStep')

      await expect(client3.emitEvent('playCard', { card: 11 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client2Promise_notifyUserPlayedCard).resolves.toStrictEqual({ userId: client3.id })

      const sharedData_notifyGameStep = {
        step: {
          selectedCards: [
            { playerId: client2.id, card: c(10) },
            { playerId: client3.id, card: c(11) },
          ],
          moves: [
            { playerId: client2.id, card: c(10), rowIndex: 0, takesRow: false },
            { playerId: client3.id, card: c(11), rowIndex: 0, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([2, 10, 11]), //
            c([13, 15]),
            c([23, 34]),
            c([20]),
          ],
          players: [
            {
              id: client2.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
            {
              id: client1.id,
              hasSelectedCard: false,
              penaltyPoints: 1,
              isActive: false,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client3.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client3.id, color: 'D1D5DB', name: client3.id },
            },
          ],
          stepsLeft: 8,
        },
      }

      await expect(client2Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData_notifyGameStep,
        playerCards: c([1, 3, 19, 21, 24, 28, 31, 32]),
      })

      await expect(client3Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData_notifyGameStep,
        playerCards: c([4, 14, 16, 22, 25, 26, 29, 33]),
      })
    }

    console.log('Step 3')

    await expect(playCard(client3, { cardValue: 14, otherClients: [client2] })).resolves.toBeUndefined()

    await sleep(4500)

    {
      const client2Promise_youHaveBeenKicked = client2.waitForEvent('youHaveBeenKicked')
      const client3Promise_usersLeft = client3.waitForEvent('usersLeft')
      const client3Promise_notifyGameStopped = client3.waitForEvent('notifyGameStopped')

      await expect(client2Promise_youHaveBeenKicked).resolves.toStrictEqual({
        reason: 'inactivity',
      })

      await expect(client3Promise_usersLeft).resolves.toStrictEqual({
        userIds: [client2.id],
        reason: 'kickedForInactivity',
        game: null,
        newRoomState: {
          id: roomId,
          name: 'HELLO',
          owner: { id: client3.id, color: 'D1D5DB', name: client3.id },
          users: [],
          gameOptions: {
            mode: 'normal',
            playerInactivityStrategy: 'kick',
            stepTimeout: 5000,
            type: 'takeSix',
          },
        },
      })

      await expect(client3Promise_notifyGameStopped).resolves.toStrictEqual({
        reason: 'Player inactivity',
      })
    }

    expectClientsExpectedEventsQueuesClean(getClients())
  })
})
