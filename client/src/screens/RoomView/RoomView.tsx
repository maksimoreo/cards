import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../app/store'
import { useUserIdentityCreator } from '../../components/Chat/UserName/UserIdentity'
import UserNameFromUser from '../../components/Chat/UserName/UserNameFromUser'
import { s2c_usersLeftReasonToChatMessageReason } from '../../components/Chat/lines/utils'
import MainViewHeader from '../../components/MainViewHeader'
import { addMessage } from '../../features/chat/chatSlice'
import { setGame } from '../../features/game/gameSlice'
import { setRoom } from '../../features/room/roomSlice'
import { useRequiredAllRoomUsers, useRequiredRoom } from '../../features/room/selectors'
import { setScreen } from '../../features/screen/screenSlice'
import useSocketEventListener from '../../hooks/useSocketEventListener'
import { findByIdOrThrow } from '../../utils/utils'
import GameOptionsForm from './GameOptionsForm'
import Game from './TakeSix/Game'

export default function RoomView(): JSX.Element {
  const dispatch = useDispatch()
  const room = useRequiredRoom()
  const allRoomUsers = useRequiredAllRoomUsers()
  const game = useSelector((state: RootState) => state.game)
  const createUserIdentity = useUserIdentityCreator()

  const roomName = room.name

  const handleGameDone = (): void => {
    dispatch(setGame(null))
  }

  useSocketEventListener('s2c_userJoined', (data) => {
    dispatch(setRoom({ ...room, users: data.newRoomState.users }))

    dispatch(
      addMessage({
        type: 'userJoinedRoom',
        data: {
          user: { ...data.user, isCurrentUser: false, isRoomOwner: false },
          roomName,
        },
      }),
    )
  })

  useSocketEventListener('s2c_gameStarted', (s2c_gameStartedData) => {
    dispatch(setGame({ ...s2c_gameStartedData, type: 'takesix', playersWithSelectedCard: [] }))

    const participants = s2c_gameStartedData.game.players.map(({ id }) =>
      createUserIdentity(findByIdOrThrow(allRoomUsers, id)),
    )

    dispatch(addMessage({ type: 'gameStarted', data: { players: participants } }))
  })

  useSocketEventListener('s2c_gameStopped', (data) => {
    // Case when data.reason === 'completed' will be handled by Gaem.tsx

    if (data.reason === 'roomOwnerAction') {
      dispatch(setGame(null))
      dispatch(
        addMessage({
          type: 'gameEnded',
          data: { reason: 'roomOwnerAction', roomOwner: createUserIdentity(room.owner) },
        }),
      )
    } else if (data.reason === 'playerInactivity' || data.reason === 'playerLeft' || data.reason === 'roomClosed') {
      dispatch(setGame(null))
      dispatch(addMessage({ type: 'gameEnded', data: { reason: data.reason } }))
    }
  })

  useSocketEventListener('s2c_usersMovedToSpectators', (data) => {
    dispatch(
      addMessage({
        type: 'usersMovedToSpectators',
        data: {
          reason: 'inactivity',
          users: room.users.filter((user) => data.userIds.includes(user.id)).map((user) => createUserIdentity(user)),
        },
      }),
    )
  })

  useSocketEventListener('s2c_youHaveBeenMovedToSpectators', () => {
    dispatch(addMessage({ type: 'youHaveBeenMovedToSpectators', data: { reason: 'inactivity' } }))
  })

  useSocketEventListener('s2c_usersLeft', (data) => {
    dispatch(
      addMessage({
        type: 'usersLeftRoom',
        data: {
          reason: s2c_usersLeftReasonToChatMessageReason(data.reason),
          users: [room.owner, ...room.users]
            .filter((user) => data.userIds.includes(user.id))
            .map((user) => createUserIdentity(user)),
          roomName: room.name,
        },
      }),
    )

    if (room.owner.id !== data.newRoomState.owner.id) {
      dispatch(
        addMessage({
          type: 'newRoomOwner',
          data: {
            owner: { ...createUserIdentity(data.newRoomState.owner), isRoomOwner: true },
            roomName: data.newRoomState.name,
          },
        }),
      )
    }

    dispatch(
      setRoom({
        ...room,
        owner: data.newRoomState.owner,
        users: data.newRoomState.users,
      }),
    )
  })

  useSocketEventListener('s2c_youHaveBeenKicked', () => {
    dispatch(setGame(null))
    dispatch(setRoom(null))
    dispatch(setScreen('rooms'))
    dispatch(
      addMessage({ type: 'currentUserLeftRoom', data: { roomName: room?.name ?? '', reason: 'kickedForInactivity' } }),
    )
  })

  return (
    <div>
      <MainViewHeader>
        <header className='flex h-12 flex-row items-center xl:ml-4'>
          <h1 className=''>
            <span className='font-bold text-gray-200'>{room.name}</span>
            <span className='ml-2 hidden text-gray-400 md:inline'>
              by <UserNameFromUser user={room.owner} />
            </span>
          </h1>
        </header>
      </MainViewHeader>

      <div className='relative mt-12'>
        {game ? (
          <Game onGameDone={handleGameDone} />
        ) : (
          <>
            <GameOptionsForm />

            <div className='flex flex-col p-8'>
              <div className='px-3 py-1'>
                <UserNameFromUser user={room.owner} />
              </div>

              {room.users.map((user) => (
                <div key={user.id} className='px-3 py-1'>
                  <UserNameFromUser user={user} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
