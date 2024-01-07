import 'jest-extended'

import { useApp, useClients } from './helpers/testHooks'

describe('Send setName event', () => {
  const getApp = useApp()

  describe('with single client', () => {
    const getClients = useClients(getApp, 1)

    it('changes user name to specified value', async () => {
      const app = getApp()

      const response = await getClients()[0].emitEvent('setName', { name: 'newname' })

      expect(response).toStrictEqual({ code: 'SUCCESS' })
      expect(app.users.all[0].name).toBe('newname')
    })
  })

  describe('with multiple clients', () => {
    const getClients = useClients(getApp, 2)

    it('does not allow to setName to unavailable name', async () => {
      const app = getApp()
      const [clientA, clientB] = getClients()

      expect(await clientA.emitEvent('setName', { name: 'Turtle' })).toStrictEqual({ code: 'SUCCESS' })
      expect(app.users.all[0].name).toBe('Turtle')

      expect(await clientB.emitEvent('setName', { name: 'Turtle' })).toStrictEqual({
        code: 'BAD_REQUEST',
        message: 'Invalid data',
        validationErrors: [
          {
            code: 'custom',
            message: 'This name is currently unavailable',
            path: ['name'],
          },
        ],
      })
      expect(app.users.all[1].name).not.toBe('Turtle')

      expect(await clientB.emitEvent('setName', { name: 'Snail' })).toStrictEqual({ code: 'SUCCESS' })
      expect(app.users.all[1].name).toBe('Snail')
    })
  })
})
