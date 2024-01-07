import { VoidEventHandler, VoidEventHandlerReturnValue } from '../Router/EventHandler'
import LeaveCurrentRoom from '../services/LeaveCurrentRoom'

export default class DisconnectHandler extends VoidEventHandler {
  public async handle(): Promise<VoidEventHandlerReturnValue> {
    if (this.currentUser.room) {
      LeaveCurrentRoom.call({ app: this.app, user: this.currentUser, room: this.currentUser.room })
    }

    this.app.users.removeById(this.socket.id)
  }
}
