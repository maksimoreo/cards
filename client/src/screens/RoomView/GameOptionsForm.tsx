import { faPlay } from '@fortawesome/free-solid-svg-icons'
import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import Button from '../../components/Button'
import { setGame } from '../../features/game/gameSlice'
import { setGameOptions } from '../../features/room/roomSlice'
import { useRequiredAllRoomUsers, useRequiredRoom } from '../../features/room/selectors'
import { useIsOwner } from '../../hooks/useIsOwner'
import { useSocket } from '../../hooks/useSocket'
import useSocketEventListener from '../../hooks/useSocketEventListener'
import GameModeField from './GameOptionsForm/TakeSix/GameModeField/GameModeField'
import { GameModeValue } from './GameOptionsForm/TakeSix/GameModeField/extra'
import StepTimeoutDoneStrategyField from './GameOptionsForm/TakeSix/StepTimeoutDoneStrategyField/StepTimeoutDoneStrategyField'
import { DEFAULT_STEP_TIMEOUT_DONE_STRATEGY_VALUE } from './GameOptionsForm/TakeSix/StepTimeoutDoneStrategyField/extra'
import StepTimeoutField from './GameOptionsForm/TakeSix/StepTimeoutField/StepTimeoutField'
import {
  DEFAULT_STEP_TIMEOUT_VALUE,
  STEP_TIMEOUT_NUMBER_TO_STEP_TIMEOUT_VALUE_MAP,
  STEP_TIMEOUT_VALUE_TO_STEP_TIMEOUT_NUMBER_MAP,
  StepTimeoutValue,
} from './GameOptionsForm/TakeSix/StepTimeoutField/extra'

export default function GameForm() {
  const { send } = useSocket()
  const dispatch = useDispatch()
  const isRoomOwner = useIsOwner()
  const room = useRequiredRoom()
  const allRoomUsers = useRequiredAllRoomUsers()

  const [gameMode, setGameMode] = useState<GameModeValue>(room.gameOptions.mode)
  const [stepTimeout, setStepTimeout] = useState<StepTimeoutValue>(
    STEP_TIMEOUT_NUMBER_TO_STEP_TIMEOUT_VALUE_MAP[room.gameOptions.stepTimeout] || DEFAULT_STEP_TIMEOUT_VALUE,
  )
  const [stepTimeoutDoneStrategy, setStepTimeoutDoneStrategy] = useState(
    room.gameOptions.stepTimeoutDoneStrategy || DEFAULT_STEP_TIMEOUT_DONE_STRATEGY_VALUE,
  )

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault()
  }

  const saveGameOptionsToGlobalState = () => {
    dispatch(
      setGameOptions({
        type: 'takeSix',
        mode: gameMode,
        stepTimeout: STEP_TIMEOUT_VALUE_TO_STEP_TIMEOUT_NUMBER_MAP[stepTimeout],
        stepTimeoutDoneStrategy,
      }),
    )
  }

  const handleStartGameButtonClick = (): void => {
    saveGameOptionsToGlobalState()

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
    saveGameOptionsToGlobalState()
  })

  const cardsCount = Math.max(2, allRoomUsers.length) * 10 + 4
  const isStartButtonDisabled = allRoomUsers.length < 2

  return (
    <>
      <form onSubmit={handleSubmit}>
        <GameModeField value={gameMode} onChange={setGameMode} disabled={!isRoomOwner} cardsCount={cardsCount} />

        <StepTimeoutField value={stepTimeout} onChange={setStepTimeout} disabled={!isRoomOwner} />

        <StepTimeoutDoneStrategyField
          value={stepTimeoutDoneStrategy}
          onChange={setStepTimeoutDoneStrategy}
          disabled={!isRoomOwner}
        />

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
