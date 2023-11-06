import { createRoom, joinRoom } from '../helpers/clientEventsHelpers'
import { emitEvent } from '../helpers/testHelpers'
import { useApp, useClients } from '../helpers/testHooks'

describe('Game without card pool', () => {
  const getApp = useApp()
  const getClients = useClients(getApp, 2)

  test('Game without card pool', async () => {
    const [client1, client2] = getClients()

    await createRoom(client1, 'game_room')

    await expect(emitEvent(client1, 'startGame', undefined)).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Not enough players',
    })

    await joinRoom(client2, { name: 'game_room', otherClients: [client1] })

    await expect(emitEvent(client2, 'startGame', undefined)).resolves.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Not room owner',
    })

    await expect(emitEvent(client1, 'startGame', undefined)).resolves.toMatchObject({ code: 'SUCCESS' })

    await expect(emitEvent(client1, 'stopGame', undefined)).resolves.toStrictEqual({ code: 'SUCCESS' })
  })
})
