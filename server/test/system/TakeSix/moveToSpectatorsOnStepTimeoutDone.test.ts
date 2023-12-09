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
    await expect(
      joinRoom(client1, { name: 'theroom' }, { roomClients: [client3], globalClients: [client2] }),
    ).resolves.toBeUndefined()

    console.log('client3 changes game options')

    {
      const client1Promise = client1.waitForEvent('gameOptionsUpdated')

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
      const client1Promise = client1.waitForEvent('gameOptionsUpdated')
      const client2Promise = client2.waitForEvent('gameOptionsUpdated')

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
      const client1Promise = client1.waitForEvent('notifyGameStarted')
      const client2Promise = client2.waitForEvent('notifyGameStarted')

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
      const client1Promise_notifyUserPlayedCard = client1.waitForEvent('notifyUserPlayedCard')
      const client2Promise_notifyUserPlayedCard = client2.waitForEvent('notifyUserPlayedCard')
      const client1Promise_notifyGameStep = client1.waitForEvent('notifyGameStep')
      const client2Promise_notifyGameStep = client2.waitForEvent('notifyGameStep')
      const client3Promise_notifyGameStep = client3.waitForEvent('notifyGameStep')

      await expect(client3.emitEvent('playCard', { card: 8 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Promise_notifyUserPlayedCard).resolves.toStrictEqual({ userId: client3.id })
      await expect(client2Promise_notifyUserPlayedCard).resolves.toStrictEqual({ userId: client3.id })

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

      await expect(client1Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([1, 5, 19, 21, 23, 25, 30, 31, 34]),
      })

      await expect(client2Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([2, 4, 11, 12, 13, 16, 22, 28, 33]),
      })

      await expect(client3Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([10, 14, 15, 17, 20, 24, 27, 29, 32]),
      })
    }

    console.log('Step 2')

    await expect(playCard(client1, { cardValue: 19, otherClients: [client2, client3] })).resolves.toBeUndefined()

    await expect(playCard(client3, { cardValue: 10, otherClients: [client1, client2] })).resolves.toBeUndefined()

    await sleep(4500)

    {
      const client1Promise_notifyGameStep = client1.waitForEvent('notifyGameStep')
      const client1Promise_usersMovedToSpectators = client1.waitForEvent('usersMovedToSpectators')

      const client2Promise_notifyGameStep = client2.waitForEvent('notifyGameStep')
      const client2Promise_youHaveBeenMovedToSpectators = client2.waitForEvent('youHaveBeenMovedToSpectators')

      const client3Promise_notifyGameStep = client3.waitForEvent('notifyGameStep')
      const client3Promise_usersMovedToSpectators = client3.waitForEvent('usersMovedToSpectators')

      // client1, client3, receive 'usersMovedToSpectators' event
      await expect(client1Promise_usersMovedToSpectators).resolves.toMatchObject({
        userIds: [client2.id],
        newRoomState: {
          owner: { id: client3.id },
          users: [{ id: client1.id }, { id: client2.id }],
        },
      })

      await expect(client3Promise_usersMovedToSpectators).resolves.toMatchObject({
        userIds: [client2.id],
        newRoomState: {
          owner: { id: client3.id },
          users: [{ id: client1.id }, { id: client2.id }],
        },
      })

      // client2 receives 'youHaveBeenMovedToSpectators' event
      await expect(client2Promise_youHaveBeenMovedToSpectators).resolves.toMatchObject({
        newRoomState: {
          owner: { id: client3.id },
          users: [{ id: client1.id }, { id: client2.id }],
        },
        game: {
          players: [
            { id: client3.id, isActive: true },
            { id: client1.id, isActive: true },
            { id: client2.id, isActive: false },
          ],
        },
      })

      // Everyone receive 'notifyGameStep' event
      const sharedData = {
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
        gameState: {
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
        },
      }

      await expect(client1Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([1, 5, 21, 23, 25, 30, 31, 34]),
      })

      await expect(client2Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData,
      })

      await expect(client3Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData,
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
      const client1Promise_usersMovedToSpectators = client1.waitForEvent('usersMovedToSpectators')
      const client1Promise_notifyGameStopped = client1.waitForEvent('notifyGameStopped')

      const client2Promise_usersMovedToSpectators = client2.waitForEvent('usersMovedToSpectators')
      const client2Promise_notifyGameStopped = client2.waitForEvent('notifyGameStopped')

      const client3Promise_youHaveBeenMovedToSpectators = client3.waitForEvent('youHaveBeenMovedToSpectators')
      const client3Promise_notifyGameStopped = client3.waitForEvent('notifyGameStopped')

      // client1, client2 receive 'usersMovedToSpectators' event
      await expect(client1Promise_usersMovedToSpectators).resolves.toMatchObject({
        userIds: [client3.id],
        game: null,
        newRoomState: {
          owner: { id: client3.id },
          users: [{ id: client1.id }, { id: client2.id }],
        },
      })

      await expect(client2Promise_usersMovedToSpectators).resolves.toMatchObject({
        userIds: [client3.id],
        game: null,
        newRoomState: {
          owner: { id: client3.id },
          users: [{ id: client1.id }, { id: client2.id }],
        },
      })

      // client3 receives 'youHaveBeenMovedToSpectators' event
      await expect(client3Promise_youHaveBeenMovedToSpectators).resolves.toMatchObject({
        game: null,
        newRoomState: {
          owner: { id: client3.id },
          users: [{ id: client1.id }, { id: client2.id }],
        },
      })

      // All clients receive 'notifyGameStopped' event
      await expect(client1Promise_notifyGameStopped).resolves.toStrictEqual({
        reason: 'Player inactivity',
      })
      await expect(client2Promise_notifyGameStopped).resolves.toStrictEqual({
        reason: 'Player inactivity',
      })
      await expect(client3Promise_notifyGameStopped).resolves.toStrictEqual({
        reason: 'Player inactivity',
      })
    }

    expectClientsExpectedEventsQueuesClean(getClients())
  })
})
