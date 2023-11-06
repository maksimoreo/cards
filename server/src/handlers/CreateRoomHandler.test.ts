import { Socket } from 'socket.io'
import { createAppFake } from '../__test__/mocks'
import { createMessageHandlerCaller } from '../__test__/testHelpers'
import User from '../models/User'
import CreateRoomHandler from './CreateRoomHandler'

const call = createMessageHandlerCaller(CreateRoomHandler)

describe('CreateRoomHandler', () => {
  describe('#call', () => {
    function createUserFake(): User {
      return new User({ socket: createSocketFake(), name: 'user' })
    }

    function createSocketFake(): Socket {
      return {
        join: () => {},
        leave: () => {},
      } as unknown as Socket
    }

    describe('with invalid input', () => {
      let input: unknown
      let currentUser: User

      beforeEach(() => {
        currentUser = createUserFake()
      })

      describe('when input is null', () => {
        beforeEach(() => {
          input = null
        })

        it('returns error', async () => {
          expect(await call({ input, currentUser })).toStrictEqual({
            code: 'BAD_REQUEST',
            message: 'Invalid data',
            validationErrors: [
              {
                code: 'invalid_type',
                expected: 'object',
                message: 'Expected object, received null',
                path: [],
                received: 'null',
              },
            ],
          })
        })
      })

      describe('when input does not contain name', () => {
        beforeEach(() => {
          input = {}
        })

        it('returns error', async () => {
          expect(await call({ input, currentUser })).toStrictEqual({
            code: 'BAD_REQUEST',
            message: 'Invalid data',
            validationErrors: [
              { code: 'invalid_type', expected: 'string', message: 'Required', path: ['name'], received: 'undefined' },
            ],
          })
        })
      })

      describe('when input.name is not a string', () => {
        beforeEach(() => {
          input = { name: 1 }
        })

        it('returns error', async () => {
          expect(await call({ input, currentUser })).toStrictEqual({
            code: 'BAD_REQUEST',
            message: 'Invalid data',
            validationErrors: [
              {
                code: 'invalid_type',
                expected: 'string',
                message: 'Expected string, received number',
                path: ['name'],
                received: 'number',
              },
            ],
          })
        })
      })

      describe('when input.name and input.password are not string', () => {
        beforeEach(() => {
          input = { name: 1, password: 1 }
        })

        it('returns error', async () => {
          expect(await call({ input, currentUser })).toStrictEqual({
            code: 'BAD_REQUEST',
            message: 'Invalid data',
            validationErrors: [
              {
                code: 'invalid_type',
                expected: 'string',
                message: 'Expected string, received number',
                path: ['name'],
                received: 'number',
              },
              {
                code: 'invalid_type',
                expected: 'string',
                message: 'Expected string, received number',
                path: ['password'],
                received: 'number',
              },
            ],
          })
        })
      })

      describe('when password is empty string', () => {
        beforeEach(() => {
          input = { name: 'valid_name', password: '' }
        })

        it('does not create room', async () => {
          const currentUser = createUserFake()

          expect(await call({ input, currentUser })).toStrictEqual({
            code: 'BAD_REQUEST',
            message: 'Invalid data',
            validationErrors: [
              {
                code: 'too_small',
                exact: false,
                inclusive: true,
                message: 'String must contain at least 1 character(s)',
                minimum: 1,
                path: ['password'],
                type: 'string',
              },
            ],
          })

          expect(currentUser.room).not.toBeDefined()
        })
      })

      describe('with invalid character in name', () => {
        it('returns error', async () => {
          expect(await call({ input: { name: 'example@email.com' } })).toStrictEqual({
            code: 'BAD_REQUEST',
            message: 'Invalid data',
            validationErrors: [
              {
                code: 'invalid_string',
                message: 'Can only contain letters and digits',
                path: ['name'],
                validation: 'regex',
              },
            ],
          })
        })
      })
    })

    it('creates a new room', async () => {
      const app = createAppFake()
      const currentUser = createUserFake()

      expect(app.rooms.length).toBe(0)

      // Answers 'ok'
      expect(await call({ input: { name: 'new_room' }, app, currentUser })).toMatchObject({ code: 'SUCCESS' })

      // Creates new room
      expect(app.rooms.length).toBe(1)

      const room = app.rooms[0]

      // Joins current user into it
      expect(room.owner).toBe(currentUser)

      // Sets password to null
      expect(room.password).toBe('')
    })

    describe('with password', () => {
      it('creates room with password', async () => {
        const app = createAppFake()
        const currentUser = createUserFake()
        const input = { name: 'new_room', password: 'secret' }

        expect(await call({ input, app, currentUser })).toMatchObject({ code: 'SUCCESS' })

        expect(currentUser.room).toBeDefined()

        expect(app.rooms[0].password).toBe('secret')
      })
    })
  })
})
