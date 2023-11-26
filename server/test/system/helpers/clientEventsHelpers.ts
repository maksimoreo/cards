import { Socket } from 'socket.io-client'
import { emitEvent, waitForEvent } from './testHelpers'

export function sendMessage(client: Socket, message: string): Promise<void> {
  return expect(emitEvent(client, 'sendMessage', message)).resolves.toBe('ok')
}

export async function createRoom(client: Socket, name: string, password?: string): Promise<void> {
  await expect(emitEvent(client, 'createRoom', { name, password })).resolves.toMatchObject({ code: 'SUCCESS' })
}

export async function joinRoom(
  client: Socket,
  { name, password, otherClients }: { name: string; password?: string; otherClients: readonly Socket[] },
): Promise<void> {
  const otherClientPromises = otherClients.map((client) => waitForEvent(client, 'notifyUserJoined'))

  await expect(emitEvent(client, 'joinRoom', { name, password })).resolves.toMatchObject({
    code: 'SUCCESS',
    data: {
      room: {
        name,
      },
    },
  })

  await expect(Promise.all(otherClientPromises)).resolves.toMatchObject(
    otherClients.map(() => ({ user: { id: client.id } })),
  )
}

export async function leaveCurrentRoom(client: Socket): Promise<void> {
  await expect(emitEvent(client, 'leaveCurrentRoom', {})).resolves.toStrictEqual({ code: 'SUCCESS' })
}

export async function startGame(client: Socket, cardsPool?: number[]): Promise<unknown> {
  const data = { cardsPool, stepTimeout: 3000, selectRowTimeout: 3000 }
  const response = await emitEvent(client, 'startGame', data)

  expect(response).toMatchObject({ success: true })

  return response
}

export async function playCard(
  client: Socket,
  { cardValue, otherClients }: { cardValue: number; otherClients: readonly Socket[] },
): Promise<void> {
  const otherClientPromises = otherClients.map((client) => waitForEvent(client, 'notifyUserPlayedCard'))

  await expect(emitEvent(client, 'playCard', { card: cardValue })).resolves.toStrictEqual({ code: 'SUCCESS' })

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
