import 'jest-extended'

import App from '../../src/App'
import { closeApp, connectClientAsync, startApp } from './helpers/testHelpers'

describe('App', () => {
  let app: App

  beforeAll(async () => {
    app = await startApp(5001)
  })

  afterAll(() => {
    closeApp(app)
  })

  it('accepts connection and creates new User', async () => {
    const client = await connectClientAsync(app.port)

    expect(client.connected).toBeTrue()
    expect(app.users.all.length).toBe(1)
    expect(app.users.all[0].id).toBe(client.id)

    client.disconnect()

    expect(client.disconnected).toBeTrue()
  })
})
