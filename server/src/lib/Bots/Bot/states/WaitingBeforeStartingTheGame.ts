import BotInternals from '../BotInternals'
import { State, UnexpectedEventError } from '../StateMachine'
import { Room } from '../dataTypes'
import { StateUpdateEvent } from '../events'
import WaitingForPlayersState from './WaitingForPlayersState'
import { canStartGame, gracefullyDisconnectSocket, toWaitingBeforePlayingCard } from './shared'

interface WaitingBeforeStartingTheGameStateProps {
  readonly botInternals: BotInternals
  readonly room: Room
  readonly timer: NodeJS.Timeout
}

export default class WaitingBeforeStartingTheGameState {
  public readonly type = 'waitingBeforeStartingTheGame'

  public constructor(public readonly props: WaitingBeforeStartingTheGameStateProps) {}

  public async reduce(event: StateUpdateEvent): Promise<State> {
    const { props } = this

    if (event.type === 'disconnectRequest') {
      clearTimeout(props.timer)
      return gracefullyDisconnectSocket(props)
    }

    const { botInternals } = props

    if (event.type === 'timerDone') {
      const data = await botInternals.socketEmit('startGame', null)

      if (!data.playerCards) {
        clearTimeout(props.timer)
        throw new Error('Did not receive cards from the server')
      }

      clearTimeout(props.timer)
      return toWaitingBeforePlayingCard({ ...props, playerCards: data.playerCards, gameState: data.game })
    }

    if (event.type === 'serverEvent') {
      const { serverEvent } = event.props

      if (serverEvent.type === 's2c_userMessage' || serverEvent.type === 's2c_gameStopped') {
        return this
      }

      if (serverEvent.type === 's2c_userJoined') {
        return new WaitingBeforeStartingTheGameState({ ...props, room: serverEvent.data.newRoomState })
      }

      if (serverEvent.type === 's2c_usersLeft') {
        if (canStartGame(props)) {
          return new WaitingBeforeStartingTheGameState({ ...props, room: serverEvent.data.newRoomState })
        } else {
          clearTimeout(props.timer)
          return new WaitingForPlayersState({ ...props, room: serverEvent.data.newRoomState })
        }
      }
    }

    throw new UnexpectedEventError(event)
  }
}
