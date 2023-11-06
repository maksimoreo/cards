import { VoidMessageHandler, VoidMessageHandlerReturnValue } from '../Router/MessageHandler'
import LeaveCurrentRoom from '../services/LeaveCurrentRoom'

export default class DisconnectHandler extends VoidMessageHandler {
  public async handle(): Promise<VoidMessageHandlerReturnValue> {
    if (this.currentUser.room) {
      LeaveCurrentRoom.call({ app: this.app, user: this.currentUser, room: this.currentUser.room })
    }

    this.app.users.removeById(this.socket.id)
  }
}
