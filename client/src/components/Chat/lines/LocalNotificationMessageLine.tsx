import { LocalNotification } from '../ChatMessage'

interface LocalNotificationMessageLineProps {
  message: LocalNotification
}

export default function LocalNotificationMessageLine({ message }: LocalNotificationMessageLineProps): JSX.Element {
  return (
    <div className='border-y border-y-neutral-700 p-2 hover:bg-white/5'>
      <p className='text-center text-neutral-500'>{message.data.text}</p>
    </div>
  )
}
