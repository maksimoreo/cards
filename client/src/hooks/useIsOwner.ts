import { useSelector } from 'react-redux'
import { RootState } from '../app/store'
import { useSocket } from './useSocket'

export function useIsOwner() {
  const roomOwner = useSelector((state: RootState) => state.room?.owner)
  const { socket } = useSocket()

  return roomOwner?.id === socket.id
}
