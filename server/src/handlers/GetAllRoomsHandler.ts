import { MessageHandlerReturnValue, ResponseReturningMessageHandler } from '../Router/MessageHandler'

type GetAllRoomsResponseT = {
  id: string
  name: string
  userCount: number
  owner: string
  isPlaying: boolean
}[]

export default class GetAllRoomsHandler extends ResponseReturningMessageHandler<GetAllRoomsResponseT> {
  public async handle(): Promise<MessageHandlerReturnValue<GetAllRoomsResponseT>> {
    return {
      data: this.app.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        userCount: room.allUsers.length,
        owner: room.owner.name,
        isPlaying: !!room.game,
      })),
    }
  }
}
