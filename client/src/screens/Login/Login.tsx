import { faRightToBracket, faShuffle } from '@fortawesome/free-solid-svg-icons'
import { COLORS, generateRandomColor, generateRandomName } from 'common/src/username'
import _ from 'lodash'
import React, { useState } from 'react'
import { CirclePicker } from 'react-color'
import { useDispatch } from 'react-redux'

import Button from '../../components/Button'
import TextInput from '../../components/TextInput/TextInput'
import { LOCAL_STORAGE_KEY__LAST_USED_COLOR, LOCAL_STORAGE_KEY__LAST_USED_NAME } from '../../const'
import { setIdentity } from '../../features/currentUser/currentUserSlice'
import { setScreen } from '../../features/screen/screenSlice'
import { useSocket } from '../../hooks/useSocket'

export default function Login(): JSX.Element {
  const dispatch = useDispatch()
  const { send } = useSocket()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(localStorage.getItem(LOCAL_STORAGE_KEY__LAST_USED_NAME) || generateRandomName())
  const [nameError, setNameError] = useState('')
  const [color, setColor] = useState(localStorage.getItem(LOCAL_STORAGE_KEY__LAST_USED_COLOR) || generateRandomColor())

  const handleRandomize = (e: React.SyntheticEvent): void => {
    e.preventDefault()
    setName(generateRandomName())
    setColor(generateRandomColor())
  }
  const handleSubmit = (e: React.SyntheticEvent): void => {
    e.preventDefault()

    setLoading(true)

    setNameError('')
    setError('')

    send('setName', { name, color }, (response) => {
      setLoading(false)

      if (response.code === 'SERVER_ERROR') {
        setError('SERVER_ERROR')
      } else if (response.code === 'BAD_REQUEST') {
        const nameErrors = response.validationErrors.filter((error) => _.isEqual(error.path, ['name']))
        if (nameErrors) {
          setNameError(nameErrors.map((error) => error.message).join('\n'))
        }

        if (response.validationErrors.length == 0 && response.message) {
          setError(response.message)
        }
      } else if (response.code === 'SUCCESS') {
        localStorage.setItem(LOCAL_STORAGE_KEY__LAST_USED_NAME, name)
        localStorage.setItem(LOCAL_STORAGE_KEY__LAST_USED_COLOR, color)

        dispatch(setIdentity({ name, color }))
        dispatch(setScreen('rooms'))
      }
    })
  }

  return (
    <div className='flex h-full flex-col justify-center'>
      <header className='mb-8'>
        <h1 className='text-center text-3xl text-gray-200'>How do we call you?</h1>
      </header>

      <div className='mx-auto w-full max-w-xs'>
        <form onSubmit={handleSubmit}>
          <label htmlFor='name' className='my-1 ml-1 block text-sm text-neutral-400'>
            Your name
          </label>

          <TextInput
            id='name'
            required={true}
            disabled={loading}
            onChange={(e): void => setName(e.currentTarget.value)}
            value={name}
            autoFocus={true}
            placeholder='cool-potato'
            className='w-full'
            style={{ color }}
            error={nameError}
          />

          <div className='mt-4 flex justify-center'>
            <CirclePicker onChangeComplete={(color): void => setColor(color.hex)} colors={COLORS} width='210px' />
          </div>

          <div className='mt-12 flex justify-between'>
            <Button type='button' disabled={loading} iconProps={{ icon: faShuffle }} onClick={handleRandomize}>
              Randomize
            </Button>

            <Button type='submit' disabled={loading} iconProps={{ icon: faRightToBracket }} color='success'>
              Join
            </Button>
          </div>

          <div className='mt-2'>
            <span className='text-red-500'>{error}</span>
          </div>
        </form>
      </div>
    </div>
  )
}
