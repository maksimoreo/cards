import { useRoom } from '../../../features/room/selectors'
import { useSocket } from '../../../hooks/useSocket'

export default interface UserIdentity {
  // Socket id with which this message was signed. Socket changes its id on reconnect.
  readonly id: string

  // Name with which this message was signed. User might have changed their name since this message was sent.
  readonly name: string
  readonly color: string

  readonly isCurrentUser: boolean
  readonly isRoomOwner: boolean
}

export function useUserIdentityCreator(): (user: { id: string; name: string; color: string }) => UserIdentity {
  const room = useRoom()
  const { socket } = useSocket()

  return (user) => ({
    ...user,
    isCurrentUser: user.id === socket.id,
    isRoomOwner: user.id === room?.owner.id,
  })
}
