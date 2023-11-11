import { faDice, faMugHot, faPlay } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'
import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import Button from '../../components/Button'
import { setGame } from '../../features/game/gameSlice'
import { setGameOptions } from '../../features/room/roomSlice'
import { useRequiredAllRoomUsers, useRequiredRoom } from '../../features/room/selectors'
import { useIsOwner } from '../../hooks/useIsOwner'
import { useSocket } from '../../hooks/useSocket'
import useSocketEventListener from '../../hooks/useSocketEventListener'

const GAME_MODE_VALUES = ['normal', 'expert'] as const
type GameModes = (typeof GAME_MODE_VALUES)[number]
function isValueGameMode(value: string): value is GameModes {
  return (GAME_MODE_VALUES as readonly string[]).indexOf(value) !== -1
}

export default function GameForm() {
  const { send } = useSocket()
  const dispatch = useDispatch()
  const isRoomOwner = useIsOwner()
  const room = useRequiredRoom()
  const allRoomUsers = useRequiredAllRoomUsers()

  const [gameMode, setGameMode] = useState<GameModes>(room.gameOptions.mode)

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault()
  }

  const isGameModeNormalChecked = gameMode === 'normal'
  const isGameModeExpertChecked = gameMode === 'expert'

  const handleGameModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isValueGameMode(event.currentTarget.value)) {
      setGameMode(event.currentTarget.value)

      send('updateGameOptions', { type: 'takeSix', mode: event.currentTarget.value }, () => {})
    }
  }

  const handleStartGameButtonClick = (): void => {
    dispatch(setGameOptions({ type: 'takeSix', mode: gameMode }))

    send('startGame', null, (response) => {
      if (response.code === 'SUCCESS') {
        dispatch(setGame({ ...response.data, type: 'takesix', playersWithSelectedCard: [] }))
      }
    })
  }

  useSocketEventListener('gameOptionsUpdated', (data) => {
    setGameMode(data.gameOptions.mode)
  })

  useSocketEventListener('notifyGameStarted', () => {
    dispatch(setGameOptions({ type: 'takeSix', mode: gameMode }))
  })

  const cardsCount = Math.max(2, allRoomUsers.length) * 10 + 4
  const isStartButtonDisabled = allRoomUsers.length < 2

  return (
    <>
      <form onSubmit={handleSubmit}>
        <fieldset disabled={!isRoomOwner}>
          <legend className='mb-4 text-center text-neutral-400'>Game mode:</legend>

          <div className='flex flex-row justify-center gap-4'>
            <label
              htmlFor='normal'
              className={classNames(
                'flex min-h-[8em] w-36 flex-col justify-center rounded-lg p-2',
                isGameModeNormalChecked ? 'border-2 border-green-400' : 'border border-neutral-500',
              )}
            >
              <p
                className={classNames(
                  'text-center text-xl font-bold',
                  isGameModeNormalChecked ? 'text-green-300' : 'text-neutral-300',
                )}
              >
                <input
                  type='radio'
                  id='normal'
                  name='gameMode'
                  value='normal'
                  checked={isGameModeNormalChecked}
                  onChange={handleGameModeChange}
                />{' '}
                <FontAwesomeIcon icon={faMugHot} className='ml-1 mr-2' size='sm' />
                Normal
              </p>

              <p className='text-center text-sm italic text-neutral-400'>{cardsCount} random cards from 1 to 104</p>
            </label>

            <label
              htmlFor='expert'
              className={classNames(
                'flex min-h-[8em] w-36 flex-col justify-center rounded-lg p-2',
                isGameModeExpertChecked ? 'border-2 border-red-500' : 'border border-neutral-500',
              )}
            >
              <p
                className={classNames(
                  'text-center text-xl font-bold',
                  isGameModeExpertChecked ? 'text-red-500' : 'text-neutral-300',
                )}
              >
                <input
                  type='radio'
                  id='expert'
                  name='gameMode'
                  value='expert'
                  checked={isGameModeExpertChecked}
                  onChange={handleGameModeChange}
                />{' '}
                <FontAwesomeIcon icon={faDice} className='ml-1 mr-2' size='sm' />
                Expert
              </p>

              <p className='text-center text-sm italic text-neutral-400'>
                {cardsCount} shuffled cards
                <br />
                from 1 to {cardsCount}
              </p>
            </label>
          </div>
        </fieldset>

        {isRoomOwner ? (
          <>
            <div className='mt-4 flex flex-row justify-center gap-2'>
              <Button
                onClick={handleStartGameButtonClick}
                disabled={isStartButtonDisabled}
                iconProps={{ icon: faPlay }}
                color='success'
              >
                Start
              </Button>
            </div>

            {isStartButtonDisabled && (
              <p className='mx-2 text-center text-sm italic text-neutral-400'>
                (You can start the game when there are 2 or more players in the room)
              </p>
            )}
          </>
        ) : (
          <p className='mx-2 mt-4 text-center text-sm italic text-neutral-400'>
            Only room owner is allowed to start the game.
          </p>
        )}
      </form>
    </>
  )
}
