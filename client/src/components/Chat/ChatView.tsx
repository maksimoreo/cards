import { ChatMessage } from './ChatMessage'
import Line from './lines/Line'
import { MessageForm } from './MessageForm'
import { StatusLine } from './StatusLine'

interface Props {
  readonly onMessageFormSubmit: (message: string) => void
  readonly messages: readonly ChatMessage[]
  readonly connected: boolean
  readonly messageFormDisabled: boolean
}

export function ChatView({ onMessageFormSubmit, messages, connected, messageFormDisabled }: Props): JSX.Element {
  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex min-h-0 flex-1 flex-col-reverse overflow-y-scroll'>
        <div className=''>
          {messages.map((message) => {
            return <Line message={message} key={message.id} />
          })}
        </div>
      </div>

      <StatusLine connected={connected} />

      <MessageForm onSubmit={onMessageFormSubmit} disabled={messageFormDisabled} />
    </div>
  )
}
