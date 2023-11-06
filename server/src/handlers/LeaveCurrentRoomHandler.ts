import { VoidMessageHandler, VoidMessageHandlerReturnValue } from '../Router/MessageHandler'
import LeaveCurrentRoom from '../services/LeaveCurrentRoom'

export default class LeaveCurrentRoomHandler extends VoidMessageHandler {
  public async handle(): Promise<VoidMessageHandlerReturnValue> {
    if (!this.currentUser.room) {
      return { badRequest: 'Not in a room' }
    }

    LeaveCurrentRoom.call({ app: this.app, user: this.currentUser, room: this.currentUser.room })
  }
}
