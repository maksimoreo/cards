import { PropsWithChildren } from 'react'
import { ChatMessage } from '../ChatMessage'

export default function BasicMessageLine({
  message,
  children,
}: PropsWithChildren<{ message: ChatMessage }>): JSX.Element {
  return (
    <div
      className='border-b border-y-neutral-700 pb-1 pt-2 hover:bg-white/5'
      title={new Date(message.timestamp).toLocaleTimeString()}
    >
      <p className='text-center text-neutral-400'>{children}</p>
    </div>
  )
}
