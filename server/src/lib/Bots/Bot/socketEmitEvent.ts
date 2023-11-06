import { z } from 'zod'

import { ClientSocketT } from 'common/src/TypedClientSocket/ClientSocketT'
import { EventToInputDataTypeMapT } from 'common/src/TypedClientSocket/ClientToServerEvents'
import {
  EVENT_TO_OUTPUT_DATA_SCHEMA_MAP,
  EventToOutputDataSchemaMapT,
} from 'common/src/TypedClientSocket/EventToOutputDataSchemaMap'
import { wrapApiResponseDataSchema } from 'common/src/TypedClientSocket/send'

export class UnsuccessfulSendError extends Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(public readonly response: any) {
    super(`Send was not successful. Server response code: '${response.code}', message: '${response.message}'`)

    Object.setPrototypeOf(this, UnsuccessfulSendError.prototype)
  }
}

// This function returns a function that:
// Socket is binded to the function
// Function returns Response Data if Response is successful
// Function throws Error with Response if Response is unsuccessful
export function createSocketEventEmittingFunction(socket: ClientSocketT) {
  return function emit<EventT extends keyof EventToInputDataTypeMapT>(
    event: EventT,
    data: EventToInputDataTypeMapT[EventT],
  ): Promise<z.infer<EventToOutputDataSchemaMapT[EventT]>> {
    return new Promise((resolve, reject) => {
      socket.emit.apply(socket, [
        event,
        data,
        (unknownResponse: unknown): void => {
          const dataSchema = EVENT_TO_OUTPUT_DATA_SCHEMA_MAP[event]
          const responseSchema = wrapApiResponseDataSchema(dataSchema)
          const response = responseSchema.parse(unknownResponse)

          // NOTE: `'data' in response` check should not be necessary.
          // 'data' property is guaranteed to exist when 'code' is 'SUCCESS'.
          if (response.code === 'SUCCESS' && 'data' in response) {
            resolve(response.data)

            return
          }

          reject(new UnsuccessfulSendError(response))
        },
      ])
    })
  }
}
