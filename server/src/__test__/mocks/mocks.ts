import { Socket } from 'socket.io'
import App from '../../App'
import UsersDatabase from '../../db/UsersDatabase'

class SocketIoFake {
  constructor() {}

  public to() {
    return this
  }

  public emit() {}
}

export function createAppFake(): App {
  return {
    io: new SocketIoFake(),
    rooms: [],
    users: new UsersDatabase(),
  } as unknown as App
}

export function createSocketFake(): Socket {
  return {} as unknown as Socket
}
