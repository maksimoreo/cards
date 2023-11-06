import { RemoteUserMessage } from '../ChatMessage'
import UserName from '../UserName'

interface RemoteUserMessageLineProps {
  message: RemoteUserMessage
}

export default function RemoteUserMessageLine({ message }: RemoteUserMessageLineProps): JSX.Element {
  return (
    <div className='px-2 pt-0.5 hover:bg-white/5'>
      <p>
        <UserName {...message.sender} />
        <span className='text-sm text-neutral-300'>: {message.text}</span>
      </p>
    </div>
  )
}
