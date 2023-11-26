import User, { UserIdentity } from '../../models/User'
import Card from '../TakeSix/Card'
import PlayerInterface from '../TakeSix/PlayerInterface'
import { SerializedStep } from '../TakeSix/TakeSix'
import RoomGameTakeSix from './Game'

export class RoomGameTakeSixPlayer {
  public lastRecordedUserIdentity: UserIdentity | undefined

  constructor(
    public readonly game: RoomGameTakeSix,
    public readonly user: User,
    public readonly player: PlayerInterface,
  ) {}

  public get id(): string {
    return this.user.id
  }

  public get isActive(): boolean {
    return this.player.isActive
  }

  public playCard(card: number): void {
    this.player.selectCard(card)
  }

  public selectRow(rowIndex: number): void {
    this.player.selectRow(rowIndex)
  }

  public isWaitingAnyPlayerToSelectRow(): boolean {
    return this.game.game.isWaitingForPlayer()
  }

  public isWaitingThisPlayerToSelectRow(): boolean {
    return this.player.isWaitingThisPlayerToSelectRow()
  }

  public getLastSerializedStep(): SerializedStep {
    return this.player.lastSerializedStep
  }

  public get cards(): Card[] {
    return this.player.cards
  }

  public isValidCard(cardValue: number): boolean {
    return this.player.cards.some((card) => card.value === cardValue)
  }
}
