import { maxBy, random, sample } from 'lodash'
import Room from '../../models/Room'
import User, { UserIdentity } from '../../models/User'
import * as TakeSix from '../TakeSix'
import Card from '../TakeSix/Card'
import { SerializedStep } from '../TakeSix/TakeSix'
import { RoomGameTakeSixPlayer } from './Player'

const DEFAULT_STEP_TIMEOUT = 24 * 60 * 60 * 1000
const DEFAULT_SELECT_ROW_TIMEOUT = 24 * 60 * 60 * 1000

interface RoomGameTakeSixOpts {
  room: Room
  stepTimeout?: number
  selectRowTimeout?: number
  game: TakeSix.TakeSix
}

export interface SerializedState {
  rows: Card[][]
  players: {
    id: string
    user: UserIdentity
    penaltyPoints: number
    isActive: boolean
    hasSelectedCard: boolean
  }[]
  stepsLeft: number
}

// Wraps TakeSix game to control timeouts
export default class RoomGameTakeSix {
  public readonly game: TakeSix.TakeSix
  public readonly players: RoomGameTakeSixPlayer[]

  private readonly room: Room

  private readonly stepTimeout: number
  private readonly selectRowTimeout: number

  private isGameStarted: boolean
  private stepTimer?: NodeJS.Timeout
  private selectRowTimer?: NodeJS.Timeout

  constructor(opts: RoomGameTakeSixOpts) {
    this.room = opts.room
    this.game = opts.game

    this.stepTimeout = opts.stepTimeout ?? DEFAULT_STEP_TIMEOUT
    this.selectRowTimeout = opts.selectRowTimeout ?? DEFAULT_SELECT_ROW_TIMEOUT

    const users = opts.room.allUsers

    // TODO: Check if game.players has ids that are not present in this room

    this.players = users.reduce<RoomGameTakeSixPlayer[]>((array, user) => {
      const gamePlayerInterface = this.game.getPlayerInterface(user.id)

      const player = new RoomGameTakeSixPlayer(this, user, gamePlayerInterface)

      user.player = player

      return array.concat(player)
    }, [])

    this.isGameStarted = false
  }

  public get users(): User[] {
    return this.players.map((player) => player.user)
  }

  public startGame(): void {
    if (this.isGameStarted) {
      throw Error('Game is already started')
    }

    this.startStepTimer()
  }

  public handleCardPlayed(): void {
    if (this.game.getPlayersWithoutSelectedCard().length === 0) {
      this.clearStepTimer()

      this.makeStep()
    }
  }

  public isValidRow(rowIndex: number): boolean {
    return this.game.isValidRow(rowIndex)
  }

  public handleRowSelected(): void {
    this.clearSelectRowTimer()
    this.notifyGameStep()
    this.finalizeStep()
  }

  // Assumes all players selected their cards, conditionally waits player to select row
  public makeStep(): void {
    this.game.step()

    this.notifyGameStep()

    if (this.game.isWaitingForPlayer()) {
      this.startSelectRowTimer()
    } else {
      this.finalizeStep()
    }
  }

  // Assumes that game is not waiting for player to select row
  public finalizeStep(): void {
    if (this.isEnded()) {
      this.cleanupRoom()
    } else {
      this.startStepTimer()
    }
  }

  public getDataForJoinedUser(): {
    state: SerializedState
    playersWithSelectedCard: string[]
    lastStep?: SerializedStep
  } {
    return {
      state: this.generateSerializedState(),
      playersWithSelectedCard: this.game.getPlayersWithSelectedCard().map((player) => player.id),
      ...(this.game.isLastStepSaved() && { lastStep: this.game.lastSerializedStep }),
    }
  }

  private notifyGameStep(): void {
    this.room.allUsers.forEach((user) => {
      const { player } = user

      const messageData = {
        step: this.game.lastSerializedStep,
        gameState: this.generateSerializedState(),
        ...(!!player && { playerCards: player.cards }),
      }

      user.socket.emit('notifyGameStep', messageData)
    })
  }

  public generateSerializedState(): SerializedState {
    const serializedState = this.game.serializedState

    return {
      ...serializedState,
      players: this.players.map((player) => ({
        id: player.player.id,
        penaltyPoints: player.player.penaltyPoints,
        isActive: player.isActive,
        user: player.lastRecordedUserIdentity || player.user.identity,
        hasSelectedCard: !!player.player.selectedCard,
      })),
    }
  }

  private startStepTimer(): void {
    this.stepTimer = setTimeout(this.handleStepTimerDone.bind(this), this.stepTimeout)
  }

  private clearStepTimer(): void {
    clearTimeout(this.stepTimer)
  }

  private startSelectRowTimer(): void {
    this.selectRowTimer = setTimeout(this.handleSelectRowTimerDone.bind(this), this.selectRowTimeout)
  }

  private clearSelectRowTimer(): void {
    clearTimeout(this.selectRowTimer)
  }

  private handleStepTimerDone(): void {
    // Note: In test environment, always select the highest value card, to make tests deterministic
    const isTestEnv = process.env.NODE_ENV === 'test'

    this.game.getPlayersWithoutSelectedCard().forEach((player) => {
      const playerCards = player.cards
      const cardToSelect = isTestEnv ? maxBy(playerCards, (card) => card.value) : sample(playerCards)

      if (cardToSelect === undefined) {
        throw Error(`Could not select card from ${playerCards}. This error should never be thrown.`)
      }

      player.selectCard(cardToSelect.value)
    })

    this.makeStep()
  }

  private handleSelectRowTimerDone(): void {
    // Note: In test environment, always select the first row, to make tests deterministic
    const randomRowIndex = process.env.NODE_ENV === 'test' ? 0 : random(0, this.game.rowsLength - 1)

    this.game.selectRowAndContinue(randomRowIndex)

    this.notifyGameStep()
    this.finalizeStep()
  }

  public isEnded(): boolean {
    return this.game.isEnded()
  }

  public stopGame(): void {
    this.clearStepTimer()
    this.clearSelectRowTimer()
    this.cleanupRoom()
  }

  private cleanupRoom(): void {
    this.room.game = undefined

    this.players.forEach((player) => {
      if (!player.isActive) {
        return
      }

      player.user.player = undefined
    })
  }

  public deactivatePlayer(userId: string): void {
    const playerIndex = this.players.findIndex((player) => player.user.id === userId)

    if (playerIndex === -1) {
      throw new Error(`Unknown user/player: ${userId}`)
    }

    const player = this.players[playerIndex]

    player.lastRecordedUserIdentity = player.user.identity
    player.user.player = undefined

    const stateBefore = this.game.getStateDescription()
    const stepsLeftBefore = this.game.stepsLeft

    this.game.deactivatePlayer(player.user.id)

    const stateAfter = this.game.getStateDescription()
    const stepsLeftAfter = this.game.stepsLeft

    const stepsDelta = stepsLeftBefore - stepsLeftAfter

    if (!this.game.isEnoughPlayers()) {
      this.stopGame()
    } else if (stateBefore === 'selectCard' && stateAfter === 'selectRow') {
      this.clearStepTimer()
      this.notifyGameStep()
      this.startSelectRowTimer()
    } else if (stateBefore === 'selectCard' && stateAfter === 'selectCard' && stepsDelta === 1) {
      this.clearStepTimer()
      this.notifyGameStep()
      this.startStepTimer()
    } else if (stateBefore === 'selectCard' && stateAfter === 'selectCard' && stepsDelta === 0) {
      // Do nothing
    } else if (stateBefore === 'selectRow' && stateAfter === 'selectRow') {
      // Do nothing
    } else if (stateBefore === 'selectRow' && stateAfter === 'selectCard') {
      this.clearSelectRowTimer()
      this.notifyGameStep()
      this.startStepTimer()
    } else {
      throw Error('Invalid state')
    }
  }
}
