import { useEffect } from 'react'
import { z } from 'zod'

import {
  SERVER_NOTIFICATION_DATA_SCHEMA_MAP,
  ServerToClientEventsUnion,
} from 'common/src/TypedClientSocket/ServerToClientEvents'
import { useSocket } from './useSocket'

export default function useSocketEventListener<MessageT extends ServerToClientEventsUnion>(
  message: MessageT,
  callback: (data: z.infer<(typeof SERVER_NOTIFICATION_DATA_SCHEMA_MAP)[MessageT]>) => void,
): void {
  const { socket } = useSocket()

  const handleMessage = (unknownData: unknown): void => {
    const dataSchema = SERVER_NOTIFICATION_DATA_SCHEMA_MAP[message]
    const data = dataSchema.parse(unknownData)

    callback(data)
  }

  useEffect(() => {
    socket.on.apply(socket, [message, handleMessage])

    return () => {
      socket.off.apply(socket, [message, handleMessage])
    }
  })
}
