import { faRightToBracket, faUser, faUserGroup, faUsers } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Button from '../../components/Button'
import { Room } from './RoomsList'

interface Props {
  room: Room
  onJoin: (name: string) => void
}

export default function RoomListItem({ room, onJoin }: Props): JSX.Element {
  return (
    <div className='flex flex-row items-center hover:bg-white/5'>
      <span className='ml-6 font-bold text-gray-200'>{room.name}</span>

      <div className='ml-auto flex flex-row items-center gap-2 text-gray-500'>
        {room.userCount}

        {room.userCount <= 1 ? (
          <FontAwesomeIcon icon={faUser} />
        ) : room.userCount == 2 ? (
          <FontAwesomeIcon icon={faUserGroup} />
        ) : (
          <FontAwesomeIcon icon={faUsers} />
        )}
      </div>

      <Button onClick={(): void => onJoin(room.name)} iconProps={{ icon: faRightToBracket }} className='ml-4 mr-2'>
        Join
      </Button>
    </div>
  )
}
