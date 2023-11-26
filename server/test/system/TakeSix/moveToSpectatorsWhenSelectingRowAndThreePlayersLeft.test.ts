import { c } from '../../../src/lib/TakeSix/__test__/testHelpers'
import { createRoom, joinRoom, leaveCurrentRoom, playCard } from '../helpers/clientEventsHelpers'
import { emitEvent, waitClientsForNoEvents, waitForEvent } from '../helpers/testHelpers'
import { useApp, useClients } from '../helpers/testHooks'

describe('Player Inactivity Strategy: Move To Spectators', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 3)

  jest.setTimeout(20000)

  test('When selecting row and three players left', async () => {
    const [client1, client2, client3] = getClients()

    await expect(createRoom(client1, 'PerryThePlatypus')).resolves.toBeUndefined()
    await expect(joinRoom(client2, { name: 'PerryThePlatypus', otherClients: [client1] })).resolves.toBeUndefined()

    // Change options
    {
      const client2Promise = waitForEvent(client2, 'gameOptionsUpdated')

      await expect(
        emitEvent(client1, 'updateGameOptions', {
          type: 'takeSix',
          stepTimeout: 5000,
          playerInactivityStrategy: 'moveToSpectators',
        }),
      ).resolves.toStrictEqual({
        code: 'SUCCESS',
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

    // client3 joins
    await expect(
      joinRoom(client3, { name: 'PerryThePlatypus', otherClients: [client1, client2] }),
    ).resolves.toBeUndefined()

    console.log('Starting the game')

    // 24,  2, 11, 15, 12, 21,  6, 34, 16, 20,
    //  1, 13,  9, 27, 30,  3, 14, 23, 31, 10,
    // 17, 19,  5, 25, 32, 33,  7, 29, 28, 18,
    //  4,  8, 26, 22
    const cardsPool = [
      24, 2, 11, 15, 12, 21, 6, 34, 16, 20, 1, 13, 9, 27, 30, 3, 14, 23, 31, 10, 17, 19, 5, 25, 32, 33, 7, 29, 28, 18,
      4, 8, 26, 22,
    ]

    {
      const client2Promise = waitForEvent(client2, 'notifyGameStarted')
      const client3Promise = waitForEvent(client3, 'notifyGameStarted')

      const gameState = {
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
          {
            id: client3.id,
            hasSelectedCard: false,
            penaltyPoints: 0,
            isActive: true,
            user: { id: client3.id, color: 'D1D5DB', name: client3.id },
          },
        ],
        rows: [c([4]), c([8]), c([26]), c([22])],
        stepsLeft: 10,
      }

      await expect(emitEvent(client1, 'startGame', { cardsPool })).resolves.toStrictEqual({
        code: 'SUCCESS',
        data: {
          gameState,
          playerCards: c([2, 6, 11, 12, 15, 16, 20, 21, 24, 34]),
        },
      })

      await expect(client2Promise).resolves.toStrictEqual({
        gameState,
        playerCards: c([1, 3, 9, 10, 13, 14, 23, 27, 30, 31]),
      })

      await expect(client3Promise).resolves.toStrictEqual({
        gameState,
        playerCards: c([5, 7, 17, 18, 19, 25, 28, 29, 32, 33]),
      })
    }

    console.log('Step 1')

    await expect(playCard(client1, { cardValue: 2, otherClients: [client2, client3] })).resolves.toBeUndefined()

    await expect(playCard(client2, { cardValue: 1, otherClients: [client1, client3] })).resolves.toBeUndefined()

    {
      const client1Promise = waitForEvent(client1, 'notifyGameStep')
      const client2Promise = waitForEvent(client2, 'notifyGameStep')
      const client3Promise = waitForEvent(client3, 'notifyGameStep')

      await expect(playCard(client3, { cardValue: 7, otherClients: [client1, client2] })).resolves.toBeUndefined()

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(2) },
            { playerId: client2.id, card: c(1) },
            { playerId: client3.id, card: c(7) },
          ],
          waitingPlayer: client2.id,
        },
        gameState: {
          rows: [
            c([4]), //
            c([8]),
            c([26]),
            c([22]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: true,
              penaltyPoints: 0,
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

      await expect(client1Promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([2, 6, 11, 12, 15, 16, 20, 21, 24, 34]),
      })

      await expect(client2Promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([1, 3, 9, 10, 13, 14, 23, 27, 30, 31]),
      })

      await expect(client3Promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([5, 7, 17, 18, 19, 25, 28, 29, 32, 33]),
      })
    }

    console.log('Step 1.1')

    await expect(waitClientsForNoEvents([client1, client2, client3], { timeout: 4500 })).resolves.toBeUndefined()

    {
      const client1Promise_notifyGameStep = waitForEvent(client1, 'notifyGameStep')
      const client1Promise_usersMovedToSpectators = waitForEvent(client1, 'usersMovedToSpectators')

      const client2Promise_notifyGameStep = waitForEvent(client2, 'notifyGameStep')
      const client2Promise_youHaveBeenMovedToSpectators = waitForEvent(client2, 'youHaveBeenMovedToSpectators')

      const client3Promise_notifyGameStep = waitForEvent(client3, 'notifyGameStep')
      const client3Promise_usersMovedToSpectators = waitForEvent(client3, 'usersMovedToSpectators')

      // client1, client3 receive 'usersMovedToSpectators' event
      await expect(client1Promise_usersMovedToSpectators).resolves.toMatchObject({
        userIds: [client2.id],
        newRoomState: {
          owner: { id: client1.id },
          users: [{ id: client2.id }, { id: client3.id }],
        },
      })

      await expect(client3Promise_usersMovedToSpectators).resolves.toMatchObject({
        userIds: [client2.id],
        newRoomState: {
          owner: { id: client1.id },
          users: [{ id: client2.id }, { id: client3.id }],
        },
      })

      // client2 receives 'youHaveBeenMovedToSpectators' event
      await expect(client2Promise_youHaveBeenMovedToSpectators).resolves.toMatchObject({
        newRoomState: {
          owner: { id: client1.id },
          users: [{ id: client2.id }, { id: client3.id }],
        },
        game: {
          players: [
            { id: client1.id, isActive: true },
            { id: client2.id, isActive: false },
            { id: client3.id, isActive: true },
          ],
        },
      })

      // Everyone receives 'notifyGameStep' event
      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(2) },
            { playerId: client2.id, card: c(1) },
            { playerId: client3.id, card: c(7) },
          ],
          moves: [
            { playerId: client2.id, card: c(1), rowIndex: 0, takesRow: true },
            { playerId: client1.id, card: c(2), rowIndex: 0, takesRow: false },
            { playerId: client3.id, card: c(7), rowIndex: 0, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([1, 2, 7]), //
            c([8]),
            c([26]),
            c([22]),
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
              penaltyPoints: 1,
              isActive: false,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
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
        },
      }

      await expect(client1Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([6, 11, 12, 15, 16, 20, 21, 24, 34]),
      })

      await expect(client2Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData,
      })

      await expect(client3Promise_notifyGameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([5, 17, 18, 19, 25, 28, 29, 32, 33]),
      })
    }

    console.log('Step 2')

    await expect(playCard(client3, { cardValue: 5, otherClients: [client1, client2] })).resolves.toBeUndefined()

    await expect(waitClientsForNoEvents([client1, client2, client3], { timeout: 4500 })).resolves.toBeUndefined()

    {
      const client1Promise_notifyGameStopped = waitForEvent(client1, 'notifyGameStopped')
      const client1Promise_youHaveBeenMovedToSpectators = waitForEvent(client1, 'youHaveBeenMovedToSpectators')

      const client2Promise_notifyGameStopped = waitForEvent(client2, 'notifyGameStopped')
      const client2Promise_usersMovedToSpectators = waitForEvent(client2, 'usersMovedToSpectators')

      const client3Promise_notifyGameStopped = waitForEvent(client3, 'notifyGameStopped')
      const client3Promise_usersMovedToSpectators = waitForEvent(client3, 'usersMovedToSpectators')

      // client2, client3 receive 'usersMovedToSpectators' event
      await expect(client2Promise_usersMovedToSpectators).resolves.toMatchObject({
        userIds: [client1.id],
        newRoomState: {
          owner: { id: client1.id },
          users: [{ id: client2.id }, { id: client3.id }],
        },
      })

      await expect(client3Promise_usersMovedToSpectators).resolves.toMatchObject({
        userIds: [client1.id],
        newRoomState: {
          owner: { id: client1.id },
          users: [{ id: client2.id }, { id: client3.id }],
        },
      })

      // client1 receives 'youHaveBeenMovedToSpectators' event
      await expect(client1Promise_youHaveBeenMovedToSpectators).resolves.toMatchObject({
        newRoomState: {
          owner: { id: client1.id },
          users: [{ id: client2.id }, { id: client3.id }],
        },
      })

      // Everyone receives 'notifyGameStopped' event
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

    await expect(leaveCurrentRoom(client1)).resolves.toBeUndefined()
    await expect(leaveCurrentRoom(client2)).resolves.toBeUndefined()
    await expect(leaveCurrentRoom(client3)).resolves.toBeUndefined()
  })
})
