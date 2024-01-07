import { c } from '../../../src/lib/TakeSix/__test__/testHelpers'
import { sleep } from '../../../src/utils'
import { createRoom, joinRoom, leaveCurrentRoom, playCard } from '../helpers/clientEventsHelpers'
import { expectClientsExpectedEventsQueuesClean } from '../helpers/testHelpers'
import { useApp, useClients } from '../helpers/testHooks'

describe('Player Inactivity Strategy: Move To Spectators', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 3)

  jest.setTimeout(40000)

  test('Move player to spectators when selecting row and three players in game, then when selecting cards and two players in game', async () => {
    const [client1, client2, client3] = getClients()

    await expect(
      createRoom(client1, { name: 'PerryThePlatypus' }, { globalClients: [client2, client3] }),
    ).resolves.toBeUndefined()
    await expect(
      joinRoom(client2, { name: 'PerryThePlatypus' }, { roomClients: [client1], globalClients: [client3] }),
    ).resolves.toBeUndefined()

    // Change options
    {
      const client2Promise = client2.waitForEvent('s2c_gameOptionsUpdated')

      await expect(
        client1.emitEvent('updateGameOptions', {
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
      joinRoom(client3, { name: 'PerryThePlatypus' }, { roomClients: [client1, client2], globalClients: [] }),
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
      const client2Promise = client2.waitForEvent('s2c_gameStarted')
      const client3Promise = client3.waitForEvent('s2c_gameStarted')

      const game = {
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

      await expect(client1.emitEvent('startGame', { cardsPool })).resolves.toStrictEqual({
        code: 'SUCCESS',
        data: {
          game: game,
          playerCards: c([2, 6, 11, 12, 15, 16, 20, 21, 24, 34]),
        },
      })

      await expect(client2Promise).resolves.toStrictEqual({
        game,
        playerCards: c([1, 3, 9, 10, 13, 14, 23, 27, 30, 31]),
      })

      await expect(client3Promise).resolves.toStrictEqual({
        game,
        playerCards: c([5, 7, 17, 18, 19, 25, 28, 29, 32, 33]),
      })
    }

    console.log('Step 1.1')

    await expect(playCard(client1, { cardValue: 2, otherClients: [client2, client3] })).resolves.toBeUndefined()

    await expect(playCard(client2, { cardValue: 1, otherClients: [client1, client3] })).resolves.toBeUndefined()

    {
      const client1Promise_s2c_userPlayedCard = client1.waitForEvent('s2c_userPlayedCard')
      const client1Promise_s2c_gameStep = client1.waitForEvent('s2c_gameStep')
      const client2Promise_s2c_userPlayedCard = client2.waitForEvent('s2c_userPlayedCard')
      const client2Promise_s2c_gameStep = client2.waitForEvent('s2c_gameStep')
      const client3Promise_s2c_gameStep = client3.waitForEvent('s2c_gameStep')

      await expect(client3.emitEvent('playCard', { card: 7 })).toResolve()

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(2) },
            { playerId: client2.id, card: c(1) },
            { playerId: client3.id, card: c(7) },
          ],
          waitingPlayer: client2.id,
        },
        game: {
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

      await expect(client1Promise_s2c_userPlayedCard).toResolve()
      await expect(client2Promise_s2c_userPlayedCard).toResolve()

      await expect(client1Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([2, 6, 11, 12, 15, 16, 20, 21, 24, 34]),
      })

      await expect(client2Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([1, 3, 9, 10, 13, 14, 23, 27, 30, 31]),
      })

      await expect(client3Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([5, 7, 17, 18, 19, 25, 28, 29, 32, 33]),
      })
    }

    console.log('Step 1.2')

    await sleep(4500)

    {
      const client1Promise_s2c_usersMovedToSpectators = client1.waitForEvent('s2c_usersMovedToSpectators')
      const client1Promise_s2c_gameStep = client1.waitForEvent('s2c_gameStep')

      const client2Promise_s2c_youHaveBeenMovedToSpectators = client2.waitForEvent('s2c_youHaveBeenMovedToSpectators')
      const client2Promise_s2c_gameStep = client2.waitForEvent('s2c_gameStep')

      const client3Promise_s2c_usersMovedToSpectators = client3.waitForEvent('s2c_usersMovedToSpectators')
      const client3Promise_s2c_gameStep = client3.waitForEvent('s2c_gameStep')

      // client1, client3 receive 's2c_usersMovedToSpectators' event
      await expect(client1Promise_s2c_usersMovedToSpectators).resolves.toMatchObject({
        userIds: [client2.id],
        newRoomState: {
          owner: { id: client1.id },
          users: [{ id: client2.id }, { id: client3.id }],
        },
      })

      await expect(client3Promise_s2c_usersMovedToSpectators).resolves.toMatchObject({
        userIds: [client2.id],
        newRoomState: {
          owner: { id: client1.id },
          users: [{ id: client2.id }, { id: client3.id }],
        },
      })

      // client2 receives 's2c_youHaveBeenMovedToSpectators' event
      await expect(client2Promise_s2c_youHaveBeenMovedToSpectators).resolves.toMatchObject({
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

      // Everyone receives 's2c_gameStep' event
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
        game: {
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

      await expect(client1Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([6, 11, 12, 15, 16, 20, 21, 24, 34]),
      })

      await expect(client2Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
      })

      await expect(client3Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([5, 17, 18, 19, 25, 28, 29, 32, 33]),
      })
    }

    console.log('Step 2')

    await expect(playCard(client3, { cardValue: 5, otherClients: [client1, client2] })).resolves.toBeUndefined()

    await sleep(4500)

    {
      const client1Promise_s2c_youHaveBeenMovedToSpectators = client1.waitForEvent('s2c_youHaveBeenMovedToSpectators')
      const client1Promise_s2c_gameStopped = client1.waitForEvent('s2c_gameStopped')

      const client2Promise_s2c_usersMovedToSpectators = client2.waitForEvent('s2c_usersMovedToSpectators')
      const client2Promise_s2c_gameStopped = client2.waitForEvent('s2c_gameStopped')

      const client3Promise_s2c_usersMovedToSpectators = client3.waitForEvent('s2c_usersMovedToSpectators')
      const client3Promise_s2c_gameStopped = client3.waitForEvent('s2c_gameStopped')

      // client2, client3 receive 's2c_usersMovedToSpectators' event
      await expect(client2Promise_s2c_usersMovedToSpectators).resolves.toMatchObject({
        userIds: [client1.id],
        newRoomState: {
          owner: { id: client1.id },
          users: [{ id: client2.id }, { id: client3.id }],
        },
      })

      await expect(client3Promise_s2c_usersMovedToSpectators).resolves.toMatchObject({
        userIds: [client1.id],
        newRoomState: {
          owner: { id: client1.id },
          users: [{ id: client2.id }, { id: client3.id }],
        },
      })

      // client1 receives 's2c_youHaveBeenMovedToSpectators' event
      await expect(client1Promise_s2c_youHaveBeenMovedToSpectators).resolves.toMatchObject({
        newRoomState: {
          owner: { id: client1.id },
          users: [{ id: client2.id }, { id: client3.id }],
        },
      })

      const game = {
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
            hasSelectedCard: true,
            penaltyPoints: 0,
            isActive: true,
            user: { id: client3.id, color: 'D1D5DB', name: client3.id },
          },
        ],
        stepsLeft: 9,
      }

      // Everyone receives 's2c_gameStopped' event
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

    await expect(
      leaveCurrentRoom(client1, { roomClients: [client2, client3], globalClients: [] }),
    ).resolves.toBeUndefined()
    await expect(
      leaveCurrentRoom(client2, { roomClients: [client3], globalClients: [client1] }),
    ).resolves.toBeUndefined()
    await expect(
      leaveCurrentRoom(client3, { roomClients: [], globalClients: [client1, client2] }),
    ).resolves.toBeUndefined()

    expectClientsExpectedEventsQueuesClean(getClients())
  })
})
