import RoomGameTakeSix from '../../../src/lib/RoomGameTakeSix/Game'
import { TakeSix } from '../../../src/lib/TakeSix'
import { c } from '../../../src/lib/TakeSix/__test__/testHelpers'
import { createRoom, joinRoom, leaveCurrentRoom, playCard } from '../helpers/clientEventsHelpers'
import { expectClientsExpectedEventsQueuesClean } from '../helpers/testHelpers'
import { useApp, useClients } from '../helpers/testHooks'

// Card set:
// 37, 28,  9, 12,  6, 29,  3, 16, 21,  2,
// 24,  8, 22,  7, 14, 41, 17, 43,  1, 40,
// 39, 35, 33, 31,  4, 20, 26, 13, 15, 27,
//  5, 11, 38, 36, 10, 23, 18, 34, 42, 19,
// 25, 30, 32, 44

describe('Player leaving behavior', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 4)

  jest.setTimeout(20000)

  test('while waiting for cards', async () => {
    const app = getApp()
    const [client1, client2, client3, client4] = getClients()

    await expect(
      createRoom(client1, { name: 'gamers' }, { globalClients: [client2, client3, client4] }),
    ).resolves.toBeUndefined()
    await expect(
      joinRoom(client2, { name: 'gamers' }, { roomClients: [client1], globalClients: [client3, client4] }),
    ).resolves.toBeUndefined()
    await expect(
      joinRoom(client3, { name: 'gamers' }, { roomClients: [client1, client2], globalClients: [client4] }),
    ).resolves.toBeUndefined()
    await expect(
      joinRoom(client4, { name: 'gamers' }, { roomClients: [client1, client2, client3] }),
    ).resolves.toBeUndefined()

    const room = app.rooms[0]
    const takeSixGame = new TakeSix(
      {
        rows: [
          c([9, 12, 28, 37]), //
          c([6, 29]),
          c([3]),
          c([2, 16, 21]),
        ],
        players: [
          { id: client1.id, penaltyPoints: 1, cards: c([7, 8, 14, 22, 24, 41]) },
          { id: client2.id, penaltyPoints: 2, cards: c([4, 20, 31, 33, 35, 39]) },
          { id: client3.id, penaltyPoints: 3, cards: c([5, 10, 11, 23, 36, 38]) },
          { id: client4.id, penaltyPoints: 4, cards: c([17, 25, 30, 32, 43, 44]) },
        ],
      },
      5,
    )

    room.game = new RoomGameTakeSix({
      room,
      game: takeSixGame,
      stepTimeout: 50000,
      selectRowTimeout: 50000,
    })

    room.game.startGame()

    console.log('Step 5')

    await expect(
      playCard(client1, { cardValue: 7, otherClients: [client2, client3, client4] }),
    ).resolves.toBeUndefined()

    await expect(
      leaveCurrentRoom(client3, { roomClients: [client1, client2, client4], globalClients: [] }),
    ).resolves.toBeUndefined()

    await expect(playCard(client2, { cardValue: 20, otherClients: [client1, client4] })).resolves.toBeUndefined()

    {
      const client1Promise_s2c_userPlayedCard = client1.waitForEvent('s2c_userPlayedCard')
      const client2Promise_s2c_userPlayedCard = client2.waitForEvent('s2c_userPlayedCard')
      const client1Promise_s2c_gameStep = client1.waitForEvent('s2c_gameStep')
      const client2Promise_s2c_gameStep = client2.waitForEvent('s2c_gameStep')
      const client4Promise_s2c_gameStep = client4.waitForEvent('s2c_gameStep')

      await expect(client4.emitEvent('playCard', { card: 25 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client4.id })
      await expect(client2Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client4.id })

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(7) },
            { playerId: client2.id, card: c(20) },
            { playerId: client4.id, card: c(25) },
          ],
          moves: [
            { playerId: client1.id, card: c(7), rowIndex: 2, takesRow: false },
            { playerId: client2.id, card: c(20), rowIndex: 2, takesRow: false },
            { playerId: client4.id, card: c(25), rowIndex: 3, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([9, 12, 28, 37]), //
            c([6, 29]),
            c([3, 7, 20]),
            c([2, 16, 21, 25]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: false,
              penaltyPoints: 1,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: false,
              penaltyPoints: 2,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
            {
              id: client3.id,
              hasSelectedCard: false,
              penaltyPoints: 3,
              isActive: false,
              user: { id: client3.id, color: 'D1D5DB', name: client3.id },
            },
            {
              id: client4.id,
              hasSelectedCard: false,
              penaltyPoints: 4,
              isActive: true,
              user: { id: client4.id, color: 'D1D5DB', name: client4.id },
            },
          ],
          stepsLeft: 5,
        },
      }

      await expect(client1Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([8, 14, 22, 24, 41]),
      })

      await expect(client2Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([4, 31, 33, 35, 39]),
      })

      await expect(client4Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([17, 30, 32, 43, 44]),
      })
    }

    console.log('Step 6')

    await expect(playCard(client4, { cardValue: 32, otherClients: [client1, client2] })).resolves.toBeUndefined()

    await expect(playCard(client1, { cardValue: 24, otherClients: [client2, client4] })).resolves.toBeUndefined()

    {
      const client1Promise_s2c_userPlayedCard = client1.waitForEvent('s2c_userPlayedCard')
      const client4Promise_s2c_userPlayedCard = client4.waitForEvent('s2c_userPlayedCard')
      const client1Promise_s2c_gameStep = client1.waitForEvent('s2c_gameStep')
      const client2Promise_s2c_gameStep = client2.waitForEvent('s2c_gameStep')
      const client4Promise_s2c_gameStep = client4.waitForEvent('s2c_gameStep')

      await expect(client2.emitEvent('playCard', { card: 31 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client2.id })
      await expect(client4Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client2.id })

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(24) },
            { playerId: client2.id, card: c(31) },
            { playerId: client4.id, card: c(32) },
          ],
          moves: [
            { playerId: client1.id, card: c(24), rowIndex: 2, takesRow: false },
            { playerId: client2.id, card: c(31), rowIndex: 1, takesRow: false },
            { playerId: client4.id, card: c(32), rowIndex: 1, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([9, 12, 28, 37]), //
            c([6, 29, 31, 32]),
            c([3, 7, 20, 24]),
            c([2, 16, 21, 25]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: false,
              penaltyPoints: 1,
              isActive: true,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: false,
              penaltyPoints: 2,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
            {
              id: client3.id,
              hasSelectedCard: false,
              penaltyPoints: 3,
              isActive: false,
              user: { id: client3.id, color: 'D1D5DB', name: client3.id },
            },
            {
              id: client4.id,
              hasSelectedCard: false,
              penaltyPoints: 4,
              isActive: true,
              user: { id: client4.id, color: 'D1D5DB', name: client4.id },
            },
          ],
          stepsLeft: 4,
        },
      }

      await expect(client1Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([8, 14, 22, 41]),
      })

      await expect(client2Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([4, 33, 35, 39]),
      })

      await expect(client4Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([17, 30, 43, 44]),
      })
    }

    console.log('Step 7')

    await expect(playCard(client4, { cardValue: 43, otherClients: [client1, client2] })).resolves.toBeUndefined()

    await expect(
      joinRoom(client3, { name: 'gamers' }, { roomClients: [client1, client2, client4] }),
    ).resolves.toBeUndefined()

    await expect(
      playCard(client2, { cardValue: 33, otherClients: [client1, client3, client4] }),
    ).resolves.toBeUndefined()

    {
      const client1Promise_s2c_rooms = client1.waitForEvent('s2c_rooms')
      const client2Promise_s2c_usersLeft = client2.waitForEvent('s2c_usersLeft')
      const client3Promise_s2c_usersLeft = client3.waitForEvent('s2c_usersLeft')
      const client4Promise_s2c_usersLeft = client4.waitForEvent('s2c_usersLeft')
      const client2Promise_s2c_gameStep = client2.waitForEvent('s2c_gameStep')
      const client3Promise_s2c_gameStep = client3.waitForEvent('s2c_gameStep')
      const client4Promise_s2c_gameStep = client4.waitForEvent('s2c_gameStep')

      await expect(client1.emitEvent('leaveCurrentRoom', {})).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Promise_s2c_rooms).toResolve()
      await expect(client2Promise_s2c_usersLeft).resolves.toMatchObject({ newRoomState: { owner: { id: client2.id } } })
      await expect(client3Promise_s2c_usersLeft).resolves.toMatchObject({ newRoomState: { owner: { id: client2.id } } })
      await expect(client4Promise_s2c_usersLeft).resolves.toMatchObject({ newRoomState: { owner: { id: client2.id } } })

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client2.id, card: c(33) },
            { playerId: client4.id, card: c(43) },
          ],
          moves: [
            { playerId: client2.id, card: c(33), rowIndex: 1, takesRow: false },
            { playerId: client4.id, card: c(43), rowIndex: 0, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([9, 12, 28, 37, 43]), //
            c([6, 29, 31, 32, 33]),
            c([3, 7, 20, 24]),
            c([2, 16, 21, 25]),
          ],
          players: [
            {
              id: client1.id,
              hasSelectedCard: false,
              penaltyPoints: 1,
              isActive: false,
              user: { id: client1.id, color: 'D1D5DB', name: client1.id },
            },
            {
              id: client2.id,
              hasSelectedCard: false,
              penaltyPoints: 2,
              isActive: true,
              user: { id: client2.id, color: 'D1D5DB', name: client2.id },
            },
            {
              id: client3.id,
              hasSelectedCard: false,
              penaltyPoints: 3,
              isActive: false,
              user: { id: client3.id, color: 'D1D5DB', name: client3.id },
            },
            {
              id: client4.id,
              hasSelectedCard: false,
              penaltyPoints: 4,
              isActive: true,
              user: { id: client4.id, color: 'D1D5DB', name: client4.id },
            },
          ],
          stepsLeft: 3,
        },
      }

      await expect(client2Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([4, 35, 39]),
      })

      await expect(client3Promise_s2c_gameStep).resolves.toStrictEqual(sharedData)

      await expect(client4Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([17, 30, 44]),
      })
    }

    console.log('END')

    {
      const client1Promise_s2c_rooms = client1.waitForEvent('s2c_rooms')
      const client2Promise_s2c_rooms = client2.waitForEvent('s2c_rooms')
      const client3Promise_s2c_usersLeft = client3.waitForEvent('s2c_usersLeft')
      const client4Promise_s2c_usersLeft = client4.waitForEvent('s2c_usersLeft')
      const client3Promise_s2c_gameStopped = client3.waitForEvent('s2c_gameStopped')
      const client4Promise_s2c_gameStopped = client4.waitForEvent('s2c_gameStopped')

      await expect(client2.emitEvent('leaveCurrentRoom', {})).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client3Promise_s2c_usersLeft).resolves.toMatchObject({ newRoomState: { owner: { id: client4.id } } })
      await expect(client4Promise_s2c_usersLeft).resolves.toMatchObject({ newRoomState: { owner: { id: client4.id } } })
      await expect(client3Promise_s2c_gameStopped).resolves.toStrictEqual({ reason: 'playerLeft', winners: [] })
      await expect(client4Promise_s2c_gameStopped).resolves.toStrictEqual({ reason: 'playerLeft', winners: [] })
      await expect(client1Promise_s2c_rooms).toResolve()
      await expect(client2Promise_s2c_rooms).toResolve()
    }

    await expect(
      leaveCurrentRoom(client4, { roomClients: [client3], globalClients: [client1, client2] }),
    ).resolves.toBeUndefined()
    await expect(
      leaveCurrentRoom(client3, { roomClients: [], globalClients: [client1, client2, client4] }),
    ).resolves.toBeUndefined()

    expectClientsExpectedEventsQueuesClean(getClients())
  })
})
