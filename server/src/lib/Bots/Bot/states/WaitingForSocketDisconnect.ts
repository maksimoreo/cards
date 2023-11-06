import { State, UnexpectedEventError } from '../StateMachine'
import { StateUpdateEvent } from '../events'
import HatlState from './HaltState'

export default class WaitingForSocketDisconnectState {
  public readonly type = 'waitingForSocketDisconnect'

  public constructor() {}

  public async reduce(event: StateUpdateEvent): Promise<State> {
    if (event.type === 'socketDisconnect') {
      return new HatlState()
    }

    throw new UnexpectedEventError(event)
  }
}
