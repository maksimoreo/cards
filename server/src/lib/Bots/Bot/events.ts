import { ServerEventToDataTypeMapT } from 'common/src/TypedClientSocket/ServerToClientEvents'
import { ValueOf } from '../../../utils'

export type ServerEventT = ValueOf<{
  [Event in keyof ServerEventToDataTypeMapT]: {
    type: Event
    data: ServerEventToDataTypeMapT[Event]
  }
}>

export abstract class BaseEvent {
  public abstract readonly type: string

  public toString(): string {
    return this.type
  }
}

export class SocketConnectEvent extends BaseEvent {
  public readonly type = 'socketConnect'
}

export class SocketDisconnectEvent extends BaseEvent {
  public readonly type = 'socketDisconnect'
}

export class DisconnectRequestEvent extends BaseEvent {
  public readonly type = 'disconnectRequest'
}

export class TimerDoneEvent extends BaseEvent {
  public readonly type = 'timerDone'
}

interface ServerEventProps {
  readonly serverEvent: ServerEventT
}

export class ServerEvent extends BaseEvent {
  public readonly type = 'serverEvent'

  public constructor(public readonly props: ServerEventProps) {
    super()
  }

  public toString(): string {
    return `${this.type}: ${this.props.serverEvent.type}`
  }
}

export type StateUpdateEvent =
  | SocketConnectEvent
  | SocketDisconnectEvent
  | DisconnectRequestEvent
  | TimerDoneEvent
  | ServerEvent
