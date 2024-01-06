import { uniqueId } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../app/store'
import { addMessage, updateDeliveryStatus } from '../../features/chat/chatSlice'
import { useRoom } from '../../features/room/selectors'
import useCurrentUser from '../../hooks/useCurrentUser'
import { useSocket } from '../../hooks/useSocket'
import useSocketEventListener from '../../hooks/useSocketEventListener'
import { ChatView } from './ChatView'
import { useUserIdentityCreator } from './UserName/UserIdentity'

export function Chat(): JSX.Element {
  const dispatch = useDispatch()
  const { socket, send } = useSocket()
  const room = useRoom()
  const currentUser = useCurrentUser()
  const createUserIdentity = useUserIdentityCreator()
  const messages = useSelector((state: RootState) => state.chat.messages)

  const handleMessageFormSubmit = (message: string): void => {
    const id = uniqueId()

    dispatch(
      addMessage({
        id,
        type: 'localUserMessage',
        data: {
          text: message,
          sender: createUserIdentity(currentUser),
          deliveryStatus: 'pending',
        },
      }),
    )

    send('sendMessage', { message }, (response) => {
      if (response.code === 'SUCCESS') {
        dispatch(updateDeliveryStatus({ id, deliveryStatus: 'delivered' }))

        // TODO: After acknowledge, move message to the bottom of the chat

        return
      }

      dispatch(updateDeliveryStatus({ id, deliveryStatus: 'error' }))
    })
  }

  useSocketEventListener('s2c_userMessage', (data): void => {
    dispatch(
      addMessage({
        type: 'remoteUserMessage',
        data: {
          text: data.message,
          sender: createUserIdentity(data.user),
        },
      }),
    )
  })

  return (
    <ChatView
      messages={messages}
      onMessageFormSubmit={handleMessageFormSubmit}
      connected={socket.connected}
      messageFormDisabled={!room}
    />
  )
}
