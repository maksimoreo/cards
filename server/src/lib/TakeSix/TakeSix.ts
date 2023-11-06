import { cloneDeep, last, map, shuffle, sumBy, times } from 'lodash'

import Card from './Card'
import DEFAULT_CARDS_SET, { DEFAULT_CARDS_SET_VALUE_TO_CARD_MAP } from './defaultCardsSet'
import Player from './Player'
import PlayerInterface from './PlayerInterface'

// TODO: If players are left with single cards, allow to use step()
// TODO: For player ID use type PlayerIdT = string, or Player<PlayerIdT = string> instead of string
// TODO: Option to provide cards set with specific penalty points for each card. Add cardsSet: Card[] to opts
// TODO: Validate cards values uniqueness in constructor if given cardsSet or cardsFromDefaultCardsSet

const DEFAULT_ROWS_COUNT = 4
const DEFAULT_PLAYER_CARDS_COUNT = 10
const DEFAULT_MAX_ROW_LENGTH = 5

export type StateDescription = 'selectCard' | 'selectRow' | 'End'

interface PlayerWithSelectedCard {
  player: Player
  selectedCard: Card
}

class Row {
  public cards: Card[]

  constructor(cards: readonly Card[]) {
    this.cards = [...cards]
  }
}

export interface SerializedState {
  rows: Card[][]
  players: {
    id: string
    penaltyPoints: number
    isActive: boolean
  }[]
  stepsLeft: number
}

interface SerializedMove {
  playerId: string
  card: Card
  rowIndex: number
  takesRow: boolean
}

export type SerializedStep = {
  selectedCards: {
    playerId: string
    card: Card
  }[]
} & ({ waitingPlayer: string } | { moves: SerializedMove[] })

export interface ReadonlySerializedState {
  readonly rows: readonly (readonly Card[])[]
  readonly players: readonly {
    readonly id: string
    readonly cards: readonly Card[]
    readonly penaltyPoints: number
  }[]
}

type CreateFromCardPoolOptions = {
  readonly playerIds: readonly string[]
  readonly playerCardsCount?: number
  readonly rowsCount?: number
  readonly maxRowLength?: number
  readonly shuffle?: boolean
} & (
  | { readonly cardPool: readonly Card[] }
  | { readonly defaultCardPool: boolean }
  | { readonly defaultCardPoolValues: readonly number[] }
)

interface GameStep {
  step: SerializedStep
  playersQueue: PlayerWithSelectedCard[]
}

export default class TakeSix {
  private readonly players: Player[]
  private readonly rows: readonly Row[]
  public readonly maxRowLength: number

  private gameStep?: GameStep

  public static minimumCardsPoolLength(
    playersCount: number,
    playerCardsCount = DEFAULT_PLAYER_CARDS_COUNT,
    rowsCount = DEFAULT_ROWS_COUNT,
  ): number {
    return playersCount * playerCardsCount + rowsCount
  }

  public static createFromCardPool(options: CreateFromCardPoolOptions): TakeSix {
    const minimumCardsPoolLength = TakeSix.minimumCardsPoolLength(
      options.playerIds.length,
      options.playerCardsCount,
      options.rowsCount,
    )

    let cardPool: Card[]
    if ('cardPool' in options) {
      cardPool = options.cardPool.concat()
    } else if ('defaultCardPool' in options) {
      cardPool = DEFAULT_CARDS_SET.concat()
    } else {
      cardPool = options.defaultCardPoolValues.map((value) => {
        const card = DEFAULT_CARDS_SET_VALUE_TO_CARD_MAP.get(value)

        if (!card) {
          throw Error(`Invalid card value: ${value}. See DEFAULT_CARD_SET for valid values.`)
        }

        return card
      })
    }

    if (cardPool.length < minimumCardsPoolLength) {
      throw Error(
        `Not enought cards in cards pool: given ${cardPool.length}, expected at least: ${minimumCardsPoolLength}`,
      )
    }

    if (options.shuffle) {
      cardPool = shuffle(cardPool)
    }

    const playerCardsCount = options.playerCardsCount ?? DEFAULT_PLAYER_CARDS_COUNT
    const players = options.playerIds.map((id) => ({
      id,
      penaltyPoints: 0,
      cards: cardPool.splice(0, playerCardsCount),
    }))

    const rows = times(options.rowsCount ?? DEFAULT_ROWS_COUNT, () => cardPool.splice(0, 1))

    return new TakeSix({ rows, players }, options.maxRowLength)
  }

  constructor(initialState: ReadonlySerializedState, maxRowLength = DEFAULT_MAX_ROW_LENGTH) {
    // TODO: Validate cards uniqueness in the whole initialState

    const firstPlayerCardsCount = initialState.players[0].cards.length

    // players
    this.players = initialState.players.map((player) => {
      const { id, cards, penaltyPoints } = player

      if (cards.length !== firstPlayerCardsCount) {
        throw Error('All players must have the same amount of cards')
      }

      return new Player({ id, penaltyPoints, cards: cloneDeep(cards), game: this })
    })

    // rows
    if (initialState.rows.length < 2) {
      throw Error(`Invalid initialState: must have at least 2 rows, but got ${initialState.rows.length}`)
    }

    this.rows = initialState.rows.map((cards) => new Row(cards))

    // other
    this.maxRowLength = maxRowLength
  }

  public get activePlayers(): readonly Player[] {
    return this.players.filter((player) => player.isActive)
  }

  public get rowsLength(): number {
    return this.rows.length
  }

  public getPlayerInterface(id: string): PlayerInterface {
    const player = this.players.find((player) => player.id === id)

    if (!player) {
      throw Error(`Cannot find player with id: ${id}`)
    }

    return player.playerInterface
  }

  public isEnded(): boolean {
    return this.players.some((player) => player.cards.length === 0)
  }

  public get serializedState(): SerializedState {
    return {
      rows: this.getRowsState(),
      players: this.players.map((player) => ({
        id: player.id,
        penaltyPoints: player.penaltyPoints,
        isActive: player.isActive,
      })),
      stepsLeft: this.stepsLeft,
    }
  }

  public isLastStepSaved(): boolean {
    return !!this.gameStep
  }

  public get lastSerializedStep(): SerializedStep {
    if (!this.gameStep) {
      throw Error('Did not do any step yet')
    }

    return this.gameStep.step
  }

  public isWaitingForPlayer(): boolean {
    return !!this.lastSerializedStep && 'waitingPlayer' in this.lastSerializedStep
  }

  public step(): void {
    this.verifyAllPlayersSelectedTheirCards()

    const playersQueue = this.activePlayers.map((player) => {
      const { selectedCard } = player

      if (selectedCard === undefined) {
        throw Error('Invalid state') // never throws
      }

      return { player, selectedCard }
    })

    const selectedCards = playersQueue.map(({ player, selectedCard }) => ({
      playerId: player.id,
      card: selectedCard,
    }))

    playersQueue.sort((entry1, entry2) => entry1.selectedCard.value - entry2.selectedCard.value)

    const firstEntry = playersQueue[0]
    if (this.rows.every((row) => row.cards[row.cards.length - 1].value > firstEntry.selectedCard.value)) {
      this.gameStep = {
        step: {
          selectedCards,
          waitingPlayer: firstEntry.player.id,
        },
        playersQueue,
      }
    } else {
      const moves: SerializedMove[] = []

      this.operatePlayers(playersQueue, moves)

      this.gameStep = {
        step: {
          selectedCards,
          moves,
        },
        playersQueue,
      }
    }
  }

  public isValidRow(rowIndex: number): boolean {
    return rowIndex >= 0 && rowIndex < this.rows.length
  }

  public selectRowAndContinue(rowIndex: number): void {
    const { gameStep } = this

    if (!gameStep || !('waitingPlayer' in gameStep.step)) {
      throw Error('Not waiting for row selection')
    }

    if (!this.isValidRow(rowIndex)) {
      throw Error(`rowIndex out of range: ${rowIndex} is not in [0, ${this.rows.length})`)
    }

    this.selectRowAndContinueNoValidation(rowIndex, gameStep)
  }

  public getRowsState(): Card[][] {
    return this.rows.map((row) => row.cards)
  }

  public didAllPlayersSelectCard(): boolean {
    return this.getPlayersWithoutSelectedCard().length === 0
  }

  public getPlayersWithSelectedCard(): Player[] {
    return this.activePlayers.filter((player) => player.selectedCard !== undefined)
  }

  public getPlayersWithoutSelectedCard(): Player[] {
    return this.activePlayers.filter((player) => player.selectedCard === undefined)
  }

  // Removes player, and if possible continues the game
  public deactivatePlayer(playerId: string): void {
    const index = this.players.findIndex((player) => player.id === playerId)

    if (index === -1) {
      throw Error(`Cannot find player with id: ${playerId}`)
    }

    this.players[index].deactivate()

    if (!this.isEnoughPlayers()) {
      return
    }

    const { gameStep } = this

    if (gameStep && 'waitingPlayer' in gameStep.step) {
      if (gameStep.step.waitingPlayer === playerId) {
        const leastPenaltyPointsRowIndex =
          this.rows.reduce<{ penaltyPoints: number; index: number } | undefined>((obj, row, index) => {
            const penaltyPoints = sumBy(row.cards, (card) => card.penaltyPoints)

            if (!obj || penaltyPoints < obj.penaltyPoints) {
              return { penaltyPoints, index }
            }

            return obj
          }, undefined)?.index ?? 0

        this.selectRowAndContinueNoValidation(leastPenaltyPointsRowIndex, gameStep)
      } else {
        // Still waiting for some player, but remove this player from queue
        const indexInLastStepPlayers = gameStep.playersQueue.findIndex((entry) => entry.player.id === playerId)

        gameStep.playersQueue.splice(indexInLastStepPlayers)
      }
    } else {
      // Not waiting for row selection
      if (this.didAllPlayersSelectCard()) {
        this.step()
      }
    }
  }

  public isEnoughPlayers(): boolean {
    return this.activePlayers.length >= 2
  }

  public get stepsLeft(): number {
    return this.activePlayers[0].cards.length
  }

  public getStateDescription(): StateDescription {
    const { gameStep } = this

    if (!gameStep) {
      return 'selectCard'
    }

    if ('waitingPlayer' in gameStep.step) {
      return 'selectRow'
    }

    if (this.isEnoughPlayers() && this.stepsLeft >= 1) {
      return 'selectCard'
    }

    return 'End'
  }

  private operatePlayers(entries: PlayerWithSelectedCard[], moves: SerializedMove[]): void {
    while (entries.length) {
      const { player, selectedCard } = entries[0]

      const leastDifferenceRowIndex = this.rows.reduce<{ difference: number; index: number } | undefined>(
        (obj, row, index) => {
          const lastCard = last(row.cards)

          if (!lastCard) {
            throw Error(`Invalid state: rows[${index}] is empty`)
          }

          const difference = selectedCard.value - lastCard.value

          if (difference <= 0) {
            return obj
          }

          if (!obj || difference < obj.difference) {
            return { difference, index }
          }

          return obj
        },
        undefined,
      )?.index

      if (leastDifferenceRowIndex === undefined) {
        throw Error(`Invalid state: Could not find row for ${selectedCard} card`)
      }

      player.withdrawSelectedCard()

      const row = this.rows[leastDifferenceRowIndex]
      const isTakeRow = row.cards.length >= this.maxRowLength

      if (isTakeRow) {
        this.playerTakeRow(player, row, selectedCard)
      } else {
        row.cards.push(selectedCard)
      }

      moves.push({
        playerId: player.id,
        card: selectedCard,
        rowIndex: leastDifferenceRowIndex,
        takesRow: isTakeRow,
      })

      entries.splice(0, 1)
    }
  }

  private verifyAllPlayersSelectedTheirCards(): void {
    const playersWithoutSelectedCards = this.getPlayersWithoutSelectedCard()

    if (playersWithoutSelectedCards.length > 0) {
      throw Error(`These players don't have selected card: ${map(playersWithoutSelectedCards, 'id')}`)
    }
  }

  private playerTakeRow(player: Player, row: Row, selected: Card): void {
    const penaltyPoints = sumBy(row.cards, (card) => card.penaltyPoints)

    player.addPenaltyPoints(penaltyPoints)

    row.cards = [selected]
  }

  private selectRowAndContinueNoValidation(rowIndex: number, gameStep: GameStep): void {
    // Take row
    const { player, selectedCard } = gameStep.playersQueue[0]

    this.playerTakeRow(player, this.rows[rowIndex], selectedCard)
    player.withdrawSelectedCard()

    gameStep.playersQueue.splice(0, 1)

    const moves: SerializedMove[] = [{ playerId: player.id, rowIndex, card: selectedCard, takesRow: true }]

    // Continue work on players
    this.operatePlayers(gameStep.playersQueue, moves)

    gameStep.step = {
      selectedCards: gameStep.step.selectedCards,
      moves,
    }
  }
}
