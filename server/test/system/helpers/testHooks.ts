import _ from 'lodash'
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

type ClientsGetter = () => readonly TestClient[]
export function useClients(getApp: AppGetter, count: number): ClientsGetter {
  let clients: readonly TestClient[]

  beforeAll(async () => {
    const port = getApp().port

    // TODO: Maybe connect each client synchronously one by one?
    clients = await Promise.all(
      _.range(1, count + 1).map((i) => TestClient.connect({ port, variableName: `client${i}` })),
    )

    // Easier to debug test
    console.log(clients.map((client, index) => `client${index + 1}: ${client.id}`).join(', '))
  })

  afterAll(() => {
    clients.forEach((client) => client.dispose())
  })

  return () => clients
}
