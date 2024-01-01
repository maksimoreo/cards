import 'jest-extended'
import { createRoom, joinRoom, leaveCurrentRoom } from './helpers/clientEventsHelpers'
import { expectClientsExpectedEventsQueuesClean } from './helpers/testHelpers'
import { useApp, useClients } from './helpers/testHooks'

describe('Send chat messages to other clients', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 3)

  it('sends message from client to other clients', async () => {
    const [client1, client2, client3] = getClients()

    await expect(client1.emitEvent('sendMessage', 'hi')).resolves.toStrictEqual({
      code: 'BAD_REQUEST',
      message: 'Not in a room',
      validationErrors: [],
    })

    await expect(createRoom(client1, { name: 'room' }, { globalClients: [client2, client3] })).resolves.toBeUndefined()
    await expect(
      joinRoom(client2, { name: 'room' }, { roomClients: [client1], globalClients: [client3] }),
    ).resolves.toBeUndefined()

    await expect(client2.emitEvent('joinRoom', { name: 'room' })).resolves.toStrictEqual({
      code: 'BAD_REQUEST',
      message: 'Cannot join room while in another room',
      validationErrors: [],
    })

    {
      const client2Promise_s2c_userMessage = client2.waitForEvent('s2c_userMessage')

      await expect(client1.emitEvent('sendMessage', { message: 'hi' })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client2Promise_s2c_userMessage).resolves.toStrictEqual({
        message: 'hi',
        user: { id: client1.id, name: client1.id, color: 'D1D5DB' },
      })
    }

    await expect(
      joinRoom(client3, { name: 'room' }, { roomClients: [client1, client2], globalClients: [] }),
    ).resolves.toBeUndefined()

    {
      const client2Promise_s2c_userMessage = client2.waitForEvent('s2c_userMessage')
      const client3Promise_s2c_userMessage = client3.waitForEvent('s2c_userMessage')

      await expect(client1.emitEvent('sendMessage', { message: 'hi' })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client2Promise_s2c_userMessage).resolves.toStrictEqual({
        message: 'hi',
        user: { id: client1.id, name: client1.id, color: 'D1D5DB' },
      })
      await expect(client3Promise_s2c_userMessage).resolves.toStrictEqual({
        message: 'hi',
        user: { id: client1.id, name: client1.id, color: 'D1D5DB' },
      })
    }

    await expect(
      leaveCurrentRoom(client1, { roomClients: [client2, client3], globalClients: [] }),
    ).resolves.toBeUndefined()

    {
      const client3Promise_s2c_userMessage = client3.waitForEvent('s2c_userMessage')

      await expect(client2.emitEvent('sendMessage', { message: 'hi' })).resolves.toStrictEqual({ code: 'SUCCESS' })

      await expect(client3Promise_s2c_userMessage).resolves.toStrictEqual({
        message: 'hi',
        user: { id: client2.id, name: client2.id, color: 'D1D5DB' },
      })
    }

    expectClientsExpectedEventsQueuesClean(getClients())
  })
})
