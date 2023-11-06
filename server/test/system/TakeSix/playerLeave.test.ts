import RoomGameTakeSix from '../../../src/lib/RoomGameTakeSix/Game'
import { TakeSix } from '../../../src/lib/TakeSix'
import { c } from '../../../src/lib/TakeSix/__test__/testHelpers'
import { createRoom, joinRoom, leaveCurrentRoom, playCard } from '../helpers/clientEventsHelpers'
import { waitForEvent, waitForNoEvents } from '../helpers/testHelpers'
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

    await expect(createRoom(client1, 'gamers')).resolves.toBeUndefined()
    await expect(joinRoom(client2, { name: 'gamers', otherClients: [client1] })).resolves.toBeUndefined()
    await expect(joinRoom(client3, { name: 'gamers', otherClients: [client1, client2] })).resolves.toBeUndefined()
    await expect(
      joinRoom(client4, { name: 'gamers', otherClients: [client1, client2, client3] }),
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

    // STEP 5
    await expect(
      playCard(client1, { cardValue: 7, otherClients: [client2, client3, client4] }),
    ).resolves.toBeUndefined()

    await expect(leaveCurrentRoom(client3)).resolves.toBeUndefined()

    {
      const client3promise = waitForNoEvents(client3, 'notifyUserPlayedCard')

      await expect(playCard(client2, { cardValue: 20, otherClients: [client1, client4] })).resolves.toBeUndefined()

      await expect(client3promise).resolves.toBeUndefined()
    }

    {
      const client1promise = waitForEvent(client1, 'notifyGameStep')
      const client2promise = waitForEvent(client2, 'notifyGameStep')
      const client4promise = waitForEvent(client4, 'notifyGameStep')
      const client3promiseNotifyUserPlayedCard = waitForNoEvents(client3, 'notifyUserPlayedCard')
      const client3promiseNotifyGameStep = waitForNoEvents(client3, 'notifyGameStep')

      await expect(playCard(client4, { cardValue: 25, otherClients: [client1, client2] })).resolves.toBeUndefined()

      await expect(client3promiseNotifyUserPlayedCard).resolves.toBeUndefined()
      await expect(client3promiseNotifyGameStep).resolves.toBeUndefined()

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

      await expect(client1promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([8, 14, 22, 24, 41]),
      })

      await expect(client2promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([4, 31, 33, 35, 39]),
      })

      await expect(client4promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([17, 30, 32, 43, 44]),
      })
    }

    // STEP 6
    {
      const client3promise = waitForNoEvents(client3, 'notifyUserPlayedCard')

      await expect(playCard(client4, { cardValue: 32, otherClients: [client1, client2] })).resolves.toBeUndefined()

      await expect(client3promise).resolves.toBeUndefined()
    }

    {
      const client3promise = waitForNoEvents(client3, 'notifyUserPlayedCard')

      await expect(playCard(client1, { cardValue: 24, otherClients: [client2, client4] })).resolves.toBeUndefined()

      await expect(client3promise).resolves.toBeUndefined()
    }

    {
      const client1promise = waitForEvent(client1, 'notifyGameStep')
      const client2promise = waitForEvent(client2, 'notifyGameStep')
      const client4promise = waitForEvent(client4, 'notifyGameStep')
      const client3promiseNotifyUserPlayedCard = waitForNoEvents(client3, 'notifyUserPlayedCard')
      const client3promiseNotifyGameStep = waitForNoEvents(client3, 'notifyGameStep')

      await expect(playCard(client2, { cardValue: 31, otherClients: [client1, client4] })).resolves.toBeUndefined()

      await expect(client3promiseNotifyUserPlayedCard).resolves.toBeUndefined()
      await expect(client3promiseNotifyGameStep).resolves.toBeUndefined()

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

      await expect(client1promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([8, 14, 22, 41]),
      })

      await expect(client2promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([4, 33, 35, 39]),
      })

      await expect(client4promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([17, 30, 43, 44]),
      })
    }

    // STEP 7
    {
      const client3promise = waitForNoEvents(client3, 'notifyUserPlayedCard')

      await expect(playCard(client4, { cardValue: 43, otherClients: [client1, client2] })).resolves.toBeUndefined()

      await expect(client3promise).resolves.toBeUndefined()
    }

    await expect(
      joinRoom(client3, { name: 'gamers', otherClients: [client1, client2, client4] }),
    ).resolves.toBeUndefined()

    await expect(
      playCard(client2, { cardValue: 33, otherClients: [client1, client3, client4] }),
    ).resolves.toBeUndefined()

    {
      const client2promise = waitForEvent(client2, 'notifyGameStep')
      const client3promise = waitForEvent(client3, 'notifyGameStep')
      const client4promise = waitForEvent(client4, 'notifyGameStep')
      const client1promiseNotifyGameStep = waitForNoEvents(client1, 'notifyGameStep')

      await expect(leaveCurrentRoom(client1)).resolves.toBeUndefined()

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

      await expect(client2promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([4, 35, 39]),
      })

      await expect(client3promise).resolves.toStrictEqual(sharedData)

      await expect(client4promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([17, 30, 44]),
      })

      await expect(client1promiseNotifyGameStep).resolves.toBeUndefined()
    }

    // The End
    await expect(leaveCurrentRoom(client2)).resolves.toBeUndefined()

    await expect(leaveCurrentRoom(client4)).resolves.toBeUndefined()
  })
})
