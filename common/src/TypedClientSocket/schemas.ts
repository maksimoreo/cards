import { z } from 'zod'

export const USER_SCHEMA = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
})

export const GAME_OPTIONS_SCHEMA = z.object({
  type: z.literal('takeSix'),
  mode: z.union([z.literal('normal'), z.literal('expert')]),
  stepTimeout: z.number(),
  playerInactivityStrategy: z.union([z.literal('forcePlay'), z.literal('moveToSpectators'), z.literal('kick')]),
})

export const ROOM_SCHEMA = z.object({
  id: z.string(),
  name: z.string(),
  owner: USER_SCHEMA,
  users: z.array(USER_SCHEMA),
  gameOptions: GAME_OPTIONS_SCHEMA,
})

export const CARD_SCHEMA = z.object({ value: z.number(), penaltyPoints: z.number() })

export const GAME_STATE_SCHEMA = z.object({
  rows: z.array(z.array(CARD_SCHEMA)),
  players: z.array(
    z.object({
      id: z.string(),
      penaltyPoints: z.number(),
      isActive: z.boolean(),
      user: USER_SCHEMA,
      hasSelectedCard: z.boolean(),
    })
  ),
  stepsLeft: z.number(),
})

export const GAME_STEP_SCHEMA = z.intersection(
  z.object({
    selectedCards: z.array(
      z.object({
        playerId: z.string(),
        card: CARD_SCHEMA,
      })
    ),
  }),
  z.union([
    z.object({
      waitingPlayer: z.string(),
    }),
    z.object({
      moves: z.array(
        z.object({
          playerId: z.string(),
          card: CARD_SCHEMA,
          rowIndex: z.number(),
          takesRow: z.boolean(),
        })
      ),
    }),
  ])
)

export const USER_LEFT_REASON_SCHEMA = z.union([
  z.literal('selfAction'),
  z.literal('kickedForInactivity'),
  z.literal('kickedByOwner'),
  z.literal('kickedByVote'),
  z.literal('disconnected'),
])

export const USER_MOVED_TO_SPECTATORS_REASON_SCHEMA = z.union([
  z.literal('inactivity'),
  z.literal('ownerAction'),
  z.literal('selfAction'),
])

export const USER_KICKED_REASON_SCHEMA = z.union([
  z.literal('inactivity'),
  z.literal('ownerAction'),
  z.literal('roomClosed'),
])

export const GAME_STOPPED_REASON_SCHEMA = z.union([
  z.literal('completed'),
  z.literal('playerInactivity'),
  z.literal('playerLeft'),
  z.literal('roomOwnerAction'),
  z.literal('roomClosed'),
])
export type GameStoppedReason = z.infer<typeof GAME_STOPPED_REASON_SCHEMA>
