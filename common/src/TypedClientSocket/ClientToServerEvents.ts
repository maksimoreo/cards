import { PlayerInactivityStrategy } from '../misc'

export interface EventToInputDataTypeMapT {
  setName: { name: string; color?: string }
  createRoom: { name: string; password?: string }
  joinRoom: { name: string; password?: string } | { id: string }
  getAllRooms: undefined | null
  leaveCurrentRoom: undefined | null
  sendMessage: { message: string }
  startGame: { cardsPool?: number[]; stepTimeout?: number; selectRowTimeout?: number } | undefined | null
  playCard: { card: number }
  selectRow: { rowIndex: number }
  updateGameOptions: {
    type: 'takeSix'
    mode?: 'normal' | 'expert'
    stepTimeout?: number
    playerInactivityStrategy?: PlayerInactivityStrategy
  }
  stopGame: undefined
}

type ClientToServerEvents = {
  [EventT in keyof EventToInputDataTypeMapT]: (
    data: EventToInputDataTypeMapT[EventT],
    acknowledgeCallback: (unknownResponse: unknown) => void
  ) => void
}

export default ClientToServerEvents

export type ClientToServerEventsKeys = keyof ClientToServerEvents
