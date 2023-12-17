import Client, { Socket } from 'socket.io-client'

import App from '../../../src/App'
import { createTestLogger } from '../../../src/Logger'
import { withTimeout } from '../../../src/utils'
import { TestClient } from './TestClient'

export async function startApp(port: number): Promise<App> {
  const app = new App({ port, logger: createTestLogger() })
  await app.start()
  return app
}

export function closeApp(app: App): void {
  app.close()
}

export function connectClientAsync(port: number): Promise<Socket> {
  const client = Client(`http://localhost:${port}`, {
    timeout: 500,
  })

  return new Promise((resolve, reject) => {
    const handleConnect = (): void => {
      client.off('connect', handleConnect)
      client.off('error', handleError)
      resolve(client)
    }

    const handleError = (): void => {
      client.off('connect', handleConnect)
      client.off('error', handleError)
      reject()
    }

    client.once('connect', handleConnect)
    client.once('error', handleError)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function emitEvent<RequestDataT = any, ResponseDataT = any>(
  client: Socket,
  event: string,
  data: RequestDataT,
  timeout = 1000,
): Promise<ResponseDataT> {
  return withTimeout(timeout, (resolve) => {
    client.emit(event, data, (response: ResponseDataT) => {
      resolve(response)
    })
  })
}

export function expectClientListenersClean(client: Socket, event: string): void {
  expect(client.listeners(event).length).toBe(0)
}

export function expectClientsListenersClean(clients: Socket[], event: string): void {
  clients.forEach((client) => {
    expect(client.listeners(event).length).toBe(0)
  })
}

export function expectClientsExpectedEventsQueuesClean(clients: readonly TestClient[]): void {
  clients.forEach((client) => {
    expect(client.expectedEventsQueue).toBeEmpty()
  })
}
