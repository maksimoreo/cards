import { z } from 'zod'

import {
  CARD_SCHEMA,
  GAME_OPTIONS_SCHEMA,
  GAME_STATE_SCHEMA,
  GAME_STEP_SCHEMA,
  ROOM_SCHEMA,
  USER_KICKED_REASON_SCHEMA,
  USER_LEFT_REASON_SCHEMA,
  USER_MOVED_TO_SPECTATORS_REASON_SCHEMA,
  USER_SCHEMA,
} from './schemas'

export default interface ServerToClientEvents {
  s2c_userPlayedCard: (unknownData: unknown) => void
  s2c_gameStep: (unknownData: unknown) => void
  s2c_userJoined: (unknownData: unknown) => void
  s2c_userLeft: (unknownData: unknown) => void
  s2c_usersLeft: (unknownData: unknown) => void
  s2c_ownerLeft: (unknownData: unknown) => void
  s2c_gameStarted: (unknownData: unknown) => void
  s2c_gameStopped: (unknownData: unknown) => void
  s2c_userMessage: (unknownData: unknown) => void
  s2c_rooms: (unknownData: unknown) => void
  s2c_gameOptionsUpdated: (unknownData: unknown) => void
  s2c_usersMovedToSpectators: (unknownData: unknown) => void
  s2c_youHaveBeenMovedToSpectators: (unknownData: unknown) => void
  s2c_youHaveBeenKicked: (unknownData: unknown) => void
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
    reason: USER_LEFT_REASON_SCHEMA,
    newRoomState: ROOM_SCHEMA,
    game: GAME_STATE_SCHEMA.nullable(),
  }),

  s2c_usersLeft: z.object({
    userIds: z.array(z.string()),
    reason: USER_LEFT_REASON_SCHEMA,
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

  s2c_gameStopped: z.object({
    reason: z.string(),
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

  s2c_usersMovedToSpectators: z.object({
    reason: USER_MOVED_TO_SPECTATORS_REASON_SCHEMA,
    userIds: z.array(z.string()),
    newRoomState: ROOM_SCHEMA,
    game: GAME_STATE_SCHEMA.nullable(),
  }),

  s2c_youHaveBeenMovedToSpectators: z.object({
    reason: USER_MOVED_TO_SPECTATORS_REASON_SCHEMA,
    newRoomState: ROOM_SCHEMA,
    game: GAME_STATE_SCHEMA.nullable(),
  }),

  s2c_youHaveBeenKicked: z.object({
    reason: USER_KICKED_REASON_SCHEMA,
  }),
}

export type ServerEventToDataSchemaMapT = typeof SERVER_NOTIFICATION_DATA_SCHEMA_MAP

export const SERVER_TO_CLIENT_EVENTS: (keyof ServerEventToDataSchemaMapT)[] = [
  's2c_userPlayedCard',
  's2c_gameStep',
  's2c_userJoined',
  's2c_userLeft',
  's2c_usersLeft',
  's2c_ownerLeft',
  's2c_gameStarted',
  's2c_gameStopped',
  's2c_userMessage',
  's2c_rooms',
  's2c_gameOptionsUpdated',
  's2c_usersMovedToSpectators',
  's2c_youHaveBeenMovedToSpectators',
  's2c_youHaveBeenKicked',
]

export function isServerEvent(event: string): event is keyof ServerEventToDataSchemaMapT {
  // https://github.com/microsoft/TypeScript/issues/26255
  // https://github.com/microsoft/TypeScript/issues/31018
  return SERVER_TO_CLIENT_EVENTS.includes(event as keyof ServerEventToDataSchemaMapT)
}

export type ServerEventToDataTypeMapT = {
  [Event in keyof ServerEventToDataSchemaMapT]: z.infer<ServerEventToDataSchemaMapT[Event]>
}
