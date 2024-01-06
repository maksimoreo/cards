import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from './app/store'
import { addMessage } from './features/chat/chatSlice'
import { useSocket } from './hooks/useSocket'
import Login from './screens/Login'
import RoomForm from './screens/RoomForm/RoomForm'
import RoomView from './screens/RoomView/RoomView'
import RoomsList from './screens/RoomsList/RoomsList'
import { assertUnreachable } from './utils'

export default function AppMainView(): JSX.Element {
  const dispatch = useDispatch()
  const screen = useSelector((state: RootState) => state.screen)
  const { socket } = useSocket()

  const handleSocketConnect = (): void => {
    dispatch(addMessage({ type: 'localNotification', data: { text: 'Connected to the server' } }))
  }

  const handleSocketDisconnect = (): void => {
    dispatch(addMessage({ type: 'localNotification', data: { text: 'Disconnected from the server' } }))
  }

  useEffect(() => {
    socket.on('connect', handleSocketConnect)

    socket.on('disconnect', handleSocketDisconnect)

    return () => {
      socket.off('connect', handleSocketConnect)
      socket.off('disconnect', handleSocketDisconnect)
    }
  }, [])

  if (screen == 'login') {
    return <Login />
  } else if (screen == 'rooms') {
    return <RoomsList />
  } else if (screen == 'createRoom') {
    return <RoomForm />
  } else if (screen == 'room') {
    return <RoomView />
  }
  assertUnreachable(screen)
}
