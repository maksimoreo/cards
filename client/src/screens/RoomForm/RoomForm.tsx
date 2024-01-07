import React, { useState } from 'react'

import { faRightToBracket, faXmark } from '@fortawesome/free-solid-svg-icons'
import { useDispatch } from 'react-redux'
import Button from '../../components/Button/Button'
import TextInput from '../../components/TextInput'
import { addMessage } from '../../features/chat/chatSlice'
import { setGame } from '../../features/game/gameSlice'
import { setRoom } from '../../features/room/roomSlice'
import { setScreen } from '../../features/screen/screenSlice'
import { useSocket } from '../../hooks/useSocket'
import { assignResponseValidationMessagesToForm } from '../../utils'

export default function RoomForm(): JSX.Element {
  const dispatch = useDispatch()
  const { socket, emit } = useSocket()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [isPasswordProtected, setIsPasswordProtected] = useState(false)
  const [password, setPassword] = useState('')

  const [nameError, setNameError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleCancel = (): void => {
    dispatch(setScreen('rooms'))
  }

  const handleSubmit = (e: React.SyntheticEvent): void => {
    e.preventDefault()

    setLoading(true)
    setNameError('')
    setPasswordError('')
    setErrorMessage('')

    const {
      name: { value: roomName },
    } = e.target as typeof e.target & { name: { value: string } }

    emit('createRoom', { name: roomName, ...(isPasswordProtected && { password }) }, (response) => {
      if (response.code === 'SUCCESS') {
        dispatch(setRoom(response.data.room))
        dispatch(setGame(null))
        dispatch(setScreen('room'))

        dispatch(addMessage({ type: 'currentUserJoinedRoom', data: { roomName: response.data.room.name } }))

        return
      }

      if (response.code === 'BAD_REQUEST') {
        assignResponseValidationMessagesToForm(response, {
          fields: { name: setNameError, password: setPasswordError },
          global: setErrorMessage,
        })
        setLoading(false)
      }
    })
  }

  const formDisabled = loading || socket.disconnected

  return (
    <div className=''>
      <p className='mx-4 mt-16'>
        <a className=' text-neutral-500 underline hover:text-neutral-400' onClick={handleCancel} href='#'>
          Back to all rooms
        </a>
      </p>

      <header className='mb-8 mt-2'>
        <h1 className='text-center text-3xl text-gray-200'>Create Room</h1>
      </header>

      {errorMessage && (
        <div className='mt-2 text-center'>
          <span className='font-medium text-red-500'>{errorMessage}</span>
        </div>
      )}

      <div className='flex justify-center'>
        <form className='w-80' onSubmit={handleSubmit}>
          <div className=''>
            <label htmlFor='name' className='text-sm text-neutral-300'>
              Name
            </label>

            <TextInput
              id='name'
              onChange={(e): void => setName(e.target.value)}
              value={name}
              required={true}
              disabled={formDisabled}
              autoFocus={true}
              className='w-full'
              error={nameError}
            />
          </div>

          <div className='mt-4 flex items-center gap-2'>
            <input
              type='checkbox'
              id='isPasswordProtected'
              onChange={(e): void => setIsPasswordProtected(e.target.checked)}
              checked={isPasswordProtected}
            />

            <label htmlFor='isPasswordProtected' className='text-sm text-neutral-300'>
              Protect with password
            </label>
          </div>

          {isPasswordProtected && (
            <div className='mt-4'>
              <div className='mb-2'>
                <label htmlFor='password' className='text-sm text-neutral-300'>
                  Password
                </label>
              </div>

              <TextInput
                id='password'
                onChange={(e): void => setPassword(e.target.value)}
                value={password}
                disabled={formDisabled}
                className='w-full'
                error={passwordError}
              />
            </div>
          )}

          <div className='mt-4 flex justify-between'>
            <Button type='button' onClick={handleCancel} disabled={loading} iconProps={{ icon: faXmark }} color='error'>
              Cancel
            </Button>

            <Button type='submit' disabled={loading} iconProps={{ icon: faRightToBracket }} color='success'>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
