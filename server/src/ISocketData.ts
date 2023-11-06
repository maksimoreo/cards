import socketIo from 'socket.io'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'

import User from './models/User'
import { ServerToClientEvents } from './ServerToClientEvents'

export interface ISocketData {
  user: User
}

export type SocketT = socketIo.Socket<DefaultEventsMap, ServerToClientEvents, DefaultEventsMap, ISocketData>

export const socketIoServerConstructor = socketIo.Server<
  DefaultEventsMap,
  ServerToClientEvents,
  DefaultEventsMap,
  ISocketData
>

export type ServerT = socketIo.Server<DefaultEventsMap, ServerToClientEvents, DefaultEventsMap, ISocketData>
