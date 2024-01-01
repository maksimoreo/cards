import { USER_LEFT_REASON_SCHEMA } from 'common/src/TypedClientSocket/schemas'
import { z } from 'zod'

export type UsersLeftRoomReason = 'selfAction' | 'disconnected' | 'kickedForInactivity' | 'unknown' // | 'kickedByOwner' | 'kickedByVote'
const defaultUsersLeftRoomReason = 'unknown'
const usersLeftRoomReasonToChatMessageReason = {
  selfAction: 'selfAction',
  kickedForInactivity: 'kickedForInactivity',
  kickedByOwner: 'unknown',
  kickedByVote: 'unknown',
  disconnected: 'disconnected',
} as const
export function s2c_usersLeftReasonToChatMessageReason(
  serverProvidedReason: z.infer<typeof USER_LEFT_REASON_SCHEMA>,
): UsersLeftRoomReason {
  return usersLeftRoomReasonToChatMessageReason[serverProvidedReason] || defaultUsersLeftRoomReason
}
