import type { Meta, StoryObj } from '@storybook/react'
import UserName from './UserName'

const meta = {
  title: 'UI/UserName',
  component: UserName,
} satisfies Meta<typeof UserName>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: '1',
    name: 'ChadGamer',
    color: 'dddddd',
    isCurrentUser: false,
    isRoomOwner: false,
  },
}
