import App from '../App'
import { LOBBY_ROOM_NAME } from '../constants'
import { decorateGlobalRoom } from '../decorators/RoomDecorator'

interface Props {
  readonly app: App
}

// TODO: Make relaxed, dont send a lot of events within short time, send at most one of this event every second
export default class ScheduleRoomsEventToLobbyUsers {
  public static call(props: Props): void {
    new ScheduleRoomsEventToLobbyUsers(props).call()
  }

  public constructor(private readonly props: Props) {}

  public call(): void {
    this.props.app.io.to(LOBBY_ROOM_NAME).emit('s2c_rooms', {
      rooms: this.props.app.rooms.map((room) => decorateGlobalRoom(room)),
    })
  }
}
