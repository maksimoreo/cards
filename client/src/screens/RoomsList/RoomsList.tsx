import { useEffect, useState } from 'react'

import { faPlus, faRefresh } from '@fortawesome/free-solid-svg-icons'
import { useDispatch } from 'react-redux'
import Button from '../../components/Button'
import MainViewHeader from '../../components/MainViewHeader'
import { addMessage } from '../../features/chat/chatSlice'
import { setGame } from '../../features/game/gameSlice'
import { setRoom } from '../../features/room/roomSlice'
import { setScreen } from '../../features/screen/screenSlice'
import { useSocket } from '../../hooks/useSocket'
import useSocketEventListener from '../../hooks/useSocketEventListener'
import RoomListItem from './RoomListItem'

export interface Room {
  name: string
  userCount: number
  owner: string
}

export default function RoomsList(): JSX.Element {
  const { send } = useSocket()
  const dispatch = useDispatch()
  const [rooms, setRooms] = useState<readonly Room[]>([])

  const fetchAllRooms = (): void => {
    send('getAllRooms', null, (response) => {
      if (response.code === 'SUCCESS') {
        setRooms(response.data)
      }
    })
  }

  const handleJoinRoom = (name: string): void => {
    send('joinRoom', { name }, (response) => {
      if (response.code === 'SUCCESS') {
        const game = response.data.game
        dispatch(
          setGame(
            game
              ? {
                  type: 'takesix',
                  gameState: game.state,
                  playersWithSelectedCard: game.playersWithSelectedCard,
                  lastStep: game.lastStep,
                }
              : null,
          ),
        )
        dispatch(setRoom(response.data.room))
        dispatch(setScreen('room'))
        dispatch(addMessage({ type: 'currentUserJoinedRoom', data: { roomName: response.data.room.name } }))
      }
    })
  }

  useEffect(() => {
    fetchAllRooms()
  }, [])

  useSocketEventListener('s2c_rooms', ({ rooms }): void => {
    setRooms(rooms)
  })

  return (
    <div>
      <MainViewHeader>
        <header className='flex h-12 flex-row items-center md:ml-4'>
          <h1 className='font-bold text-neutral-200'>Rooms</h1>
        </header>
      </MainViewHeader>

      <div className='mb-2 ml-auto mt-12 flex flex-row gap-2 border-b border-b-neutral-800'>
        <Button iconProps={{ icon: faRefresh }} onClick={(): void => fetchAllRooms()}>
          Refresh
        </Button>

        <Button iconProps={{ icon: faPlus }} color='success' onClick={() => dispatch(setScreen('createRoom'))}>
          New Room
        </Button>
      </div>

      <div className='flex flex-col divide-y divide-gray-700'>
        {rooms.map((room) => (
          <RoomListItem key={room.name} room={room} onJoin={handleJoinRoom} />
        ))}
      </div>
    </div>
  )
}
