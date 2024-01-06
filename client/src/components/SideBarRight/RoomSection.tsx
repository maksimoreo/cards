import { faRightFromBracket, faStop } from '@fortawesome/free-solid-svg-icons'
import { useDispatch } from 'react-redux'
import { Room } from '../../commonTypes'
import { addMessage } from '../../features/chat/chatSlice'
import { setGame } from '../../features/game/gameSlice'
import { setRoom } from '../../features/room/roomSlice'
import { setScreen } from '../../features/screen/screenSlice'
import { useIsOwner } from '../../hooks/useIsOwner'
import { useSocket } from '../../hooks/useSocket'
import Button from '../Button'
import UserNameFromUser from '../Chat/UserName/UserNameFromUser'

interface Props {
  readonly room: Room
}

export default function RoomSection({ room }: Props) {
  const dispatch = useDispatch()
  const { send } = useSocket()
  const isRoomOwner = useIsOwner()

  const handleStopGame = (): void => {
    send('stopGame', undefined, (response) => {
      if (response.code === 'SUCCESS') {
        dispatch(setGame(null))
      }
    })
  }

  const handleLeave = (): void => {
    send('leaveCurrentRoom', null, (response) => {
      if (response.code === 'SUCCESS') {
        dispatch(setRoom(null))
        dispatch(setScreen('rooms'))

        dispatch(
          addMessage({ type: 'currentUserLeftRoom', data: { roomName: room?.name ?? '', reason: 'selfAction' } }),
        )
      }
    })
  }

  return (
    <>
      <p className='ml-2 text-neutral-400'>
        Currently in <span className='font-bold text-neutral-200'>{room.name}</span> with:
      </p>

      <ul className='mt-4'>
        <li className='px-3 py-1'>
          <UserNameFromUser user={room.owner} />
        </li>

        {room.users.map((user) => (
          <li key={user.id} className='px-3 py-1'>
            <UserNameFromUser user={user} />
          </li>
        ))}
      </ul>

      {isRoomOwner && (
        <Button iconProps={{ icon: faStop }} color='error' onClick={handleStopGame} className='mt-2'>
          Stop game
        </Button>
      )}

      <Button iconProps={{ icon: faRightFromBracket }} color='error' onClick={handleLeave} className=''>
        Leave
      </Button>
    </>
  )
}
