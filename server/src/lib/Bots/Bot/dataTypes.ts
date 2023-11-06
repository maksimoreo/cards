export interface GetAllRoomsListItem {
  readonly id: string
  readonly name: string
  readonly owner: string
  readonly userCount: number
  readonly isPlaying: boolean
}

export interface User {
  readonly id: string
  readonly name: string
  readonly color: string
}

export interface Room {
  readonly id: string
  readonly name: string
  readonly owner: User
  readonly users: readonly User[]
}

export interface Card {
  readonly value: number
  readonly penaltyPoints: number
}

export interface GameState {
  readonly rows: Card[][]
  readonly players: readonly {
    readonly id: string
    readonly penaltyPoints: number
  }[]
  readonly stepsLeft: number
}
