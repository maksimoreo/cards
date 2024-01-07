import { VoidEventHandler, VoidEventHandlerReturnValue } from '../Router/EventHandler'
import LeaveCurrentRoom from '../services/LeaveCurrentRoom'

export default class LeaveCurrentRoomHandler extends VoidEventHandler {
  public async handle(): Promise<VoidEventHandlerReturnValue> {
    if (!this.currentUser.room) {
      return { badRequest: 'Not in a room' }
    }

    LeaveCurrentRoom.call({ app: this.app, user: this.currentUser, room: this.currentUser.room })
  }
}
