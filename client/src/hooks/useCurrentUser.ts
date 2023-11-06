import { useSelector } from 'react-redux'
import { RootState } from '../app/store'
import { useSocket } from './useSocket'

export default function useCurrentUser() {
  const { socket } = useSocket()
  const currentUser = useSelector((state: RootState) => state.currentUser)

  return { id: socket.id, ...currentUser }
}
