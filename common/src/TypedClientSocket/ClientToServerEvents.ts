export interface EventToInputDataTypeMapT {
  setName: { name: string; color: string }
  createRoom: { name: string; password?: string }
  joinRoom: { name: string } | { id: string }
  getAllRooms: undefined | null
  leaveCurrentRoom: undefined | null
  sendMessage: { message: string }
  startGame: undefined | null
  playCard: { card: number }
  selectRow: { rowIndex: number }
  updateGameOptions: { type: 'takeSix', mode: 'normal' | 'expert' }
}

type ClientToServerEvents = {
  [MesssageName in keyof EventToInputDataTypeMapT]: (
    data: EventToInputDataTypeMapT[MesssageName],
    acknowledgeCallback: (unknownResponse: unknown) => void,
  ) => void
}

export default ClientToServerEvents

export type ClientToServerEventsKeys = keyof ClientToServerEvents
