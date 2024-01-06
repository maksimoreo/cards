import { LocalUserMessage, RemoteUserMessage } from '../ChatMessage'
import UserName from '../UserName'

interface UserMessageLineProps {
  message: LocalUserMessage | RemoteUserMessage
}

export default function UserMessageLine({ message }: UserMessageLineProps): JSX.Element {
  return (
    <div className='px-2 pt-0.5 hover:bg-white/5' title={new Date(message.timestamp).toLocaleTimeString()}>
      <p>
        <UserName {...message.data.sender} />
        <span className='text-sm text-neutral-300'>: {message.data.text}</span>
      </p>
    </div>
  )
}
