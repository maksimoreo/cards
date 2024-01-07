import { createRoom, joinRoom } from '../helpers/clientEventsHelpers'
import { expectClientsExpectedEventsQueuesClean } from '../helpers/testHelpers'
import { useApp, useClients } from '../helpers/testHooks'

describe('Game without card pool', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 2)

  test('Game without card pool', async () => {
    const [client1, client2] = getClients()

    console.log('client1 creates room')

    await expect(createRoom(client1, { name: 'gamerooooom' }, { globalClients: [client2] })).resolves.toBeUndefined()

    await expect(client1.emitEvent('startGame', undefined)).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Not enough players',
    })

    await expect(joinRoom(client2, { name: 'gamerooooom' }, { roomClients: [client1] })).resolves.toBeUndefined()

    console.log('client1 starts game')

    await expect(client2.emitEvent('startGame', undefined)).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Not room owner',
    })

    {
      const client2Promise_s2c_gameStarted = client2.waitForEvent('s2c_gameStarted')

      // objects are unfilled bc they r randomized
      const gameData = {
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
          rows: [[{}], [{}], [{}], [{}]],
          stepsLeft: 10,
        },
        playerCards: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
      }

      await expect(client1.emitEvent('startGame', undefined)).resolves.toMatchObject({
        code: 'SUCCESS',
        data: gameData,
      })

      await expect(client2Promise_s2c_gameStarted).resolves.toMatchObject(gameData)
    }

    console.log('client1 stops game')

    {
      const client1Promise_s2c_gameStopped = client1.waitForEvent('s2c_gameStopped')
      const client2Promise_s2c_gameStopped = client2.waitForEvent('s2c_gameStopped')

      await expect(client1.emitEvent('stopGame', undefined)).resolves.toStrictEqual({ code: 'SUCCESS' })

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
        ],
        rows: [[{}], [{}], [{}], [{}]],
        stepsLeft: 10,
      }

      await expect(client1Promise_s2c_gameStopped).resolves.toMatchObject({
        reason: 'roomOwnerAction',
        winners: [],
        game,
      })
      await expect(client2Promise_s2c_gameStopped).resolves.toMatchObject({
        reason: 'roomOwnerAction',
        winners: [],
        game,
      })
    }

    expectClientsExpectedEventsQueuesClean(getClients())
  })
})
