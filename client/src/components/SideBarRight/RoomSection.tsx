import { faRightFromBracket, faStop } from '@fortawesome/free-solid-svg-icons'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../app/store'
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
  const gamePlayers = useSelector((state: RootState) => state.game?.game.players)

  const isUserSpectator: (id: string) => boolean = (id: string) =>
    !!gamePlayers && !gamePlayers?.find((gamePlayer) => gamePlayer.id === id)

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
          <UserNameFromUser user={room.owner} isSpectator={isUserSpectator(room.owner.id)} />
        </li>

        {room.users.map((user) => (
          <li key={user.id} className='px-3 py-1'>
            <UserNameFromUser user={user} isSpectator={isUserSpectator(user.id)} />
          </li>
        ))}
      </ul>

      {isRoomOwner && gamePlayers && gamePlayers.length >= 2 && (
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
