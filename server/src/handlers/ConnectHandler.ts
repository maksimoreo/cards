import { ConnectHandler as BaseConnectHandler } from '../Router/EventHandler'
import { LOBBY_ROOM_NAME } from '../constants'
import User from '../models/User'

export default class ConnectHandler extends BaseConnectHandler {
  public async call(): Promise<void> {
    const { app, socket } = this
    const { botId } = socket.handshake.auth
    const isBot = app.botSystem?.isBot(botId)

    app.logger.info({
      message: `Connected ${socket.id}`,
      isSocketConnectionLog: true,
      socketId: socket.id,
      isBot,
    })

    socket.join(LOBBY_ROOM_NAME)

    const user = new User({ socket, name: socket.id, isBot })

    socket.data.user = user
    app.users.all.push(user)
  }
}
