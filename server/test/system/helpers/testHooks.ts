import App from '../../../src/App'
import { TestClient } from './TestClient'
import { closeApp, startApp } from './testHelpers'

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

type ClientGetter = () => TestClient
export function useClient(getApp: AppGetter): ClientGetter {
  let client: TestClient

  beforeAll(async () => {
    client = await TestClient.connect({ port: getApp().port })
  })

  afterAll(() => {
    client.dispose()
  })

  return () => client
}

type ClientsGetter = () => readonly TestClient[]
export function useClients(getApp: AppGetter, count: number): ClientsGetter {
  let clients: readonly TestClient[]

  beforeAll(async () => {
    const port = getApp().port

    // TODO: Maybe connect each client synchronously one by one?
    clients = await Promise.all([...Array(count)].map(() => TestClient.connect({ port })))

    // Easier to debug test
    console.log(clients.map((client, index) => `client${index + 1}: ${client.id}`).join(', '))
  })

  afterAll(() => {
    clients.forEach((client) => client.dispose())
  })

  return () => clients
}
