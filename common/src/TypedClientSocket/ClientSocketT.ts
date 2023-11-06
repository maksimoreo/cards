import { Socket } from 'socket.io-client'

import ClientToServerEvents from './ClientToServerEvents'
import ServerToClientEvents from './ServerToClientEvents'

export type ClientSocketT = Socket<ServerToClientEvents, ClientToServerEvents>
