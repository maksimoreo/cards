import { maxBy, random, sample } from 'lodash'
import { decorateRoom } from '../../decorators/RoomDecorator'
import Room from '../../models/Room'
import User, { UserIdentity } from '../../models/User'
import RemoveUsersFromRoom from '../../services/RemoveUsersFromRoom'
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
    if (!this.didAllPlayersSelectCard()) {
      return
    }

    this.game.step()
    this.s2c_gameStep()
    this.finalizeSelectCard()
  }

  public didAllPlayersSelectCard(): boolean {
    return this.game.didAllPlayersSelectCard()
  }

  public isValidRow(rowIndex: number): boolean {
    return this.game.isValidRow(rowIndex)
  }

  public handleRowSelected(): void {
    this.s2c_gameStep()
    this.finalizeSelectRow()
  }

  private finalizeSelectCard(): void {
    this.clearStepTimer()

    if (this.game.isWaitingForPlayer()) {
      return this.startSelectRowTimer()
    }

    if (this.isEnded()) {
      return this.stopGame({ reason: 'Completed' })
    }

    this.startStepTimer()
  }

  private finalizeSelectRow(): void {
    this.clearSelectRowTimer()

    if (this.isEnded()) {
      return this.stopGame({ reason: 'Completed' })
    }

    this.startStepTimer()
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

  private s2c_gameStep(): void {
    const gameState = this.generateSerializedState()

    this.room.allUsers.forEach((user) => {
      const { player } = user

      const messageData = {
        step: this.game.lastSerializedStep,
        gameState,
        ...(!!player && { playerCards: player.cards }),
      }

      user.socket.emit('s2c_gameStep', messageData)
    })
  }

  public generateSerializedState(): SerializedState {
    return {
      ...this.game.serializedState,
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

  private clearAllTimers(): void {
    this.clearStepTimer()
    this.clearSelectRowTimer()
  }

  private handleStepTimerDone(): void {
    this.clearStepTimer()
    const inactivePlayers = this.getActivePlayersWithoutSelectedCard()

    if (!inactivePlayers) {
      return
    }

    const { playerInactivityStrategy } = this.room.gameOptions
    const leftActivePlayersCount = this.game.activePlayers.length - inactivePlayers.length

    if (playerInactivityStrategy === 'moveToSpectators') {
      if (leftActivePlayersCount <= 1) {
        this.unassignReferencesFromRoomAndRoomMembers()
        this.notifyAboutPlayerMoveToSpectators({ inactivePlayers })
        this.emits2c_gameStopped({ reason: 'Player inactivity' })
        return
      }

      inactivePlayers.forEach((inactivePlayer) => {
        inactivePlayer.deactivate()
      })

      this.game.step()
      this.notifyAboutPlayerMoveToSpectators({ inactivePlayers })
      this.s2c_gameStep()
      this.finalizeSelectCard()
    } else if (playerInactivityStrategy === 'forcePlay') {
      // Note: In test environment, always select the highest value card, to make tests deterministic
      const isTestEnv = process.env.NODE_ENV === 'test'

      inactivePlayers.forEach((inactivePlayer) => {
        const playerCards = inactivePlayer.cards
        const cardToSelect = isTestEnv ? maxBy(playerCards, (card) => card.value) : sample(playerCards)

        if (cardToSelect === undefined) {
          throw Error(`Could not select card from ${playerCards}. This error should never be thrown.`)
        }

        inactivePlayer.player.selectCard(cardToSelect.value)
      })

      this.game.step()
      this.s2c_gameStep()
      this.finalizeSelectCard()
    } else if (playerInactivityStrategy === 'kick') {
      if (leftActivePlayersCount <= 1) {
        this.unassignReferencesFromRoomAndRoomMembers()
        this.removePlayersFromRoom(inactivePlayers)
        this.notifyAboutKickedPlayers({ inactivePlayers })
        if (!this.room.isDestroyed) {
          this.emits2c_gameStopped({ reason: 'Player inactivity' })
        }
        return
      }

      inactivePlayers.forEach((inactivePlayer) => {
        inactivePlayer.deactivate()
      })

      this.removePlayersFromRoom(inactivePlayers)
      this.game.step()
      this.notifyAboutKickedPlayers({ inactivePlayers })
      this.s2c_gameStep()
      this.finalizeSelectCard()
    }
  }

  private handleSelectRowTimerDone(): void {
    this.clearSelectRowTimer()

    const { playerInactivityStrategy } = this.room.gameOptions

    if (!('waitingPlayer' in this.game.lastSerializedStep)) {
      throw new Error('Invalid state: not waiting for row selection')
    }

    if (playerInactivityStrategy === 'forcePlay') {
      this.forceSelectRow()
      this.s2c_gameStep()
      this.finalizeSelectRow()
      return
    }

    const waitingForPlayerId = this.game.lastSerializedStep.waitingPlayer
    const waitingForPlayer = this.players.find((player) => player.id === waitingForPlayerId)

    if (!waitingForPlayer) {
      throw new Error('Invalid state: cannot find player that is waiting for row selection')
    }

    if (playerInactivityStrategy === 'moveToSpectators') {
      if (this.game.activePlayers.length <= 2) {
        this.unassignReferencesFromRoomAndRoomMembers()
        this.notifyAboutPlayerMoveToSpectators({ inactivePlayers: [waitingForPlayer] })
        this.emits2c_gameStopped({ reason: 'Player inactivity' })
        return
      }

      this.forceSelectRow()
      waitingForPlayer.deactivate()
      this.notifyAboutPlayerMoveToSpectators({ inactivePlayers: [waitingForPlayer] })
      this.s2c_gameStep()
      this.finalizeSelectRow()
      return
    }

    if (playerInactivityStrategy === 'kick') {
      if (this.game.activePlayers.length <= 2) {
        this.removePlayersFromRoom([waitingForPlayer])
        this.unassignReferencesFromRoomAndRoomMembers()
        this.notifyAboutKickedPlayers({ inactivePlayers: [waitingForPlayer] })
        this.emits2c_gameStopped({ reason: 'Player inactivity' })
        return
      }

      this.forceSelectRow()
      waitingForPlayer.deactivate()
      this.removePlayersFromRoom([waitingForPlayer])
      this.notifyAboutKickedPlayers({ inactivePlayers: [waitingForPlayer] })
      this.s2c_gameStep()
      this.finalizeSelectRow()
      return
    }
  }

  /**
   * Selects row for player that has to select row. Continues game if possible.
   */
  private forceSelectRow() {
    // Note: In test environment, always select the first row, to make tests deterministic
    const randomRowIndex = process.env.NODE_ENV === 'test' ? 0 : random(0, this.game.rowsLength - 1)

    this.game.selectRowAndContinue(randomRowIndex)
  }

  private notifyAboutPlayerMoveToSpectators({
    inactivePlayers,
  }: {
    readonly inactivePlayers: readonly RoomGameTakeSixPlayer[]
  }) {
    if (inactivePlayers.length === 0) {
      return
    }

    // Notify inactive players
    const eventData = {
      reason: 'inactivity',
      newRoomState: decorateRoom(this.room),
      game: this.room.game?.generateSerializedState() ?? null,
    } as const

    inactivePlayers.forEach((inactivePlayer) => {
      inactivePlayer.user.socket.emit('s2c_youHaveBeenMovedToSpectators', eventData)
    })

    // Notify all other users
    const usersToSendEventTo = this.room.allUsers.filter(
      (user) => !inactivePlayers.find((inactivePlayer) => inactivePlayer.id === user.id),
    )

    if (usersToSendEventTo.length > 0) {
      const eventData = {
        reason: 'inactivity',
        userIds: inactivePlayers.map((player) => player.id),
        newRoomState: decorateRoom(this.room),
        game: this.room.game?.generateSerializedState() ?? null,
      } as const

      usersToSendEventTo.forEach((user) => {
        user.socket.emit('s2c_usersMovedToSpectators', eventData)
      })
    }
  }

  private notifyAboutKickedPlayers({
    inactivePlayers,
  }: {
    readonly inactivePlayers: readonly RoomGameTakeSixPlayer[]
  }) {
    if (inactivePlayers.length === 0) {
      return
    }

    // Notify inactive players
    inactivePlayers.forEach((inactivePlayer) => {
      inactivePlayer.user.socket.emit('s2c_youHaveBeenKicked', { reason: 'inactivity' })
    })

    if (this.room.isDestroyed) {
      return
    }

    // Notify all other users
    const usersToSendEventTo = this.room.allUsers.filter(
      (user) => !inactivePlayers.find((inactivePlayer) => inactivePlayer.id === user.id),
    )

    if (usersToSendEventTo.length > 0) {
      const eventData = {
        reason: 'kickedForInactivity',
        userIds: inactivePlayers.map((player) => player.id),
        newRoomState: decorateRoom(this.room),
        game: this.room.game?.generateSerializedState() ?? null,
      } as const

      usersToSendEventTo.forEach((user) => {
        user.socket.emit('s2c_usersLeft', eventData)
      })
    }
  }

  private getActivePlayersWithoutSelectedCard(): RoomGameTakeSixPlayer[] {
    return this.players.filter((player) => player.isActive && !player.player.selectedCard)
  }

  public isEnded(): boolean {
    return this.game.isEnded()
  }

  public stopGame({ reason }: { reason: string }): void {
    this.clearAllTimers()
    this.unassignReferencesFromRoomAndRoomMembers()
    this.emits2c_gameStopped({ reason })
  }

  private emits2c_gameStopped({ reason }: { reason: string }): void {
    this.room.allUsers.forEach((user) => user.socket.emit('s2c_gameStopped', { reason }))
  }

  private unassignReferencesFromRoomAndRoomMembers(): void {
    this.room.game = undefined

    this.players.forEach((player) => {
      if (player.user.player) {
        player.user.player = undefined
      }
    })
  }

  public handlePlayerLeave({
    playerId,
    notifyAboutPlayerLeave,
  }: {
    playerId: string
    notifyAboutPlayerLeave: () => void
  }): void {
    const player = this.findPlayer(playerId)

    if (this.game.activePlayers.length <= 2) {
      player.deactivate()
      notifyAboutPlayerLeave()
      this.stopGame({ reason: 'Player left' })
      return
    }

    const currentState = this.game.getStateDescription()

    if (currentState === 'selectCard') {
      player.deactivate()

      if (this.game.didAllPlayersSelectCard()) {
        this.game.step()
        notifyAboutPlayerLeave()
        this.s2c_gameStep()
        this.finalizeSelectCard()
      } else {
        notifyAboutPlayerLeave()
      }
    } else if ('waitingPlayer' in this.game.lastSerializedStep) {
      if (player.id === this.game.lastSerializedStep.waitingPlayer) {
        this.forceSelectRow()
        player.deactivate()
        notifyAboutPlayerLeave()
        this.s2c_gameStep()
        this.finalizeSelectRow()
      } else {
        player.deactivate()
        notifyAboutPlayerLeave()
      }
    }
  }

  private removePlayersFromRoom(players: readonly RoomGameTakeSixPlayer[]) {
    RemoveUsersFromRoom.call({
      app: this.room.app,
      users: players.map((player) => player.user),
      room: this.room,
    })
  }

  private findPlayer(playerId: string): RoomGameTakeSixPlayer {
    const player = this.players.find((player) => player.id === playerId)

    if (!player) {
      throw new Error(`Cannot find player: '${playerId}'`)
    }

    return player
  }
}
