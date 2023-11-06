import { z } from 'zod'

import { DEFAULT_COLOR } from 'common/src/username'
import { VoidMessageHandler, VoidMessageHandlerReturnValue } from '../Router/MessageHandler'

export const MIN_USERNAME_LENGTH = 2
export const MAX_USERNAME_LENGTH = 20
export const ALLOWED_CHARACTERS_IN_USERNAME_REGEX = /^[a-zA-Z0-9]+$/

const inputSchema = z.object({
  name: z
    .string()
    .min(MIN_USERNAME_LENGTH, `Name must contain at least ${MIN_USERNAME_LENGTH} characters`)
    .max(MAX_USERNAME_LENGTH, `Name must contain at most ${MAX_USERNAME_LENGTH} characters`)
    .regex(ALLOWED_CHARACTERS_IN_USERNAME_REGEX, 'Name must contain only a-z, A-Z or 0-9 characters'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
})

export default class SetNameHandler extends VoidMessageHandler {
  public async handle(): Promise<VoidMessageHandlerReturnValue> {
    const { input } = this

    const validationResult = inputSchema.safeParse(input)
    if (!validationResult.success) {
      return { validationErrors: validationResult.error.errors }
    }

    const { name, color } = validationResult.data

    if (this.app.users.all.find((user) => user.name === name && user.socket.id !== this.socket.id)) {
      return { validationErrors: [{ code: 'custom', path: ['name'], message: 'This name is currently unavailable' }] }
    }

    this.currentUser.name = name

    if (color) {
      this.currentUser.color = color.toUpperCase()
    } else {
      this.currentUser.color = DEFAULT_COLOR
    }

    // TODO: Notify room members

    // TODO: If room owner, notify all users without a room about owner's name change (performance issue?)
  }
}
