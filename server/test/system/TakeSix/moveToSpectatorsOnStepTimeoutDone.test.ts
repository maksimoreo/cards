import { c } from '../../../src/lib/TakeSix/__test__/testHelpers'
import { sleep } from '../../../src/utils'
import { createRoom, joinRoom, playCard } from '../helpers/clientEventsHelpers'
import { expectClientsExpectedEventsQueuesClean } from '../helpers/testHelpers'
import { useApp, useClients } from '../helpers/testHooks'

describe('Player Inactivity Strategy: Move To Spectators', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 3)

  jest.setTimeout(30000)

  test('Player Inactivity Strategy: Move To Spectators', async () => {
    const [client1, client2, client3] = getClients()

    await expect(
      createRoom(client3, { name: 'theroom' }, { globalClients: [client1, client2] }),
    ).resolves.toBeUndefined()

    const roomId = getApp().rooms[0].id

    await expect(
      joinRoom(client1, { name: 'theroom' }, { roomClients: [client3], globalClients: [client2] }),
    ).resolves.toBeUndefined()

    console.log('client3 changes game options')

    {
      const client1Promise = client1.waitForEvent('s2c_gameOptionsUpdated')

      await expect(
        client3.emitEvent('updateGameOptions', {
          type: 'takeSix',
          stepTimeout: 5000,
          playerInactivityStrategy: 'kick',
        }),
      ).resolves.toStrictEqual({
        code: 'SUCCESS',
      })

      await expect(client1Promise).resolves.toStrictEqual({
        gameOptions: {
          type: 'takeSix',
          mode: 'normal',
          stepTimeout: 5000,
          playerInactivityStrategy: 'kick',
        },
      })
    }

    // client2 joins
    await expect(joinRoom(client2, { name: 'theroom' }, { roomClients: [client3, client1] })).resolves.toBeUndefined()

    console.log('client3 changes game options again')

    {
      const client1Promise = client1.waitForEvent('s2c_gameOptionsUpdated')
      const client2Promise = client2.waitForEvent('s2c_gameOptionsUpdated')

      await expect(
        client3.emitEvent('updateGameOptions', {
          type: 'takeSix',
          mode: 'normal',
          stepTimeout: 5000,
          playerInactivityStrategy: 'moveToSpectators',
        }),
      ).resolves.toStrictEqual({
        code: 'SUCCESS',
      })

      await expect(client1Promise).resolves.toStrictEqual({
        gameOptions: {
          type: 'takeSix',
          mode: 'normal',
          stepTimeout: 5000,
          playerInactivityStrategy: 'moveToSpectators',
        },
      })

      await expect(client2Promise).resolves.toStrictEqual({
        gameOptions: {
          type: 'takeSix',
          mode: 'normal',
          stepTimeout: 5000,
          playerInactivityStrategy: 'moveToSpectators',
        },
      })
    }

    console.log('Starting the game')

    const cardsPool = [
      24, 32, 29, 14, 20, 17, 8, 27, 10, 15, 30, 25, 1, 34, 23, 19, 31, 21, 5, 9, 22, 4, 13, 12, 2, 11, 28, 16, 33, 7,
      26, 6, 3, 18,
    ]

    {
      const client1Promise = client1.waitForEvent('s2c_gameStarted')
      const client2Promise = client2.waitForEvent('s2c_gameStarted')

      const gameState = {
        players: [
          {
            id: client3.id,
            hasSelectedCard: false,
            penaltyPoints: 0,
            isActive: true,
            user: { id: client3.id, color: 'D1D5DB', name: client3.id },
          },
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
        rows: [c([26]), c([6]), c([3]), c([18])],
        stepsLeft: 10,
      }

      await expect(client3.emitEvent('startGame', { cardsPool })).resolves.toStrictEqual({
        code: 'SUCCESS',
        data: {
          gameState,
          playerCards: c([8, 10, 14, 15, 17, 20, 24, 27, 29, 32]),
        },
      })

      await expect(client1Promise).resolves.toStrictEqual({
        gameState,
        playerCards: c([1, 5, 9, 19, 21, 23, 25, 30, 31, 34]),
      })

      await expect(client2Promise).resolves.toStrictEqual({
        gameState,
        playerCards: c([2, 4, 7, 11, 12, 13, 16, 22, 28, 33]),
      })
    }

    console.log('Step 1')

    await expect(playCard(client1, { cardValue: 9, otherClients: [client2, client3] })).resolves.toBeUndefined()

    await expect(playCard(client2, { cardValue: 7, otherClients: [client1, client3] })).resolves.toBeUndefined()

    {
      const client1Promise_s2c_userPlayedCard = client1.waitForEvent('s2c_userPlayedCard')
      const client2Promise_s2c_userPlayedCard = client2.waitForEvent('s2c_userPlayedCard')
      const client1Promise_s2c_gameStep = client1.waitForEvent('s2c_gameStep')
      const client2Promise_s2c_gameStep = client2.waitForEvent('s2c_gameStep')
      const client3Promise_s2c_gameStep = client3.waitForEvent('s2c_gameStep')

      await expect(client3.emitEvent('playCard', { card: 8 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client3.id })
      await expect(client2Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client3.id })

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client3.id, card: c(8) },
            { playerId: client1.id, card: c(9) },
            { playerId: client2.id, card: c(7) },
          ],
          moves: [
            { playerId: client2.id, card: c(7), rowIndex: 1, takesRow: false },
            { playerId: client3.id, card: c(8), rowIndex: 1, takesRow: false },
            { playerId: client1.id, card: c(9), rowIndex: 1, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([26]), //
            c([6, 7, 8, 9]),
            c([3]),
            c([18]),
          ],
          players: [
            {
              id: client3.id,
              hasSelectedCard: false,
              penaltyPoints: 0,
              isActive: true,
              user: { id: client3.id, color: 'D1D5DB', name: client3.id },
            },
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

      await expect(client1Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([1, 5, 19, 21, 23, 25, 30, 31, 34]),
      })

      await expect(client2Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([2, 4, 11, 12, 13, 16, 22, 28, 33]),
      })

      await expect(client3Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([10, 14, 15, 17, 20, 24, 27, 29, 32]),
      })
    }

    console.log('Step 2')

    await expect(playCard(client1, { cardValue: 19, otherClients: [client2, client3] })).resolves.toBeUndefined()

    await expect(playCard(client3, { cardValue: 10, otherClients: [client1, client2] })).resolves.toBeUndefined()

    await sleep(4500)

    {
      const client1Promise_s2c_usersMovedToSpectators = client1.waitForEvent('s2c_usersMovedToSpectators')
      const client2Promise_s2c_youHaveBeenMovedToSpectators = client2.waitForEvent('s2c_youHaveBeenMovedToSpectators')
      const client3Promise_s2c_usersMovedToSpectators = client3.waitForEvent('s2c_usersMovedToSpectators')

      const client1Promise_s2c_gameStep = client1.waitForEvent('s2c_gameStep')
      const client2Promise_s2c_gameStep = client2.waitForEvent('s2c_gameStep')
      const client3Promise_s2c_gameStep = client3.waitForEvent('s2c_gameStep')

      const sharedData_gameState = {
        rows: [
          c([26]), //
          c([6, 7, 8, 9, 10]),
          c([3]),
          c([18, 19]),
        ],
        players: [
          {
            id: client3.id,
            hasSelectedCard: false,
            penaltyPoints: 0,
            isActive: true,
            user: { id: client3.id, color: 'D1D5DB', name: client3.id },
          },
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
            isActive: false,
            user: { id: client2.id, color: 'D1D5DB', name: client2.id },
          },
        ],
        stepsLeft: 8,
      }

      const sharedData_newRoomState = {
        id: roomId,
        name: 'theroom',
        owner: { id: client3.id, color: 'D1D5DB', name: client3.id },
        users: [
          { id: client1.id, color: 'D1D5DB', name: client1.id },
          { id: client2.id, color: 'D1D5DB', name: client2.id },
        ],
        gameOptions: {
          mode: 'normal',
          playerInactivityStrategy: 'moveToSpectators',
          stepTimeout: 5000,
          type: 'takeSix',
        },
      }

      // client1, client3, receive 's2c_usersMovedToSpectators' event
      await expect(client1Promise_s2c_usersMovedToSpectators).resolves.toStrictEqual({
        reason: 'inactivity',
        game: sharedData_gameState,
        userIds: [client2.id],
        newRoomState: sharedData_newRoomState,
      })

      await expect(client3Promise_s2c_usersMovedToSpectators).resolves.toStrictEqual({
        reason: 'inactivity',
        game: sharedData_gameState,
        userIds: [client2.id],
        newRoomState: sharedData_newRoomState,
      })

      // client2 receives 's2c_youHaveBeenMovedToSpectators' event
      await expect(client2Promise_s2c_youHaveBeenMovedToSpectators).resolves.toStrictEqual({
        reason: 'inactivity',
        game: sharedData_gameState,
        newRoomState: sharedData_newRoomState,
      })

      // Everyone receive 's2c_gameStep' event
      const sharedData_gameStep = {
        step: {
          selectedCards: [
            { playerId: client3.id, card: c(10) },
            { playerId: client1.id, card: c(19) },
          ],
          moves: [
            { playerId: client3.id, card: c(10), rowIndex: 1, takesRow: false },
            { playerId: client1.id, card: c(19), rowIndex: 3, takesRow: false },
          ],
        },
        gameState: sharedData_gameState,
      }

      await expect(client1Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData_gameStep,
        playerCards: c([1, 5, 21, 23, 25, 30, 31, 34]),
      })

      await expect(client2Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData_gameStep,
      })

      await expect(client3Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData_gameStep,
        playerCards: c([14, 15, 17, 20, 24, 27, 29, 32]),
      })
    }

    console.log('Step 3')

    await expect(playCard(client1, { cardValue: 1, otherClients: [client2, client3] })).resolves.toBeUndefined()

    await expect(client2.emitEvent('playCard', { card: 33 })).resolves.toStrictEqual({
      code: 'BAD_REQUEST',
      message: 'Cannot play cards while spectating',
      validationErrors: [],
    })

    await sleep(4500)

    {
      const client1Promise_s2c_usersMovedToSpectators = client1.waitForEvent('s2c_usersMovedToSpectators')
      const client1Promise_s2c_gameStopped = client1.waitForEvent('s2c_gameStopped')

      const client2Promise_s2c_usersMovedToSpectators = client2.waitForEvent('s2c_usersMovedToSpectators')
      const client2Promise_s2c_gameStopped = client2.waitForEvent('s2c_gameStopped')

      const client3Promise_s2c_youHaveBeenMovedToSpectators = client3.waitForEvent('s2c_youHaveBeenMovedToSpectators')
      const client3Promise_s2c_gameStopped = client3.waitForEvent('s2c_gameStopped')

      const sharedData_newRoomState = {
        id: roomId,
        name: 'theroom',
        owner: { id: client3.id, color: 'D1D5DB', name: client3.id },
        users: [
          { id: client1.id, color: 'D1D5DB', name: client1.id },
          { id: client2.id, color: 'D1D5DB', name: client2.id },
        ],
        gameOptions: {
          mode: 'normal',
          playerInactivityStrategy: 'moveToSpectators',
          stepTimeout: 5000,
          type: 'takeSix',
        },
      }

      // client1, client2 receive 's2c_usersMovedToSpectators' event
      await expect(client1Promise_s2c_usersMovedToSpectators).resolves.toStrictEqual({
        reason: 'inactivity',
        userIds: [client3.id],
        game: null,
        newRoomState: sharedData_newRoomState,
      })

      await expect(client2Promise_s2c_usersMovedToSpectators).resolves.toStrictEqual({
        reason: 'inactivity',
        userIds: [client3.id],
        game: null,
        newRoomState: sharedData_newRoomState,
      })

      // client3 receives 's2c_youHaveBeenMovedToSpectators' event
      await expect(client3Promise_s2c_youHaveBeenMovedToSpectators).resolves.toStrictEqual({
        reason: 'inactivity',
        game: null,
        newRoomState: sharedData_newRoomState,
      })

      const game = {
        rows: [
          c([26]), //
          c([6, 7, 8, 9, 10]),
          c([3]),
          c([18, 19]),
        ],
        players: [
          {
            id: client3.id,
            hasSelectedCard: false,
            penaltyPoints: 0,
            isActive: true,
            user: { id: client3.id, color: 'D1D5DB', name: client3.id },
          },
          {
            id: client1.id,
            hasSelectedCard: true,
            penaltyPoints: 0,
            isActive: true,
            user: { id: client1.id, color: 'D1D5DB', name: client1.id },
          },
          {
            id: client2.id,
            hasSelectedCard: false,
            penaltyPoints: 0,
            isActive: false,
            user: { id: client2.id, color: 'D1D5DB', name: client2.id },
          },
        ],
        stepsLeft: 8,
      }

      // All clients receive 's2c_gameStopped' event
      await expect(client1Promise_s2c_gameStopped).resolves.toStrictEqual({
        reason: 'playerInactivity',
        winners: [],
        game,
      })
      await expect(client2Promise_s2c_gameStopped).resolves.toStrictEqual({
        reason: 'playerInactivity',
        winners: [],
        game,
      })
      await expect(client3Promise_s2c_gameStopped).resolves.toStrictEqual({
        reason: 'playerInactivity',
        winners: [],
        game,
      })
    }

    expectClientsExpectedEventsQueuesClean(getClients())
  })
})
