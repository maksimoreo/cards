import { Socket } from 'socket.io-client'

import App from '../../../src/App'
import { closeApp, connectClientAsync, startApp } from './testHelpers'

// Common setup/teardown for system tests
type AppGetter = () => App
export function useApp(): AppGetter {
  let app: App

  beforeAll(async () => {
    app = await startApp(5001)
  })

  afterAll(() => {
    closeApp(app)
  })

  return () => app
}

type ClientGetter = () => Socket
export function useClient(getApp: AppGetter): ClientGetter {
  let client: Socket

  beforeAll(async () => {
    client = await connectClientAsync(getApp().port)
  })

  afterAll(() => {
    client.disconnect()
  })

  return () => client
}

type ClientsGetter = () => readonly Socket[]
export function useClients(getApp: AppGetter, count: number): ClientsGetter {
  let clients: readonly Socket[]

  beforeAll(async () => {
    const port = getApp().port

    // TODO: Maybe connect each client synchronously one by one?
    clients = await Promise.all([...Array(count)].map(() => connectClientAsync(port)))

    // Easier to debug test
    console.log(clients.map((client, index) => `client${index + 1}: ${client.id}`).join(', '))
  })

  afterAll(() => {
    clients.forEach((client) => client.disconnect())
  })

  return () => clients
}
