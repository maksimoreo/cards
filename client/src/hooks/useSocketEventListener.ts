import { useEffect } from 'react'
import { z } from 'zod'

import {
  SERVER_NOTIFICATION_DATA_SCHEMA_MAP,
  ServerToClientEventsUnion,
} from 'common/src/TypedClientSocket/ServerToClientEvents'
import { useSocket } from './useSocket'

export default function useSocketEventListener<EventT extends ServerToClientEventsUnion>(
  event: EventT,
  callback: (data: z.infer<(typeof SERVER_NOTIFICATION_DATA_SCHEMA_MAP)[EventT]>) => void,
): void {
  const { socket } = useSocket()

  const handleEvent = (unknownData: unknown): void => {
    const dataSchema = SERVER_NOTIFICATION_DATA_SCHEMA_MAP[event]
    const data = dataSchema.parse(unknownData)

    callback(data)
  }

  useEffect(() => {
    socket.on.apply(socket, [event, handleEvent])

    return () => {
      socket.off.apply(socket, [event, handleEvent])
    }
  })
}
