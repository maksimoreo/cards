import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FormEventHandler, useState } from 'react'

interface MessageFormProps {
  readonly onSubmit: (message: string) => void
  readonly disabled: boolean
}

export function MessageForm({ onSubmit, disabled }: MessageFormProps): JSX.Element {
  const [message, setMessage] = useState('')

  const handleChange: FormEventHandler<HTMLInputElement> = (event) => {
    setMessage(event.currentTarget.value)
  }

  const handleSubmit: FormEventHandler = (event) => {
    event.preventDefault()

    if (!message) {
      return
    }

    setMessage('')
    onSubmit(message)
  }

  return (
    <div className='z-20 bg-neutral-900'>
      <form onSubmit={handleSubmit} className='flex flex-row'>
        <input
          type='text'
          placeholder='Send message'
          className='w-full bg-transparent px-4 py-3 text-neutral-300 focus:outline-none'
          onChange={handleChange}
          value={message}
          disabled={disabled}
        />

        <button
          type='submit'
          onSubmit={handleSubmit}
          disabled={disabled}
          className='py-3 pl-3 pr-4 text-neutral-400 transition-colors hover:text-neutral-200 disabled:hover:text-neutral-400'
        >
          <FontAwesomeIcon icon={faPaperPlane} size='lg' className='block' />
        </button>
      </form>
    </div>
  )
}
