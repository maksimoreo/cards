import { z } from 'zod'

import { ClientSocketT } from 'common/src/TypedClientSocket/ClientSocketT'
import { EventToInputDataTypeMapT } from 'common/src/TypedClientSocket/ClientToServerEvents'
import {
  EVENT_TO_OUTPUT_DATA_SCHEMA_MAP,
  EventToOutputDataSchemaMapT,
} from 'common/src/TypedClientSocket/EventToOutputDataSchemaMap'
import { wrapApiResponseDataSchema } from 'common/src/TypedClientSocket/emit'

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

          if (response.code === 'SUCCESS') {
            // Note: For some events, data property is unknown and might be undefined or not present (meaning, we don't care about the data for some events)
            resolve('data' in response ? response.data : undefined)

            return
          }

          reject(new UnsuccessfulSendError(response))
        },
      ])
    })
  }
}
