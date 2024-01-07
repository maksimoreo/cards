import { z } from 'zod'

import { ClientSocketT } from './ClientSocketT'
import { EventToInputDataTypeMapT } from './ClientToServerEvents'
import { EVENT_TO_OUTPUT_DATA_SCHEMA_MAP, EventToOutputDataSchemaMapT } from './EventToOutputDataSchemaMap'

export const RESPONSE_CODE_SUCCESS = 'SUCCESS'
export type ResponseCodeSuccess = typeof RESPONSE_CODE_SUCCESS

export const RESPONSE_CODE_BAD_REQUEST = 'BAD_REQUEST'
export type ResponseCodeBadRequest = typeof RESPONSE_CODE_BAD_REQUEST

export const RESPONSE_CODE_SERVER_ERROR = 'SERVER_ERROR'
export type ResponseCodeServerError = typeof RESPONSE_CODE_SERVER_ERROR

// See response generation on the server side
export function wrapApiResponseDataSchema<
  SchemaT extends EventToOutputDataSchemaMapT[keyof EventToOutputDataSchemaMapT]
>(dataSchema: SchemaT) {
  return z.discriminatedUnion('code', [
    z.object({
      code: z.literal(RESPONSE_CODE_SUCCESS),
      data: dataSchema,
    }),

    z.object({
      code: z.literal(RESPONSE_CODE_BAD_REQUEST),
      message: z.string(),
      validationErrors: z.array(z.any()), // TODO: Remove .any()
    }),

    z.object({
      code: z.literal(RESPONSE_CODE_SERVER_ERROR),
    }),
  ])
}

export function createSocketEventEmitter(socket: ClientSocketT) {
  return function emit<EventT extends keyof EventToInputDataTypeMapT>(
    event: EventT,
    data: EventToInputDataTypeMapT[EventT],
    onResponse: (response: ApiResponse<EventT>) => void
  ): void {
    socket.emit.apply(socket, [
      event,
      data,
      (unknownResponse: unknown): void => {
        const dataSchema = EVENT_TO_OUTPUT_DATA_SCHEMA_MAP[event]
        const responseSchema = wrapApiResponseDataSchema(dataSchema)
        const response = responseSchema.parse(unknownResponse)

        onResponse(response)
      },
    ])
  }
}

export type ApiResponse<EventT extends keyof EventToInputDataTypeMapT> = z.infer<
  ReturnType<typeof wrapApiResponseDataSchema<(typeof EVENT_TO_OUTPUT_DATA_SCHEMA_MAP)[EventT]>>
>
