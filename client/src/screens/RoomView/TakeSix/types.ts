export interface Card {
  readonly value: number
  readonly penaltyPoints: number
}

export interface GameState {
  readonly rows: readonly (readonly Card[])[]
  readonly players: readonly {
    readonly id: string
    readonly penaltyPoints: number
    readonly isActive: boolean
    readonly user: {
      readonly id: string
      readonly name: string
      readonly color: string
    }
    readonly hasSelectedCard: boolean
  }[]
  readonly stepsLeft: number
}

export interface PlayerMove {
  readonly playerId: string
  readonly card: Card
  readonly rowIndex: number
  readonly takesRow: boolean
}

export type GameStep = {
  readonly selectedCards: readonly {
    readonly playerId: string
    readonly card: Card
  }[]
} & ({ readonly waitingPlayer: string } | { readonly moves: readonly PlayerMove[] })

export interface ClientGameState {
  readonly gameState: GameState
  readonly playersWithSelectedCard: readonly string[]
  readonly lastStep?: GameStep | undefined
  readonly playerCards?: readonly Card[] | undefined
}
