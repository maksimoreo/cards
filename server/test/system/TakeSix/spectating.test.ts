import { c } from '../../../src/lib/TakeSix/__test__/testHelpers'
import { createRoom, joinRoom, playCard } from '../helpers/clientEventsHelpers'
import { expectClientsExpectedEventsQueuesClean } from '../helpers/testHelpers'
import { useApp, useClients } from '../helpers/testHooks'

describe('Game spectating', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 6)

  test('Game spectating', async () => {
    const app = getApp()
    const [client1, client2, client3, client4, client5, client6] = getClients()

    await expect(
      createRoom(client1, { name: 'gamers' }, { globalClients: [client2, client3, client4, client5, client6] }),
    ).resolves.toBeUndefined()
    await expect(
      joinRoom(
        client2,
        { name: 'gamers' },
        { roomClients: [client1], globalClients: [client3, client4, client5, client6] },
      ),
    ).resolves.toBeUndefined()
    await expect(
      joinRoom(
        client3,
        { name: 'gamers' },
        { roomClients: [client1, client2], globalClients: [client4, client5, client6] },
      ),
    ).resolves.toBeUndefined()

    const room = app.rooms[0]

    // Starting the game
    const cardsPool = [
      6, 15, 7, 19, 25, 14, 24, 13, 8, 32, 5, 27, 22, 3, 26, 1, 16, 28, 17, 12, 33, 23, 9, 21, 30, 29, 20, 4, 31, 2, 10,
      34, 18, 11,
    ]

    {
      const client2Promise_s2c_gameStarted = client2.waitForEvent('s2c_gameStarted')
      const client3Promise_s2c_gameStarted = client3.waitForEvent('s2c_gameStarted')

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
        client1.emitEvent('startGame', { cardsPool, stepTimeout: 3000, selectRowTimeout: 3000 }),
      ).resolves.toStrictEqual({
        code: 'SUCCESS',
        data: {
          gameState,
          playerCards: c([6, 7, 8, 13, 14, 15, 19, 24, 25, 32]),
        },
      })

      await expect(client2Promise_s2c_gameStarted).resolves.toStrictEqual({
        gameState,
        playerCards: c([1, 3, 5, 12, 16, 17, 22, 26, 27, 28]),
      })

      await expect(client3Promise_s2c_gameStarted).resolves.toStrictEqual({
        gameState,
        playerCards: c([2, 4, 9, 20, 21, 23, 29, 30, 31, 33]),
      })
    }

    // Client4 joins before any player selected cards
    {
      const client1Promise_s2c_userJoined = client1.waitForEvent('s2c_userJoined')
      const client2Promise_s2c_userJoined = client2.waitForEvent('s2c_userJoined')
      const client3Promise_s2c_userJoined = client3.waitForEvent('s2c_userJoined')

      const client5Promise_s2c_rooms = client5.waitForEvent('s2c_rooms')
      const client6Promise_s2c_rooms = client6.waitForEvent('s2c_rooms')

      await expect(client4.emitEvent('joinRoom', { name: 'gamers' })).resolves.toStrictEqual({
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
              stepTimeout: 30000,
              playerInactivityStrategy: 'forcePlay',
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

      await expect(client5Promise_s2c_rooms).toResolve()
      await expect(client6Promise_s2c_rooms).toResolve()

      await expect(client1Promise_s2c_userJoined).resolves.toMatchObject({ user: { id: client4.id } })
      await expect(client2Promise_s2c_userJoined).resolves.toMatchObject({ user: { id: client4.id } })
      await expect(client3Promise_s2c_userJoined).resolves.toMatchObject({ user: { id: client4.id } })
    }

    console.log('Step 1')

    await expect(
      playCard(client3, { cardValue: 20, otherClients: [client1, client2, client4] }),
    ).resolves.toBeUndefined()

    await expect(
      playCard(client2, { cardValue: 12, otherClients: [client1, client3, client4] }),
    ).resolves.toBeUndefined()

    // client5 joins when some players have selected their cards
    {
      const client1Promise_s2c_userJoined = client1.waitForEvent('s2c_userJoined')
      const client2Promise_s2c_userJoined = client2.waitForEvent('s2c_userJoined')
      const client3Promise_s2c_userJoined = client3.waitForEvent('s2c_userJoined')
      const client4Promise_s2c_userJoined = client4.waitForEvent('s2c_userJoined')

      const client6Promise_s2c_rooms = client6.waitForEvent('s2c_rooms')

      await expect(client5.emitEvent('joinRoom', { name: 'gamers' })).resolves.toStrictEqual({
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
              stepTimeout: 30000,
              playerInactivityStrategy: 'forcePlay',
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

      await expect(client6Promise_s2c_rooms).toResolve()

      await expect(client1Promise_s2c_userJoined).resolves.toMatchObject({ user: { id: client5.id } })
      await expect(client2Promise_s2c_userJoined).resolves.toMatchObject({ user: { id: client5.id } })
      await expect(client3Promise_s2c_userJoined).resolves.toMatchObject({ user: { id: client5.id } })
      await expect(client4Promise_s2c_userJoined).resolves.toMatchObject({ user: { id: client5.id } })
    }

    {
      const client2Promise_s2c_userPlayedCard = client2.waitForEvent('s2c_userPlayedCard')
      const client3Promise_s2c_userPlayedCard = client3.waitForEvent('s2c_userPlayedCard')
      const client4Promise_s2c_userPlayedCard = client4.waitForEvent('s2c_userPlayedCard')
      const client5Promise_s2c_userPlayedCard = client5.waitForEvent('s2c_userPlayedCard')

      const client1Promise_s2c_gameStep = client1.waitForEvent('s2c_gameStep')
      const client2Promise_s2c_gameStep = client2.waitForEvent('s2c_gameStep')
      const client3Promise_s2c_gameStep = client3.waitForEvent('s2c_gameStep')
      const client4Promise_s2c_gameStep = client4.waitForEvent('s2c_gameStep')
      const client5Promise_s2c_gameStep = client5.waitForEvent('s2c_gameStep')

      await expect(client1.emitEvent('playCard', { card: 13 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client2Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client1.id })
      await expect(client3Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client1.id })
      await expect(client4Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client1.id })
      await expect(client5Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client1.id })

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

      await expect(client1Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([6, 7, 8, 14, 15, 19, 24, 25, 32]),
      })

      await expect(client2Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([1, 3, 5, 16, 17, 22, 26, 27, 28]),
      })

      await expect(client3Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([2, 4, 9, 21, 23, 29, 30, 31, 33]),
      })

      await expect(client4Promise_s2c_gameStep).resolves.toStrictEqual(sharedData)

      await expect(client5Promise_s2c_gameStep).resolves.toStrictEqual(sharedData)
    }

    console.log('Step 2.1')

    await expect(
      playCard(client1, { cardValue: 8, otherClients: [client2, client3, client4, client5] }),
    ).resolves.toBeUndefined()

    await expect(
      playCard(client2, { cardValue: 16, otherClients: [client1, client3, client4, client5] }),
    ).resolves.toBeUndefined()

    {
      const client1Promise_s2c_userPlayedCard = client1.waitForEvent('s2c_userPlayedCard')
      const client2Promise_s2c_userPlayedCard = client2.waitForEvent('s2c_userPlayedCard')
      const client4Promise_s2c_userPlayedCard = client4.waitForEvent('s2c_userPlayedCard')
      const client5Promise_s2c_userPlayedCard = client5.waitForEvent('s2c_userPlayedCard')

      const client1Promise_s2c_gameStep = client1.waitForEvent('s2c_gameStep')
      const client2Promise_s2c_gameStep = client2.waitForEvent('s2c_gameStep')
      const client3Promise_s2c_gameStep = client3.waitForEvent('s2c_gameStep')
      const client4Promise_s2c_gameStep = client4.waitForEvent('s2c_gameStep')
      const client5Promise_s2c_gameStep = client5.waitForEvent('s2c_gameStep')

      await expect(client3.emitEvent('playCard', { card: 21 })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client3.id })
      await expect(client2Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client3.id })
      await expect(client4Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client3.id })
      await expect(client5Promise_s2c_userPlayedCard).resolves.toStrictEqual({ userId: client3.id })

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

      await expect(client1Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([6, 7, 8, 14, 15, 19, 24, 25, 32]),
      })

      await expect(client2Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([1, 3, 5, 16, 17, 22, 26, 27, 28]),
      })

      await expect(client3Promise_s2c_gameStep).resolves.toStrictEqual({
        ...sharedData,
        playerCards: c([2, 4, 9, 21, 23, 29, 30, 31, 33]),
      })

      await expect(client4Promise_s2c_gameStep).resolves.toStrictEqual(sharedData)

      await expect(client5Promise_s2c_gameStep).resolves.toStrictEqual(sharedData)
    }

    console.log('Step 2.2')

    // client6 joins while some player selects row
    {
      const client1Promise = client1.waitForEvent('s2c_userJoined')
      const client2Promise = client2.waitForEvent('s2c_userJoined')
      const client3Promise = client3.waitForEvent('s2c_userJoined')
      const client4Promise = client4.waitForEvent('s2c_userJoined')
      const client5Promise = client5.waitForEvent('s2c_userJoined')

      await expect(client6.emitEvent('joinRoom', { name: 'gamers' })).resolves.toStrictEqual({
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
              stepTimeout: 30000,
              playerInactivityStrategy: 'forcePlay',
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

    console.log('client2 leaves')

    {
      const client2Promise_s2c_rooms = client2.waitForEvent('s2c_rooms')
      const client1Promise_s2c_usersLeft = client1.waitForEvent('s2c_usersLeft')
      const client3Promise_s2c_usersLeft = client3.waitForEvent('s2c_usersLeft')
      const client4Promise_s2c_usersLeft = client4.waitForEvent('s2c_usersLeft')
      const client5Promise_s2c_usersLeft = client5.waitForEvent('s2c_usersLeft')
      const client6Promise_s2c_usersLeft = client6.waitForEvent('s2c_usersLeft')

      await expect(client2.emitEvent('leaveCurrentRoom', null)).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client2Promise_s2c_rooms).toResolve()
      await expect(client1Promise_s2c_usersLeft).resolves.toMatchObject({ userIds: [client2.id] })
      await expect(client3Promise_s2c_usersLeft).resolves.toMatchObject({ userIds: [client2.id] })
      await expect(client4Promise_s2c_usersLeft).resolves.toMatchObject({ userIds: [client2.id] })
      await expect(client5Promise_s2c_usersLeft).resolves.toMatchObject({ userIds: [client2.id] })
      await expect(client6Promise_s2c_usersLeft).resolves.toMatchObject({ userIds: [client2.id] })
    }

    console.log('client3 leaves')

    {
      const client2Promise_s2c_rooms = client2.waitForEvent('s2c_rooms')
      const client3Promise_s2c_rooms = client3.waitForEvent('s2c_rooms')
      const client1Promise_s2c_usersLeft = client1.waitForEvent('s2c_usersLeft')
      const client4Promise_s2c_usersLeft = client4.waitForEvent('s2c_usersLeft')
      const client5Promise_s2c_usersLeft = client5.waitForEvent('s2c_usersLeft')
      const client6Promise_s2c_usersLeft = client6.waitForEvent('s2c_usersLeft')
      const client1Promise_s2c_gameStopped = client1.waitForEvent('s2c_gameStopped')
      const client4Promise_s2c_gameStopped = client4.waitForEvent('s2c_gameStopped')
      const client5Promise_s2c_gameStopped = client5.waitForEvent('s2c_gameStopped')
      const client6Promise_s2c_gameStopped = client6.waitForEvent('s2c_gameStopped')

      await expect(client3.emitEvent('leaveCurrentRoom', null)).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client2Promise_s2c_rooms).toResolve()
      await expect(client3Promise_s2c_rooms).toResolve()

      await expect(client1Promise_s2c_gameStopped).toResolve()
      await expect(client4Promise_s2c_gameStopped).toResolve()
      await expect(client5Promise_s2c_gameStopped).toResolve()
      await expect(client6Promise_s2c_gameStopped).toResolve()

      await expect(client1Promise_s2c_usersLeft).resolves.toMatchObject({ userIds: [client3.id] })
      await expect(client4Promise_s2c_usersLeft).resolves.toMatchObject({ userIds: [client3.id] })
      await expect(client5Promise_s2c_usersLeft).resolves.toMatchObject({ userIds: [client3.id] })
      await expect(client6Promise_s2c_usersLeft).resolves.toMatchObject({ userIds: [client3.id] })
    }

    console.log('client4 leaves')

    {
      const client2Promise_s2c_rooms = client2.waitForEvent('s2c_rooms')
      const client3Promise_s2c_rooms = client3.waitForEvent('s2c_rooms')
      const client4Promise_s2c_rooms = client4.waitForEvent('s2c_rooms')
      const client1Promise_s2c_usersLeft = client1.waitForEvent('s2c_usersLeft')
      const client5Promise_s2c_usersLeft = client5.waitForEvent('s2c_usersLeft')
      const client6Promise_s2c_usersLeft = client6.waitForEvent('s2c_usersLeft')

      await expect(client4.emitEvent('leaveCurrentRoom', null)).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client2Promise_s2c_rooms).toResolve()
      await expect(client3Promise_s2c_rooms).toResolve()
      await expect(client4Promise_s2c_rooms).toResolve()
      await expect(client1Promise_s2c_usersLeft).resolves.toMatchObject({ userIds: [client4.id] })
      await expect(client5Promise_s2c_usersLeft).resolves.toMatchObject({ userIds: [client4.id] })
      await expect(client6Promise_s2c_usersLeft).resolves.toMatchObject({ userIds: [client4.id] })
    }

    console.log('client1 leaves')

    {
      const client1Promise_s2c_rooms = client1.waitForEvent('s2c_rooms')
      const client2Promise_s2c_rooms = client2.waitForEvent('s2c_rooms')
      const client3Promise_s2c_rooms = client3.waitForEvent('s2c_rooms')
      const client4Promise_s2c_rooms = client4.waitForEvent('s2c_rooms')
      const client5Promise_s2c_usersLeft = client5.waitForEvent('s2c_usersLeft')
      const client6Promise_s2c_usersLeft = client6.waitForEvent('s2c_usersLeft')

      await expect(client1.emitEvent('leaveCurrentRoom', null)).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Promise_s2c_rooms).toResolve()
      await expect(client2Promise_s2c_rooms).toResolve()
      await expect(client3Promise_s2c_rooms).toResolve()
      await expect(client4Promise_s2c_rooms).toResolve()
      await expect(client5Promise_s2c_usersLeft).resolves.toMatchObject({ newRoomState: { owner: { id: client5.id } } })
      await expect(client6Promise_s2c_usersLeft).resolves.toMatchObject({ newRoomState: { owner: { id: client5.id } } })
    }

    console.log('client5 leaves')

    {
      const client1Promise_s2c_rooms = client1.waitForEvent('s2c_rooms')
      const client2Promise_s2c_rooms = client2.waitForEvent('s2c_rooms')
      const client3Promise_s2c_rooms = client3.waitForEvent('s2c_rooms')
      const client4Promise_s2c_rooms = client4.waitForEvent('s2c_rooms')
      const client5Promise_s2c_rooms = client5.waitForEvent('s2c_rooms')
      const client6Promise_s2c_usersLeft = client6.waitForEvent('s2c_usersLeft')

      await expect(client5.emitEvent('leaveCurrentRoom', null)).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Promise_s2c_rooms).toResolve()
      await expect(client2Promise_s2c_rooms).toResolve()
      await expect(client3Promise_s2c_rooms).toResolve()
      await expect(client4Promise_s2c_rooms).toResolve()
      await expect(client5Promise_s2c_rooms).toResolve()
      await expect(client6Promise_s2c_usersLeft).resolves.toMatchObject({ newRoomState: { owner: { id: client6.id } } })
    }

    console.log('client6 leaves')

    {
      const client1Promise_s2c_rooms = client1.waitForEvent('s2c_rooms')
      const client2Promise_s2c_rooms = client2.waitForEvent('s2c_rooms')
      const client3Promise_s2c_rooms = client3.waitForEvent('s2c_rooms')
      const client4Promise_s2c_rooms = client4.waitForEvent('s2c_rooms')
      const client5Promise_s2c_rooms = client5.waitForEvent('s2c_rooms')
      const client6Promise_s2c_rooms = client6.waitForEvent('s2c_rooms')

      await expect(client6.emitEvent('leaveCurrentRoom', null)).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Promise_s2c_rooms).toResolve()
      await expect(client2Promise_s2c_rooms).toResolve()
      await expect(client3Promise_s2c_rooms).toResolve()
      await expect(client4Promise_s2c_rooms).toResolve()
      await expect(client5Promise_s2c_rooms).toResolve()
      await expect(client6Promise_s2c_rooms).toResolve()
    }

    expectClientsExpectedEventsQueuesClean(getClients())
  })
})
