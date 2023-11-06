import 'jest-extended'

import { useApp, useClients } from './helpers/testHooks'
import { emitEvent } from './helpers/testHelpers'
import { createRoom, joinRoom } from './helpers/clientEventsHelpers'

describe('Room with password', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 2)

  test('Password-protected room', async () => {
    const [client1, client2] = getClients()

    await expect(createRoom(client1, 'room', 'super_secret')).resolves.toBeUndefined()

    await expect(emitEvent(client2, 'joinRoom', { name: 'room' })).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'This room is protected by password',
    })

    await expect(emitEvent(client2, 'joinRoom', { name: 'room', password: 'guess' })).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Incorrect password',
    })

    await expect(
      joinRoom(client2, { name: 'room', password: 'super_secret', otherClients: [client1] })
    ).resolves.toBeUndefined()
  })
})
