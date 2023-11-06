import { z } from 'zod'

import {
  CARD_SCHEMA,
  GAME_OPTIONS_SCHEMA,
  GAME_STATE_SCHEMA,
  GAME_STEP_SCHEMA,
  ROOM_SCHEMA,
  USER_SCHEMA,
} from './schemas'

export default interface ServerToClientEvents {
  notifyUserPlayedCard: (unknownData: unknown) => void
  notifyGameStep: (unknownData: unknown) => void
  notifyUserJoined: (unknownData: unknown) => void
  notifyUserLeft: (unknownData: unknown) => void
  notifyOwnerLeft: (unknownData: unknown) => void
  notifyGameStarted: (unknownData: unknown) => void
  notifyUserMessage: (unknownData: unknown) => void
  rooms: (unknownData: unknown) => void
  gameOptionsUpdated: (unknownData: unknown) => void
}

export type ServerToClientEventsUnion = keyof ServerToClientEvents

export const SERVER_NOTIFICATION_DATA_SCHEMA_MAP = {
  notifyUserPlayedCard: z.object({
    userId: z.string(),
  }),

  notifyGameStep: z.object({
    step: GAME_STEP_SCHEMA,
    gameState: GAME_STATE_SCHEMA,
    playerCards: z.array(CARD_SCHEMA).optional(),
  }),

  notifyUserJoined: z.object({
    user: USER_SCHEMA,
    newRoomState: ROOM_SCHEMA,
  }),

  notifyUserLeft: z.object({
    userId: z.string(),
    newRoomState: ROOM_SCHEMA,
    game: GAME_STATE_SCHEMA.nullable(),
  }),

  notifyOwnerLeft: z.object({
    newOwner: USER_SCHEMA,
    newRoomState: ROOM_SCHEMA,
    game: GAME_STATE_SCHEMA.nullable(),
  }),

  notifyGameStarted: z.object({
    gameState: GAME_STATE_SCHEMA,
    playerCards: z.array(CARD_SCHEMA).optional(),
  }),

  notifyUserMessage: z.object({
    message: z.string(),
    user: USER_SCHEMA,
  }),

  rooms: z.object({
    rooms: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        userCount: z.number(),
        owner: z.string(),
        isPlaying: z.boolean(),
      })
    ),
  }),

  gameOptionsUpdated: z.object({
    gameOptions: GAME_OPTIONS_SCHEMA,
  }),
}

export type ServerEventToDataSchemaMapT = typeof SERVER_NOTIFICATION_DATA_SCHEMA_MAP

export const SERVER_TO_CLIENT_EVENTS: (keyof ServerEventToDataSchemaMapT)[] = [
  'notifyUserPlayedCard',
  'notifyGameStep',
  'notifyUserJoined',
  'notifyUserLeft',
  'notifyOwnerLeft',
  'notifyGameStarted',
  'notifyUserMessage',
  'rooms',
  'gameOptionsUpdated',
]

export function isServerEvent(event: string): event is keyof ServerEventToDataSchemaMapT {
  // https://github.com/microsoft/TypeScript/issues/26255
  // https://github.com/microsoft/TypeScript/issues/31018
  return SERVER_TO_CLIENT_EVENTS.includes(event as keyof ServerEventToDataSchemaMapT)
}

export type ServerEventToDataTypeMapT = {
  [Event in keyof ServerEventToDataSchemaMapT]: z.infer<ServerEventToDataSchemaMapT[Event]>
}
