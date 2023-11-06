import Card from './Card'
import PlayerInterface from './PlayerInterface'
import TakeSix from './TakeSix'

interface PlayerConstructorOptions {
  readonly id: string
  readonly cards: readonly Card[]
  readonly game: TakeSix
  readonly penaltyPoints?: number
}

/**
 * Used internally to represent Player and related data
 */
export default class Player {
  public readonly id: string
  public readonly cards: Card[]
  public readonly game: TakeSix
  public readonly playerInterface: PlayerInterface
  private _isActive: boolean
  private _penaltyPoints: number
  private _selectedCardIndex: number | undefined

  constructor(options: PlayerConstructorOptions) {
    this.id = options.id
    this.cards = options.cards.concat().sort((card1, card2) => card1.value - card2.value)
    this.game = options.game
    this._penaltyPoints = options.penaltyPoints ?? 0

    this._isActive = true
    this.playerInterface = new PlayerInterface(this)
  }

  public get isActive(): boolean {
    return this._isActive
  }

  public deactivate(): void {
    if (!this._isActive) {
      throw new Error(`Player "${this.id}" is already deactivated.`)
    }

    this._isActive = false
    this._selectedCardIndex = undefined
  }

  public get penaltyPoints(): number {
    return this._penaltyPoints
  }

  public addPenaltyPoints(additionalPoints: number): void {
    this._penaltyPoints += additionalPoints
  }

  public isValidCard(cardValue: number): boolean {
    return this.cards.some((card) => card.value === cardValue)
  }

  public selectCard(cardValue: number): void {
    const cardIndex = this.cards.findIndex((card) => card.value === cardValue)

    if (cardIndex === -1) {
      throw Error(
        `Cannot select card with value ${cardValue}, player (${this.id}) does not have this card, but has ` +
          `[${this.cards.map(({ value }) => value).join(', ')}] cards`,
      )
    }

    this._selectedCardIndex = cardIndex
  }

  public get selectedCard(): Card | undefined {
    return this._selectedCardIndex === undefined ? undefined : this.cards[this._selectedCardIndex]
  }

  public isWaitingThisPlayerToSelectRow(): boolean {
    if (!this.game.isLastStepSaved()) {
      return false
    }

    const lastStepData = this.game.lastSerializedStep

    return 'waitingPlayer' in lastStepData && lastStepData.waitingPlayer === this.id
  }

  public selectRow(rowIndex: number): void {
    const lastStepData = this.game.lastSerializedStep

    if (!('waitingPlayer' in lastStepData)) {
      throw Error('Not waiting to select row')
    }

    if (lastStepData.waitingPlayer !== this.id) {
      throw Error(`Not waiting current player (${this.id}) to select row, but waiting ${lastStepData.waitingPlayer}`)
    }

    this.game.selectRowAndContinue(rowIndex)
  }

  public withdrawSelectedCard(): void {
    if (this._selectedCardIndex === undefined) {
      throw Error(`Player (${this.id}) does not have selected card`)
    }

    this.cards.splice(this._selectedCardIndex, 1)
    this._selectedCardIndex = undefined
  }
}
