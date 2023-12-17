import { c } from '../../../src/lib/TakeSix/__test__/testHelpers'
import { sleep } from '../../../src/utils'
import { createRoom, joinRoom } from '../helpers/clientEventsHelpers'
import { expectClientsExpectedEventsQueuesClean } from '../helpers/testHelpers'
import { useApp, useClients } from '../helpers/testHooks'

describe('Player Inactivity Strategy: Kick', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 4)

  jest.setTimeout(20000)

  test('Kick all players from room and close room', async () => {
    const app = getApp()
    const [client1, client2, client3, client4] = getClients()

    await expect(
      createRoom(client4, { name: 'finally' }, { globalClients: [client1, client2, client3] }),
    ).resolves.toBeUndefined()

    await expect(
      joinRoom(client3, { name: 'finally' }, { roomClients: [client4], globalClients: [client1, client2] }),
    ).resolves.toBeUndefined()
    await expect(
      joinRoom(client2, { name: 'finally' }, { roomClients: [client4, client3], globalClients: [client1] }),
    ).resolves.toBeUndefined()
    await expect(
      joinRoom(client1, { name: 'finally' }, { roomClients: [client4, client3, client2], globalClients: [] }),
    ).resolves.toBeUndefined()

    console.log('client4 changes game options')

    {
      const client1Promise_gameOptionsUpdated = client1.waitForEvent('gameOptionsUpdated')
      const client2Promise_gameOptionsUpdated = client2.waitForEvent('gameOptionsUpdated')
      const client3Promise_gameOptionsUpdated = client3.waitForEvent('gameOptionsUpdated')

      await expect(
        client4.emitEvent('updateGameOptions', {
          type: 'takeSix',
          stepTimeout: 3000,
          playerInactivityStrategy: 'kick',
        }),
      ).resolves.toStrictEqual({ code: 'SUCCESS' })

      const expectedEventData = {
        gameOptions: {
          type: 'takeSix',
          mode: 'normal',
          stepTimeout: 3000,
          playerInactivityStrategy: 'kick',
        },
      }

      await expect(client1Promise_gameOptionsUpdated).resolves.toStrictEqual(expectedEventData)
      await expect(client2Promise_gameOptionsUpdated).resolves.toStrictEqual(expectedEventData)
      await expect(client3Promise_gameOptionsUpdated).resolves.toStrictEqual(expectedEventData)
    }

    console.log('Starting the game')

    {
      const client1Promise_notifyGameStarted = client1.waitForEvent('notifyGameStarted')
      const client2Promise_notifyGameStarted = client2.waitForEvent('notifyGameStarted')
      const client3Promise_notifyGameStarted = client3.waitForEvent('notifyGameStarted')

      const gameState = {
        players: [
          {
            id: client4.id,
            hasSelectedCard: false,
            penaltyPoints: 0,
            isActive: true,
            user: { id: client4.id, color: 'D1D5DB', name: client4.id },
          },
          {
            id: client3.id,
            hasSelectedCard: false,
            penaltyPoints: 0,
            isActive: true,
            user: { id: client3.id, color: 'D1D5DB', name: client3.id },
          },
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
        ],
        rows: [
          c([31]), //
          c([14]),
          c([7]),
          c([15]),
        ],
        stepsLeft: 10,
      }

      //  24,  39,  19,  13,  30,  41,  34,  27,   8,  18
      //  35,  28,  17,   5,   3,  21,  10,  40,  25,  29
      //  26,   4,  20,  33,  11,  12,  23,   2,   6,  16
      //  36,  22,  43,  32,  44,   9,  38,   1,  37,  42
      //  31,  14,   7,  15
      const cardsPool = [
        24, 39, 19, 13, 30, 41, 34, 27, 8, 18, 35, 28, 17, 5, 3, 21, 10, 40, 25, 29, 26, 4, 20, 33, 11, 12, 23, 2, 6,
        16, 36, 22, 43, 32, 44, 9, 38, 1, 37, 42, 31, 14, 7, 15,
      ]

      await expect(client4.emitEvent('startGame', { cardsPool })).resolves.toStrictEqual({
        code: 'SUCCESS',
        data: {
          gameState,
          playerCards: c([8, 13, 18, 19, 24, 27, 30, 34, 39, 41]),
        },
      })

      await expect(client3Promise_notifyGameStarted).resolves.toStrictEqual({
        gameState,
        playerCards: c([3, 5, 10, 17, 21, 25, 28, 29, 35, 40]),
      })

      await expect(client2Promise_notifyGameStarted).resolves.toStrictEqual({
        gameState,
        playerCards: c([2, 4, 6, 11, 12, 16, 20, 23, 26, 33]),
      })

      await expect(client1Promise_notifyGameStarted).resolves.toStrictEqual({
        gameState,
        playerCards: c([1, 9, 22, 32, 36, 37, 38, 42, 43, 44]),
      })
    }

    console.log('Step 1')

    await sleep(2500)

    {
      const client1Promise_youHaveBeenKicked = client1.waitForEvent('youHaveBeenKicked')
      const client2Promise_youHaveBeenKicked = client2.waitForEvent('youHaveBeenKicked')
      const client3Promise_youHaveBeenKicked = client3.waitForEvent('youHaveBeenKicked')
      const client4Promise_youHaveBeenKicked = client4.waitForEvent('youHaveBeenKicked')

      await expect(client1Promise_youHaveBeenKicked).resolves.toStrictEqual({ reason: 'inactivity' })
      await expect(client2Promise_youHaveBeenKicked).resolves.toStrictEqual({ reason: 'inactivity' })
      await expect(client3Promise_youHaveBeenKicked).resolves.toStrictEqual({ reason: 'inactivity' })
      await expect(client4Promise_youHaveBeenKicked).resolves.toStrictEqual({ reason: 'inactivity' })
    }

    expect(app.rooms).toBeEmpty()

    expectClientsExpectedEventsQueuesClean(getClients())
  })
})
