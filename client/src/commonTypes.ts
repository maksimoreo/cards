import { StepTimeoutDoneStrategy } from 'common/src/misc'

export interface User {
  readonly id: string
  readonly name: string
  readonly color: string
}

export interface Room {
  name: string
  owner: User
  users: User[]
  gameOptions: GameOptions
}

export interface GameOptions {
  type: 'takeSix'
  mode: 'normal' | 'expert'
  stepTimeout: number
  stepTimeoutDoneStrategy: StepTimeoutDoneStrategy
}

export type Game = {
  type: 'TakeSix'
  // TODO: Fill state
} | null
