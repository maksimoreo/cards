import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../app/store'
import { useUserIdentityCreator } from '../../components/Chat/UserName/UserIdentity'
import UserNameFromUser from '../../components/Chat/UserName/UserNameFromUser'
import MainViewHeader from '../../components/MainViewHeader'
import { addMessage } from '../../features/chat/chatSlice'
import { setGame } from '../../features/game/gameSlice'
import { setRoom } from '../../features/room/roomSlice'
import { useRequiredAllRoomUsers, useRequiredRoom } from '../../features/room/selectors'
import { setScreen } from '../../features/screen/screenSlice'
import { useSocket } from '../../hooks/useSocket'
import useSocketEventListener from '../../hooks/useSocketEventListener'
import { findByIdOrThrow, tryFindById } from '../../utils/utils'
import GameOptionsForm from './GameOptionsForm'
import Game from './TakeSix/Game'
import { GameState } from './TakeSix/types'

export default function RoomView(): JSX.Element {
  const dispatch = useDispatch()
  const { socket } = useSocket()
  const { id: currentUserId } = socket
  const room = useRequiredRoom()
  const allRoomUsers = useRequiredAllRoomUsers()
  const game = useSelector((state: RootState) => state.game)

  const createUserIdentity = useUserIdentityCreator()

  const roomName = room.name

  const handleGameDone = (finalGameState: GameState): void => {
    dispatch(setGame(null))

    const sortedPlayers = finalGameState.players
      .map((player) => ({
        user: createUserIdentity(allRoomUsers.find((user) => user.id === player.id) || player.user),
        isActive: player.isActive,
        penaltyPoints: player.penaltyPoints,
      }))
      .sort((a, b) => a.penaltyPoints - b.penaltyPoints)

    dispatch(addMessage({ type: 'gameEnded', reason: 'win', sortedPlayers }))
  }

  useSocketEventListener('s2c_userJoined', (data) => {
    dispatch(setRoom({ ...room, users: data.newRoomState.users }))

    dispatch(
      addMessage({
        type: 'userJoinedRoom',
        user: { ...data.user, isCurrentUser: false, isRoomOwner: false },
        roomName,
      }),
    )
  })

  useSocketEventListener('s2c_userLeft', (data) => {
    dispatch(setRoom({ ...room, users: data.newRoomState.users }))

    tryFindById(room.users, data.userId, (user) =>
      dispatch(addMessage({ type: 'userLeftRoom', user: createUserIdentity(user), roomName })),
    )

    if (!data.game) {
      dispatch(setGame(null))
    }
  })

  useSocketEventListener('s2c_ownerLeft', (data) => {
    const { owner: previousOwner } = room

    dispatch(
      setRoom({
        ...room,
        owner: data.newOwner,
        users: data.newRoomState.users,
      }),
    )

    dispatch(
      addMessage({
        type: 'ownerLeftRoom',
        user: { ...previousOwner, isRoomOwner: true, isCurrentUser: false },
        newRoomOwner: { ...data.newOwner, isRoomOwner: true, isCurrentUser: currentUserId === data.newOwner.id },
        roomName,
      }),
    )

    if (!data.game) {
      dispatch(setGame(null))
    }
  })

  useSocketEventListener('s2c_gameStarted', (s2c_gameStartedData) => {
    dispatch(setGame({ ...s2c_gameStartedData, type: 'takesix', playersWithSelectedCard: [] }))

    const participants = s2c_gameStartedData.gameState.players.map(({ id }) =>
      createUserIdentity(findByIdOrThrow(allRoomUsers, id)),
    )

    dispatch(addMessage({ type: 'gameStarted', players: participants }))
  })

  useSocketEventListener('s2c_gameStopped', (data) => {
    dispatch(setGame(null))
    dispatch(addMessage({ type: 'gameEnded', reason: data.reason }))
  })

  useSocketEventListener('s2c_usersMovedToSpectators', (data) => {
    if (!data.game) {
      dispatch(setGame(null))
    }

    dispatch(
      addMessage({
        type: 'usersMovedToSpectators',
        reason: 'inactivity',
        users: room.users.filter((user) => data.userIds.includes(user.id)).map((user) => createUserIdentity(user)),
      }),
    )
  })

  useSocketEventListener('s2c_youHaveBeenMovedToSpectators', (data) => {
    if (!data.game) {
      dispatch(setGame(null))
    }

    dispatch(addMessage({ type: 'youHaveBeenMovedToSpectators', reason: 'inactivity' }))
  })

  useSocketEventListener('s2c_usersLeft', (data) => {
    if (!data.game) {
      dispatch(setGame(null))
    }

    dispatch(
      addMessage({
        type: 'usersLeftRoom',
        reason: 'kickedForInactivity',
        users: room.users.filter((user) => data.userIds.includes(user.id)).map((user) => createUserIdentity(user)),
        roomName: room.name,
      }),
    )

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
    dispatch(addMessage({ type: 'currentUserLeftRoom', roomName: room?.name ?? '', reason: 'kickedForInactivity' }))
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
