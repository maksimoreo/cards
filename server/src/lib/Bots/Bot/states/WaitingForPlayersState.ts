import BotInternals from '../BotInternals'
import { Room } from '../dataTypes'
import { StateUpdateEvent } from '../events'
import { State, UnexpectedEventError } from '../StateMachine'
import {
  canStartGame,
  gracefullyDisconnectSocket,
  toWaitingBeforePlayingCard,
  toWaitingBeforeStartingTheGame,
} from './shared'

interface WaitingForPlayersStateProps {
  readonly botInternals: BotInternals
  readonly room: Room
}

export default class WaitingForPlayersState {
  public readonly type = 'waitingForPlayers'

  constructor(public readonly props: WaitingForPlayersStateProps) {}

  public async reduce(event: StateUpdateEvent): Promise<State> {
    const { props } = this
    if (event.type === 'disconnectRequest') {
      return gracefullyDisconnectSocket(props)
    }

    if (event.type === 'serverEvent') {
      const { serverEvent } = event.props

      if (serverEvent.type === 's2c_userLeft') {
        return new WaitingForPlayersState({ ...props, room: serverEvent.data.newRoomState })
      }

      if (serverEvent.type === 's2c_userJoined' || serverEvent.type === 's2c_ownerLeft') {
        const newState = new WaitingForPlayersState({ ...props, room: serverEvent.data.newRoomState })

        if (canStartGame(newState.props)) {
          return toWaitingBeforeStartingTheGame(newState.props)
        }

        return newState
      }

      if (serverEvent.type === 's2c_userMessage') {
        return this
      }

      if (serverEvent.type === 's2c_gameStarted') {
        const { data } = serverEvent

        if (!data.playerCards) {
          throw new Error('Did not receive cards from the server')
        }

        return toWaitingBeforePlayingCard({ ...props, gameState: data.gameState, playerCards: data.playerCards })
      }
    }

    throw new UnexpectedEventError(event)
  }
}
