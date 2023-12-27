import { Socket } from 'socket.io'
import App from '../App'
import { callMessageHandler, callMessageHandlerOptions } from '../__test__/testHelpers'
import RoomGameTakeSix from '../lib/RoomGameTakeSix/Game'
import Room from '../models/Room'
import User from '../models/User'
import StartGameHandler from './StartGameHandler'

function callStartGameHandler(opts?: callMessageHandlerOptions): Promise<unknown> {
  return callMessageHandler(StartGameHandler, opts)
}

describe('StartGameHandler', () => {
  describe('#call', () => {
    let currentUser: User

    beforeEach(() => {
      currentUser = new User({ socket: { id: 1 } as unknown as Socket, name: 'user 1' })
    })

    describe('when not in a room', () => {
      it('returns error', async () => {
        await expect(callStartGameHandler()).resolves.toMatchObject({
          code: 'BAD_REQUEST',
          message: 'Not in a room',
        })
      })
    })

    describe('when in a room as member', () => {
      let roomOwner
      let room

      beforeEach(() => {
        roomOwner = new User({ socket: { id: 2 } as unknown as Socket, name: 'user 2' })
        room = new Room({ app: {} as App, name: 'room', owner: roomOwner })

        roomOwner.room = room
        room.users.push(currentUser)
        currentUser.room = room
      })

      it('returns error', async () => {
        await expect(callStartGameHandler({ currentUser })).resolves.toMatchObject({
          code: 'BAD_REQUEST',
          message: 'Not room owner',
        })
      })
    })

    describe('when in a room as owner', () => {
      let room: Room

      beforeEach(() => {
        room = new Room({ app: {} as App, name: 'room', owner: currentUser })
        currentUser.room = room
      })

      it('returns error', async () => {
        await expect(callStartGameHandler({ currentUser })).resolves.toMatchObject({
          code: 'BAD_REQUEST',
          message: 'Not enough players',
        })
      })

      describe('with other users in the room', () => {
        let otherUser

        beforeEach(() => {
          otherUser = new User({ socket: { id: 2, emit: jest.fn() } as unknown as Socket, name: 'user 2' })

          room.users.push(otherUser)
          otherUser.room = room
        })

        // TODO: This test calls setTimeout(...)
        // it('returns ok', async () => {
        //   await expect(callStartGameHandler({ currentUser })).resolves.toMatchObject({
        //     success: true,
        //   })
        // })

        // TODO: This test calls setTimeout(...)
        // it('starts a game', async () => {
        //   await callStartGameHandler({ currentUser })

        //   expect(room.game).toBeDefined()
        // })

        describe('when game is already running', () => {
          beforeEach(() => {
            room.game = {} as RoomGameTakeSix
          })

          it('returns error', async () => {
            await expect(callStartGameHandler({ currentUser })).resolves.toMatchObject({
              code: 'BAD_REQUEST',
              message: 'Game is already running',
            })
          })
        })

        // TODO: This test calls setTimeout(...)
        // describe('with input as null', () => {
        //   it('returns ok', async () => {
        //     await expect(callStartGameHandler({ currentUser, input: null })).resolves.toMatchObject({
        //       success: true,
        //     })
        //   })
        // })

        describe('with cardsPool', () => {
          describe('when cardsPool is too small', () => {
            it('returns error', async () => {
              const cardsPool = [1, 2, 3, 4]

              await expect(callStartGameHandler({ currentUser, input: { cardsPool } })).resolves.toMatchObject({
                code: 'BAD_REQUEST',
                message: 'Invalid data',
                validationErrors: [
                  { message: 'Not enough cards in cardsPool', minimum: 24, code: 'too_small', inclusive: true },
                ],
              })
            })
          })

          describe('when cardsPool is not an array', () => {
            it('returns error', async () => {
              const cardsPool = new Set([1, 2, 3, 4])

              await expect(callStartGameHandler({ currentUser, input: { cardsPool } })).resolves.toMatchObject({
                code: 'BAD_REQUEST',
                message: 'Invalid data',
                validationErrors: [{ code: 'invalid_type', expected: 'array', path: ['cardsPool'] }],
              })
            })
          })

          describe('when cardsPool contains duplicate values', () => {
            it('returns error', async () => {
              const cardsPool = [1, 1, 2, 3, 4]

              await expect(callStartGameHandler({ currentUser, input: { cardsPool } })).resolves.toMatchObject({
                code: 'BAD_REQUEST',
                message: 'Invalid data',
                validationErrors: [{ message: 'Must contain unique values', path: ['cardsPool'] }],
              })
            })
          })

          // TODO: This test calls setTimeout(...)
          // describe('when cardsPool is valid', () => {
          //   it('returns success', async () => {
          //     const cardsPool = [12, 13, 4, 15, 2, 11, 6, 22, 18, 5, 1, 10, 23, 8, 19, 16, 20, 24, 17, 9, 14, 21, 3, 7]

          //     await expect(callStartGameHandler({ currentUser, input: { cardsPool } })).resolves.toMatchObject({
          //       success: true,
          //     })
          //   })
          // })
        })
      })
    })
  })
})
