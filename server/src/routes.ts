import App from './App'
import { Router } from './router'

import ConnectHandler from './handlers/ConnectHandler'
import CreateRoomHandler from './handlers/CreateRoomHandler'
import DisconnectHandler from './handlers/DisconnectHandler'
import EvalCommandHandler from './handlers/EvalHandler'
import GetAllRoomsHandler from './handlers/GetAllRoomsHandler'
import JoinRoomHandler from './handlers/JoinRoomHandler'
import LeaveCurrentRoomHandler from './handlers/LeaveCurrentRoomHandler'
import PlayCardHandler from './handlers/PlayCardHandler'
import SelectRowHandler from './handlers/SelectRowHandler'
import SendMessageHandler from './handlers/SendMessageHandler'
import SetNameHandler from './handlers/SetNameHandler'
import StartGameHandler from './handlers/StartGameHandler'
import StopGameHandler from './handlers/StopGameHandler'
import UpdateGameOptionsHandler from './handlers/UpdateGameOptionsHandler'

export default function defineRoutes(app: App): void {
  const router = new Router(app)
  router.draw({
    connect: ConnectHandler,
    messages: {
      eval: EvalCommandHandler,

      setName: SetNameHandler,

      createRoom: CreateRoomHandler,
      getAllRooms: GetAllRoomsHandler,
      joinRoom: JoinRoomHandler,
      leaveCurrentRoom: LeaveCurrentRoomHandler,

      sendMessage: SendMessageHandler,

      updateGameOptions: UpdateGameOptionsHandler,
      startGame: StartGameHandler,
      playCard: PlayCardHandler,
      selectRow: SelectRowHandler,
      stopGame: StopGameHandler,

      disconnect: DisconnectHandler,
    },
  })
}
