import Card from './Card'
import Player from './Player'
import TakeSix, { SerializedState, SerializedStep } from './TakeSix'

// TODO: Add EventEmitter and the following events:
// playerSelectedCard(playerId: PlayerIdT)
// playerSelectedRow(playerId: PlayerIdT, rowIndex: number)
// gameStep(step: SerializedStepForPlayer)
// gameEnd(reason: string)
// playerLeft(playerId: PlayerIdT)
// selectCard(state: SerializedStateForPlayer, step: SerializedStepForPlayer | undefined)
// selectRow(state: SerializedStateForPlayer, step: SerializedStepForPlayer)

/**
 * Can be given to external player instance, used to run player actions
 */
export default class PlayerInterface {
  constructor(private readonly player: Player) {}

  public get id(): string {
    return this.player.id
  }

  public get isActive(): boolean {
    return this.player.isActive
  }

  public get gameState(): SerializedState {
    return this.game.serializedState
  }

  public get cards(): Card[] {
    return this.player.cards.concat()
  }

  public selectCard(cardValue: number): void {
    this.player.selectCard(cardValue)
  }

  public get selectedCard(): Card | undefined {
    return this.player.selectedCard
  }

  public get penaltyPoints(): number {
    return this.player.penaltyPoints
  }

  public isWaitingThisPlayerToSelectRow(): boolean {
    // TODO: Move implementation here from this.player
    return this.player.isWaitingThisPlayerToSelectRow()
  }

  public selectRow(rowIndex: number): void {
    this.player.selectRow(rowIndex)
  }

  public get lastSerializedStep(): SerializedStep {
    return this.game.lastSerializedStep
  }

  public leaveGame(): void {
    this.game.deactivatePlayer(this.id)
  }

  private get game(): TakeSix {
    return this.player.game
  }
}
