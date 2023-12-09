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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function waitForEvent<ResponseDataT = any>(
  client: Socket,
  message: string,
  timeout = 1000,
): Promise<ResponseDataT> {
  const clientId = client.id

  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | null = null

    const handleMessage = (data: ResponseDataT): void => {
      timer && clearTimeout(timer)
      client.off(message, handleMessage)
      resolve(data)
    }

    timer = setTimeout(() => {
      client.off(message, handleMessage)
      reject(new Error(`Client '${clientId}' did not receive '${message}' after ${timeout} ms`))
    }, timeout)

    client.on(message, handleMessage)
  })
}

export function waitForNoEvents(client: Socket, message: string, timeout = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | null = null

    const handleMessage = (): void => {
      timer && clearTimeout(timer)
      client.off(message, handleMessage)
      reject(new Error(`Expected '${client.id}' not to receive '${message}', but received it`))
    }

    timer = setTimeout(() => {
      client.off(message, handleMessage)
      resolve()
    }, timeout)

    client.on(message, handleMessage)
  })
}

export function waitClientsForNoEvents(
  clients: readonly Socket[],
  { timeout }: { readonly timeout: number },
): Promise<void> {
  let timer: NodeJS.Timeout | null = null

  return new Promise((resolve, reject) => {
    const handlers = clients.map((client) => (eventName: string) => {
      timer && clearTimeout(timer)

      clients.forEach((client, index) => {
        client.offAny(handlers[index])
      })

      reject(new Error(`Expected '${client.id}' not to receive any events, but it received '${eventName}'`))
    })

    timer = setTimeout(() => {
      clients.forEach((client, index) => {
        client.offAny(handlers[index])
      })

      resolve()
    }, timeout)

    clients.forEach((client, index) => {
      client.onAny(handlers[index])
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
