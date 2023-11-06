import User from '../models/User'

export interface DecoratedUser {
  readonly id: string
  readonly name: string
  readonly color: string
}

export function decorateUser(user: User): DecoratedUser {
  return {
    id: user.id,
    name: user.name,
    color: user.color,
  }
}
