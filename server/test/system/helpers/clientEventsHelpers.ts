import { Socket } from 'socket.io-client'
import { TestClient } from './TestClient'
import { emitEvent } from './testHelpers'

export function sendMessage(client: Socket, message: string): Promise<void> {
  return expect(emitEvent(client, 'sendMessage', message)).resolves.toBe('ok')
}

export async function createRoom(
  client: TestClient,
  { name, password }: { readonly name: string; readonly password?: string },
  { globalClients }: { readonly globalClients: readonly TestClient[] },
): Promise<void> {
  const globalClientsPromises = globalClients.map((client) => client.waitForEvent('rooms'))

  await expect(emitEvent(client.socket, 'createRoom', { name, password })).resolves.toMatchObject({ code: 'SUCCESS' })

  await expect(Promise.all(globalClientsPromises)).resolves.toMatchObject(
    globalClients.map(() => ({ rooms: [{ name }] })),
  )
}

export async function joinRoom(
  client: TestClient,
  { name, password }: { name: string; password?: string },
  { roomClients, globalClients }: { roomClients: readonly TestClient[]; globalClients?: readonly TestClient[] },
): Promise<void> {
  const roomClientsPromises = roomClients.map((client) => client.waitForEvent('notifyUserJoined'))
  const globalClientsPromises = (globalClients || []).map((client) => client.waitForEvent('rooms'))

  await expect(client.emitEvent('joinRoom', { name, password })).resolves.toMatchObject({
    code: 'SUCCESS',
    data: {
      room: {
        name,
      },
    },
  })

  await expect(Promise.all(roomClientsPromises)).resolves.toMatchObject(
    roomClients.map(() => ({ user: { id: client.id } })),
  )

  await expect(Promise.all(globalClientsPromises)).toResolve()
}

export async function leaveCurrentRoom(
  client: TestClient,
  { asOwner }: { asOwner: boolean },
  {
    roomClients,
    globalClients,
  }: { readonly roomClients: readonly TestClient[]; readonly globalClients: readonly TestClient[] },
): Promise<void> {
  const expectedEventForRoomClients = asOwner ? 'notifyOwnerLeft' : 'notifyUserLeft'
  const roomClientsPromises = roomClients.map((client) => client.waitForEvent(expectedEventForRoomClients))

  // Note: client that leaves the room also received 'rooms' event
  const globalClientsPromises = [...globalClients, client].map((client) => client.waitForEvent('rooms'))

  await expect(client.emitEvent('leaveCurrentRoom', {})).resolves.toStrictEqual({ code: 'SUCCESS' })

  await expect(Promise.all(roomClientsPromises)).toResolve()
  await expect(Promise.all(globalClientsPromises)).toResolve()
}

export async function startGame(client: Socket, cardsPool?: number[]): Promise<unknown> {
  const data = { cardsPool, stepTimeout: 3000, selectRowTimeout: 3000 }
  const response = await emitEvent(client, 'startGame', data)

  expect(response).toMatchObject({ success: true })

  return response
}

export async function playCard(
  client: TestClient,
  { cardValue, otherClients }: { cardValue: number; otherClients: readonly TestClient[] },
): Promise<void> {
  const otherClientPromises = otherClients.map((client) => client.waitForEvent('notifyUserPlayedCard'))

  await expect(client.emitEvent('playCard', { card: cardValue })).resolves.toStrictEqual({ code: 'SUCCESS' })

  await expect(Promise.all(otherClientPromises)).resolves.toEqual(otherClients.map(() => ({ userId: client.id })))
}

export function selectRow(client: Socket, { rowIndex }: { rowIndex: number }): Promise<void> {
  return expect(emitEvent(client, 'selectRow', { rowIndex })).resolves.toStrictEqual({ success: true })
}

export default {
  sendMessage,
  createRoom,
  joinRoom,
}
