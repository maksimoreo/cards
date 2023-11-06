import { Meta, StoryObj } from '@storybook/react'

import Counter from '../../utils/Counter'
import { ChatMessage } from './ChatMessage'
import { ChatView } from './ChatView'

const meta = {
  title: 'UI/Chat',
  component: ChatView,
  render: (args) => (
    <div className='h-80 w-80 overflow-y-scroll'>
      <ChatView {...args} />
    </div>
  ),
} satisfies Meta<typeof ChatView>
export default meta

type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: { messages: [], connected: true, messageFormDisabled: false },
}

const c = new Counter()
function addId<T>(any: T): T & { id: string } {
  return { ...any, id: c.next().toString() }
}

const user1 = { id: '1', name: 'MinecraftPlayer8', color: '#ffffff', isCurrentUser: true, isRoomOwner: true }
const user2 = { id: '2', name: 'CuteCake3', color: '#e3342f', isCurrentUser: false, isRoomOwner: false }
const user3 = { id: '3', name: 'MegaTurtle99', color: '#f6993f', isCurrentUser: false, isRoomOwner: false }

const roomName = 'gamers'

const sampleMessages: readonly ChatMessage[] = [
  addId({ type: 'localNotification', text: 'Connected to the server' }),
  addId({ type: 'currentUserJoinedRoom', roomName }),
  addId({ type: 'userJoinedRoom', user: user2, roomName }),
  addId({ type: 'userJoinedRoom', user: user3, roomName }),
  addId({ type: 'localUserMessage', text: 'Hello everyone!', deliveryStatus: 'delivered', sender: user1 }),
  addId({ type: 'remoteUserMessage', text: 'Hi', sender: user3 }),
  addId({ type: 'remoteUserMessage', text: 'Welcome back!', sender: user2 }),
  addId({ type: 'localUserMessage', text: 'How is it going? :)', deliveryStatus: 'delivered', sender: user1 }),
  addId({ type: 'remoteUserMessage', text: 'doing well', sender: user2 }),
  addId({ type: 'remoteUserMessage', text: 'all good, hbu?', sender: user3 }),
  addId({ type: 'remoteUserMessage', text: 'ready for a game?', sender: user2 }),
  addId({ type: 'localUserMessage', text: 'Sure, lets do it!', deliveryStatus: 'pending', sender: user1 }),
  addId({ type: 'localNotification', text: 'Game started' }),
  addId({ type: 'userLeftRoom', user: user2, roomName }),
  addId({ type: 'userLeftRoom', user: user3, roomName }),
  addId({ type: 'localUserMessage', text: 'bruh', deliveryStatus: 'delivered', sender: user1 }),
]

export const WithSampleMessages: Story = {
  args: {
    messages: sampleMessages,
    connected: true,
    messageFormDisabled: false,
  },
}
