import { z } from 'zod'
import { EventToInputDataTypeMapT } from './ClientToServerEvents'
import { CARD_SCHEMA, GAME_STATE_SCHEMA, GAME_STEP_SCHEMA, ROOM_SCHEMA } from './schemas'

export const EVENT_TO_OUTPUT_DATA_SCHEMA_MAP = {
  setName: z.unknown(),

  createRoom: z.object({
    room: ROOM_SCHEMA,
  }),

  joinRoom: z.object({
    room: ROOM_SCHEMA,
    game: z
      .object({
        state: GAME_STATE_SCHEMA,
        playersWithSelectedCard: z.array(z.string()),
        lastStep: GAME_STEP_SCHEMA.optional(),
      })
      .optional(),
  }),

  getAllRooms: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      userCount: z.number(),
      owner: z.string(),
      isPlaying: z.boolean(),
    })
  ),

  sendMessage: z.unknown(),

  leaveCurrentRoom: z.unknown(),

  startGame: z.object({
    gameState: GAME_STATE_SCHEMA,
    playerCards: z.array(CARD_SCHEMA).optional(),
  }),

  playCard: z.unknown(),

  selectRow: z.unknown(),

  updateGameOptions: z.unknown(),

  stopGame: z.unknown(),
} satisfies Record<keyof EventToInputDataTypeMapT, z.ZodSchema>

export type EventToOutputDataSchemaMapT = typeof EVENT_TO_OUTPUT_DATA_SCHEMA_MAP
