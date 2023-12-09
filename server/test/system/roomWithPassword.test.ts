import 'jest-extended'

import { createRoom, joinRoom } from './helpers/clientEventsHelpers'
import { expectClientsExpectedEventsQueuesClean } from './helpers/testHelpers'
import { useApp, useClients } from './helpers/testHooks'

describe('Room with password', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 2)

  test('Password-protected room', async () => {
    const [client1, client2] = getClients()

    await expect(
      createRoom(client1, { name: 'room', password: 'super_secret' }, { globalClients: [client2] }),
    ).resolves.toBeUndefined()

    await expect(client2.emitEvent('joinRoom', { name: 'room' })).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'This room is protected by password',
    })

    await expect(client2.emitEvent('joinRoom', { name: 'room', password: 'guess' })).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Incorrect password',
    })

    await expect(
      joinRoom(client2, { name: 'room', password: 'super_secret' }, { roomClients: [client1] }),
    ).resolves.toBeUndefined()

    expectClientsExpectedEventsQueuesClean(getClients())
  })
})
