import Client, { Socket } from 'socket.io-client'

import { EventToInputDataTypeMapT } from 'common/src/TypedClientSocket/ClientToServerEvents'
import { EVENT_TO_OUTPUT_DATA_SCHEMA_MAP } from 'common/src/TypedClientSocket/EventToOutputDataSchemaMap'
import { ApiResponse, wrapApiResponseDataSchema } from 'common/src/TypedClientSocket/send'
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
export function emitEvent<EventT extends keyof EventToInputDataTypeMapT>(
  client: Socket,
  event: EventT,
  data: EventToInputDataTypeMapT[EventT],
  timeout = 1000,
): Promise<ApiResponse<EventT>> {
  return withTimeout(timeout, (resolve) => {
    client.emit(event, data, (unknownResponse: unknown) => {
      const dataSchema = EVENT_TO_OUTPUT_DATA_SCHEMA_MAP[event]
      const responseSchema = wrapApiResponseDataSchema(dataSchema)
      const response = responseSchema.parse(unknownResponse)

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
