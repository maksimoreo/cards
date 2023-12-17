import { sample } from 'lodash'
import BotInternals from '../BotInternals'
import { State, UnexpectedEventError } from '../StateMachine'
import { Card, GameState, Room } from '../dataTypes'
import { StateUpdateEvent } from '../events'
import WaitingForGameStepState from './WaitingForGameStep'
import { gracefullyDisconnectSocket } from './shared'

interface WaitingBeforePlayingCardStateProps {
  readonly botInternals: BotInternals
  readonly room: Room
  readonly gameState: GameState
  readonly playerCards: readonly Card[]
  readonly timer: NodeJS.Timeout
}

export default class WaitingBeforePlayingCardState {
  public readonly type = 'waitingBeforePlayingCard'

  public constructor(public readonly props: WaitingBeforePlayingCardStateProps) {}

  public async reduce(event: StateUpdateEvent): Promise<State> {
    const { props } = this
    const { botInternals } = props

    if (event.type === 'disconnectRequest') {
      return gracefullyDisconnectSocket(props)
    }

    if (event.type === 'timerDone') {
      const cardValue = (sample(props.playerCards) as Card).value

      await botInternals.socketEmit('playCard', { card: cardValue })

      return new WaitingForGameStepState(props)
    }

    if (event.type === 'serverEvent') {
      const { serverEvent } = event.props

      if (serverEvent.type === 's2c_userPlayedCard' || serverEvent.type === 's2c_userMessage') {
        return this
      }

      if (
        serverEvent.type === 's2c_userJoined' ||
        serverEvent.type === 's2c_userLeft' ||
        serverEvent.type === 's2c_ownerLeft'
      ) {
        return new WaitingBeforePlayingCardState({ ...props, room: serverEvent.data.newRoomState })
      }
    }

    throw new UnexpectedEventError(event)
  }
}
