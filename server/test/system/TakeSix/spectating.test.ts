import { c } from '../../../src/lib/TakeSix/__test__/testHelpers'
import { createRoom, joinRoom, leaveCurrentRoom, playCard } from '../helpers/clientEventsHelpers'
import { emitEvent, waitForEvent } from '../helpers/testHelpers'
import { useApp, useClients } from '../helpers/testHooks'

describe('Game spectating', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 6)

  test('Game spectating', async () => {
    const app = getApp()
    const [client1, client2, client3, client4, client5, client6] = getClients()

    await expect(createRoom(client1, 'gamers')).resolves.toBeUndefined()
    await expect(joinRoom(client2, { name: 'gamers', otherClients: [client1] })).resolves.toBeUndefined()
    await expect(joinRoom(client3, { name: 'gamers', otherClients: [client1, client2] })).resolves.toBeUndefined()

    const room = app.rooms[0]

    // Starting the game
    const cardsPool = [
      6, 15, 7, 19, 25, 14, 24, 13, 8, 32, 5, 27, 22, 3, 26, 1, 16, 28, 17, 12, 33, 23, 9, 21, 30, 29, 20, 4, 31, 2, 10,
      34, 18, 11,
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
        rows: [c([10]), c([34]), c([18]), c([11])],
        stepsLeft: 10,
      }

      await expect(
        emitEvent(client1, 'startGame', { cardsPool, stepTimeout: 3000, selectRowTimeout: 3000 }),
      ).resolves.toStrictEqual({
        code: 'SUCCESS',
        data: {
          gameState,
          playerCards: c([6, 7, 8, 13, 14, 15, 19, 24, 25, 32]),
        },
      })

      await expect(client2Promise).resolves.toStrictEqual({
        gameState,
        playerCards: c([1, 3, 5, 12, 16, 17, 22, 26, 27, 28]),
      })

      await expect(client3Promise).resolves.toStrictEqual({
        gameState,
        playerCards: c([2, 4, 9, 20, 21, 23, 29, 30, 31, 33]),
      })
    }

    // Client4 joins before any player selected cards
    {
      const client1Promise = waitForEvent(client1, 'notifyUserJoined')
      const client2Promise = waitForEvent(client2, 'notifyUserJoined')
      const client3Promise = waitForEvent(client3, 'notifyUserJoined')

      await expect(emitEvent(client4, 'joinRoom', { name: 'gamers' })).resolves.toStrictEqual({
        code: 'SUCCESS',
        data: {
          room: {
            id: room.id,
            name: 'gamers',
            users: [
              { id: client2.id, name: client2.id, color: 'D1D5DB' },
              { id: client3.id, name: client3.id, color: 'D1D5DB' },
              { id: client4.id, name: client4.id, color: 'D1D5DB' },
            ],
            owner: { id: client1.id, name: client1.id, color: 'D1D5DB' },
            gameOptions: {
              type: 'takeSix',
              mode: 'normal',
            },
          },
          game: {
            state: {
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
              rows: [c([10]), c([34]), c([18]), c([11])],
              stepsLeft: 10,
            },
            playersWithSelectedCard: [],
          },
        },
      })

      await expect(client1Promise).resolves.toMatchObject({ user: { id: client4.id } })
      await expect(client2Promise).resolves.toMatchObject({ user: { id: client4.id } })
      await expect(client3Promise).resolves.toMatchObject({ user: { id: client4.id } })
    }

    // STEP 1

    await expect(
      playCard(client3, { cardValue: 20, otherClients: [client1, client2, client4] }),
    ).resolves.toBeUndefined()

    await expect(
      playCard(client2, { cardValue: 12, otherClients: [client1, client3, client4] }),
    ).resolves.toBeUndefined()

    // client5 joins when some players have selected their cards
    {
      const client1Promise = waitForEvent(client1, 'notifyUserJoined')
      const client2Promise = waitForEvent(client2, 'notifyUserJoined')
      const client3Promise = waitForEvent(client3, 'notifyUserJoined')
      const client4Promise = waitForEvent(client4, 'notifyUserJoined')

      await expect(emitEvent(client5, 'joinRoom', { name: 'gamers' })).resolves.toStrictEqual({
        code: 'SUCCESS',
        data: {
          room: {
            id: room.id,
            name: 'gamers',
            users: [
              { id: client2.id, name: client2.id, color: 'D1D5DB' },
              { id: client3.id, name: client3.id, color: 'D1D5DB' },
              { id: client4.id, name: client4.id, color: 'D1D5DB' },
              { id: client5.id, name: client5.id, color: 'D1D5DB' },
            ],
            owner: { id: client1.id, name: client1.id, color: 'D1D5DB' },
            gameOptions: {
              type: 'takeSix',
              mode: 'normal',
            },
          },
          game: {
            state: {
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
              rows: [c([10]), c([34]), c([18]), c([11])],
              stepsLeft: 10,
            },
            playersWithSelectedCard: [client2.id, client3.id],
          },
        },
      })

      await expect(client1Promise).resolves.toMatchObject({ user: { id: client5.id } })
      await expect(client2Promise).resolves.toMatchObject({ user: { id: client5.id } })
      await expect(client3Promise).resolves.toMatchObject({ user: { id: client5.id } })
      await expect(client4Promise).resolves.toMatchObject({ user: { id: client5.id } })
    }

    {
      const client1Promise = waitForEvent(client1, 'notifyGameStep')
      const client2Promise = waitForEvent(client2, 'notifyGameStep')
      const client3Promise = waitForEvent(client3, 'notifyGameStep')
      const client4Promise = waitForEvent(client4, 'notifyGameStep')
      const client5Promise = waitForEvent(client5, 'notifyGameStep')

      await expect(
        playCard(client1, { cardValue: 13, otherClients: [client2, client3, client4, client5] }),
      ).resolves.toBeUndefined()

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(13) },
            { playerId: client2.id, card: c(12) },
            { playerId: client3.id, card: c(20) },
          ],
          moves: [
            { playerId: client2.id, card: c(12), rowIndex: 3, takesRow: false },
            { playerId: client1.id, card: c(13), rowIndex: 3, takesRow: false },
            { playerId: client3.id, card: c(20), rowIndex: 2, takesRow: false },
          ],
        },
        gameState: {
          rows: [
            c([10]), //
            c([34]),
            c([18, 20]),
            c([11, 12, 13]),
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

      await expect(client1Promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([6, 7, 8, 14, 15, 19, 24, 25, 32]),
      })

      await expect(client2Promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([1, 3, 5, 16, 17, 22, 26, 27, 28]),
      })

      await expect(client3Promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([2, 4, 9, 21, 23, 29, 30, 31, 33]),
      })

      await expect(client4Promise).resolves.toStrictEqual(sharedData)

      await expect(client5Promise).resolves.toStrictEqual(sharedData)
    }

    // STEP 2

    await expect(
      playCard(client1, { cardValue: 8, otherClients: [client2, client3, client4] }),
    ).resolves.toBeUndefined()

    await expect(
      playCard(client2, { cardValue: 16, otherClients: [client1, client3, client4] }),
    ).resolves.toBeUndefined()

    {
      const client1Promise = waitForEvent(client1, 'notifyGameStep')
      const client2Promise = waitForEvent(client2, 'notifyGameStep')
      const client3Promise = waitForEvent(client3, 'notifyGameStep')
      const client4Promise = waitForEvent(client4, 'notifyGameStep')
      const client5Promise = waitForEvent(client5, 'notifyGameStep')

      await expect(
        playCard(client3, { cardValue: 21, otherClients: [client1, client2, client4] }),
      ).resolves.toBeUndefined()

      const sharedData = {
        step: {
          selectedCards: [
            { playerId: client1.id, card: c(8) },
            { playerId: client2.id, card: c(16) },
            { playerId: client3.id, card: c(21) },
          ],
          waitingPlayer: client1.id,
        },
        gameState: {
          rows: [
            c([10]), //
            c([34]),
            c([18, 20]),
            c([11, 12, 13]),
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
          stepsLeft: 9,
        },
      }

      await expect(client1Promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([6, 7, 8, 14, 15, 19, 24, 25, 32]),
      })

      await expect(client2Promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([1, 3, 5, 16, 17, 22, 26, 27, 28]),
      })

      await expect(client3Promise).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([2, 4, 9, 21, 23, 29, 30, 31, 33]),
      })

      await expect(client4Promise).resolves.toStrictEqual(sharedData)

      await expect(client5Promise).resolves.toStrictEqual(sharedData)
    }

    // STEP 2.1

    // client6 joins while some player selects row
    {
      const client1Promise = waitForEvent(client1, 'notifyUserJoined')
      const client2Promise = waitForEvent(client2, 'notifyUserJoined')
      const client3Promise = waitForEvent(client3, 'notifyUserJoined')
      const client4Promise = waitForEvent(client4, 'notifyUserJoined')
      const client5Promise = waitForEvent(client5, 'notifyUserJoined')

      await expect(emitEvent(client6, 'joinRoom', { name: 'gamers' })).resolves.toStrictEqual({
        code: 'SUCCESS',
        data: {
          room: {
            id: room.id,
            name: 'gamers',
            users: [
              { id: client2.id, name: client2.id, color: 'D1D5DB' },
              { id: client3.id, name: client3.id, color: 'D1D5DB' },
              { id: client4.id, name: client4.id, color: 'D1D5DB' },
              { id: client5.id, name: client5.id, color: 'D1D5DB' },
              { id: client6.id, name: client6.id, color: 'D1D5DB' },
            ],
            owner: { id: client1.id, name: client1.id, color: 'D1D5DB' },
            gameOptions: {
              type: 'takeSix',
              mode: 'normal',
            },
          },
          game: {
            state: {
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
              rows: [
                c([10]), //
                c([34]),
                c([18, 20]),
                c([11, 12, 13]),
              ],
              stepsLeft: 9,
            },
            playersWithSelectedCard: [client1.id, client2.id, client3.id],
            lastStep: {
              selectedCards: [
                { playerId: client1.id, card: c(8) },
                { playerId: client2.id, card: c(16) },
                { playerId: client3.id, card: c(21) },
              ],
              waitingPlayer: client1.id,
            },
          },
        },
      })

      await expect(client1Promise).resolves.toMatchObject({ user: { id: client6.id } })
      await expect(client2Promise).resolves.toMatchObject({ user: { id: client6.id } })
      await expect(client3Promise).resolves.toMatchObject({ user: { id: client6.id } })
      await expect(client4Promise).resolves.toMatchObject({ user: { id: client6.id } })
      await expect(client5Promise).resolves.toMatchObject({ user: { id: client6.id } })
    }

    // Everyone leaves, starting from players
    await expect(leaveCurrentRoom(client2)).resolves.toBeUndefined()
    await expect(leaveCurrentRoom(client3)).resolves.toBeUndefined()
    await expect(leaveCurrentRoom(client4)).resolves.toBeUndefined()
    await expect(leaveCurrentRoom(client1)).resolves.toBeUndefined()
    await expect(leaveCurrentRoom(client5)).resolves.toBeUndefined()
    await expect(leaveCurrentRoom(client6)).resolves.toBeUndefined()
  })
})
