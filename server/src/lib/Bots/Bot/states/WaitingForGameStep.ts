import { random } from 'lodash'
import BotInternals from '../BotInternals'
import { State, UnexpectedEventError } from '../StateMachine'
import { Card, GameState, Room } from '../dataTypes'
import { StateUpdateEvent } from '../events'
import WaitingForPlayersState from './WaitingForPlayersState'
import {
  canStartGame,
  gracefullyDisconnectSocket,
  toWaitingBeforePlayingCard,
  toWaitingBeforeStartingTheGame,
} from './shared'

interface WaitingForGameStepStateProps {
  readonly botInternals: BotInternals
  readonly room: Room
  readonly gameState: GameState
  readonly playerCards: readonly Card[]
}

export default class WaitingForGameStepState {
  public readonly type = 'waitingForGameStep'

  public constructor(public readonly props: WaitingForGameStepStateProps) {}

  public async reduce(event: StateUpdateEvent): Promise<State> {
    const { props } = this

    if (event.type === 'disconnectRequest') {
      return gracefullyDisconnectSocket(props)
    }

    const { botInternals } = props

    if (event.type === 'serverEvent') {
      const { serverEvent } = event.props

      if (serverEvent.type === 's2c_userPlayedCard' || serverEvent.type === 's2c_userMessage') {
        return this
      }

      if (serverEvent.type === 's2c_userJoined' || serverEvent.type === 's2c_usersLeft') {
        return new WaitingForGameStepState({
          ...props,
          room: serverEvent.data.newRoomState,
        })
      }

      if (serverEvent.type === 's2c_gameStep') {
        if ('waitingPlayer' in serverEvent.data.step) {
          if (serverEvent.data.step.waitingPlayer === botInternals.socket.id) {
            const rowIndex = random(0, props.gameState.rows.length - 1)

            await botInternals.socketEmit('selectRow', { rowIndex })

            return this
          }

          // Waiting for some other player to select a row

          return this
        }

        if (serverEvent.data.game.stepsLeft === 0) {
          // Game ended
          botInternals.sharedState.gamesPlayed += 1

          // determine if won the game
          if (
            serverEvent.data.game.players.reduce((prev, next) =>
              next.penaltyPoints < prev.penaltyPoints ? next : prev,
            ).id === botInternals.socket.id
          ) {
            botInternals.sharedState.gamesWon += 1
          }

          if (botInternals.sharedState.gamesPlayed >= botInternals.sharedState.willPlayGames) {
            return gracefullyDisconnectSocket(props)
          }

          if (canStartGame(props)) {
            return toWaitingBeforeStartingTheGame(props)
          }

          return new WaitingForPlayersState(props)
        }

        if (!serverEvent.data.playerCards) {
          throw new Error('Did not receive cards from the server')
        }

        return toWaitingBeforePlayingCard({ ...props, playerCards: serverEvent.data.playerCards })
      }
    }

    throw new UnexpectedEventError(event)
  }
}
