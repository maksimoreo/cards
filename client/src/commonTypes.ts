export interface User {
  readonly id: string
  readonly name: string
  readonly color: string
}

export interface Room {
  name: string
  owner: User
  users: User[]
  gameOptions: {
    type: 'takeSix'
    mode: 'normal' | 'expert'
  }
}

export type Game = {
  type: 'TakeSix'
  // TODO: Fill state
} | null
