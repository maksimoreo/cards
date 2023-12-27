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
  s2c_userPlayedCard: (unknownData: unknown) => void
  s2c_gameStep: (unknownData: unknown) => void
  s2c_userJoined: (unknownData: unknown) => void
  s2c_userLeft: (unknownData: unknown) => void
  s2c_ownerLeft: (unknownData: unknown) => void
  s2c_gameStarted: (unknownData: unknown) => void
  s2c_userMessage: (unknownData: unknown) => void
  s2c_rooms: (unknownData: unknown) => void
  s2c_gameOptionsUpdated: (unknownData: unknown) => void
}

export type ServerToClientEventsUnion = keyof ServerToClientEvents

export const SERVER_NOTIFICATION_DATA_SCHEMA_MAP = {
  s2c_userPlayedCard: z.object({
    userId: z.string(),
  }),

  s2c_gameStep: z.object({
    step: GAME_STEP_SCHEMA,
    gameState: GAME_STATE_SCHEMA,
    playerCards: z.array(CARD_SCHEMA).optional(),
  }),

  s2c_userJoined: z.object({
    user: USER_SCHEMA,
    newRoomState: ROOM_SCHEMA,
  }),

  s2c_userLeft: z.object({
    userId: z.string(),
    newRoomState: ROOM_SCHEMA,
    game: GAME_STATE_SCHEMA.nullable(),
  }),

  s2c_ownerLeft: z.object({
    newOwner: USER_SCHEMA,
    newRoomState: ROOM_SCHEMA,
    game: GAME_STATE_SCHEMA.nullable(),
  }),

  s2c_gameStarted: z.object({
    gameState: GAME_STATE_SCHEMA,
    playerCards: z.array(CARD_SCHEMA).optional(),
  }),

  s2c_userMessage: z.object({
    message: z.string(),
    user: USER_SCHEMA,
  }),

  s2c_rooms: z.object({
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

  s2c_gameOptionsUpdated: z.object({
    gameOptions: GAME_OPTIONS_SCHEMA,
  }),
}

export type ServerEventToDataSchemaMapT = typeof SERVER_NOTIFICATION_DATA_SCHEMA_MAP

export const SERVER_TO_CLIENT_EVENTS: (keyof ServerEventToDataSchemaMapT)[] = [
  's2c_userPlayedCard',
  's2c_gameStep',
  's2c_userJoined',
  's2c_userLeft',
  's2c_ownerLeft',
  's2c_gameStarted',
  's2c_userMessage',
  's2c_rooms',
  's2c_gameOptionsUpdated',
]

export function isServerEvent(event: string): event is keyof ServerEventToDataSchemaMapT {
  // https://github.com/microsoft/TypeScript/issues/26255
  // https://github.com/microsoft/TypeScript/issues/31018
  return SERVER_TO_CLIENT_EVENTS.includes(event as keyof ServerEventToDataSchemaMapT)
}

export type ServerEventToDataTypeMapT = {
  [Event in keyof ServerEventToDataSchemaMapT]: z.infer<ServerEventToDataSchemaMapT[Event]>
}
