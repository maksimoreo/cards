import 'jest-extended'
import { emitEvent, expectClientsListenersClean, waitForEvent, waitForNoEvents } from './helpers/testHelpers'
import { useApp, useClients } from './helpers/testHooks'

describe('Send chat messages to other clients', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 3)

  it('sends message from client to other clients', async () => {
    const [client1, client2, client3] = getClients()

    await expect(emitEvent(client1, 'sendMessage', 'hi')).resolves.toStrictEqual({
      code: 'BAD_REQUEST',
      message: 'Not in a room',
      validationErrors: [],
    })

    await expect(emitEvent(client1, 'createRoom', { name: 'room' })).resolves.toMatchObject({ code: 'SUCCESS' })
    await expect(emitEvent(client2, 'joinRoom', { name: 'room' })).resolves.toMatchObject({
      code: 'SUCCESS',
      data: {
        room: {
          name: 'room',
          owner: {
            id: client1.id,
            name: client1.id,
          },
          users: [
            {
              id: client2.id,
              name: client2.id,
            },
          ],
        },
      },
    })

    await expect(emitEvent(client2, 'joinRoom', { name: 'room' })).resolves.toStrictEqual({
      code: 'BAD_REQUEST',
      message: 'Cannot join room while in another room',
      validationErrors: [],
    })

    {
      const client2Waiter = waitForEvent(client2, 'notifyUserMessage')
      const client3Waiter = waitForNoEvents(client3, 'notifyUserMessage')

      await expect(emitEvent(client1, 'sendMessage', { message: 'hi' })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client3Waiter).resolves.toBeUndefined()
      await expect(client2Waiter).resolves.toStrictEqual({
        message: 'hi',
        user: { id: client1.id, name: client1.id, color: 'D1D5DB' },
      })
    }

    await expect(emitEvent(client3, 'joinRoom', { name: 'room' })).resolves.toMatchObject({
      code: 'SUCCESS',
      data: {
        room: {
          name: 'room',
          owner: { id: client1.id, name: client1.id, color: 'D1D5DB' },
          users: [
            { id: client2.id, name: client2.id, color: 'D1D5DB' },
            { id: client3.id, name: client3.id, color: 'D1D5DB' },
          ],
        },
      },
    })

    {
      const client2Waiter = waitForEvent(client2, 'notifyUserMessage')
      const client3Waiter = waitForEvent(client3, 'notifyUserMessage')

      await expect(emitEvent(client1, 'sendMessage', { message: 'hi' })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client2Waiter).resolves.toStrictEqual({
        message: 'hi',
        user: { id: client1.id, name: client1.id, color: 'D1D5DB' },
      })
      await expect(client3Waiter).resolves.toStrictEqual({
        message: 'hi',
        user: { id: client1.id, name: client1.id, color: 'D1D5DB' },
      })
    }

    await expect(emitEvent(client1, 'leaveCurrentRoom', null)).resolves.toStrictEqual({ code: 'SUCCESS' })

    {
      const client1Waiter = waitForNoEvents(client1, 'notifyUserMessage')
      const client3Waiter = waitForEvent(client3, 'notifyUserMessage')

      await expect(emitEvent(client2, 'sendMessage', { message: 'hi' })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client1Waiter).resolves.toBeUndefined()
      await expect(client3Waiter).resolves.toStrictEqual({
        message: 'hi',
        user: { id: client2.id, name: client2.id, color: 'D1D5DB' },
      })
    }

    expectClientsListenersClean([client1, client2, client3], 'notifyUserMessage')
  })
})
