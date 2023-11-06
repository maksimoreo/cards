import BotInternals from '../BotInternals'
import { State, UnexpectedEventError } from '../StateMachine'
import { Room } from '../dataTypes'
import { StateUpdateEvent } from '../events'
import { gracefullyDisconnectSocket, toWaitingBeforePlayingCard } from './shared'

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
        throw new Error('Did not receive cards from the server')
      }

      return toWaitingBeforePlayingCard({ ...props, playerCards: data.playerCards, gameState: data.gameState })
    }

    if (event.type === 'serverEvent') {
      const { serverEvent } = event.props

      if (serverEvent.type === 'notifyUserMessage' || serverEvent.type === 'notifyUserPlayedCard') {
        return this
      }

      if (serverEvent.type === 'notifyUserJoined' || serverEvent.type === 'notifyUserLeft') {
        return new WaitingBeforeStartingTheGameState({ ...props, room: serverEvent.data.newRoomState })
      }
    }

    throw new UnexpectedEventError(event)
  }
}
