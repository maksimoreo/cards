import { State } from '../StateMachine'

export default class HatlState implements State {
  public readonly type = 'halt'

  public async reduce(): Promise<State> {
    throw new Error('Tried reduce "Halt" state')
  }
}
