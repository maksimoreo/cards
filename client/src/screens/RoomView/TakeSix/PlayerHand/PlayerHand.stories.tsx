import { Meta, StoryObj } from '@storybook/react'
import { cardOrCardsFromValues as c } from 'common/src/TakeSix/utils'
import PlayerHand from '.'

type PlayerHandAndCustomArgs = React.ComponentProps<typeof PlayerHand> & { cardsCount?: number }

const meta: Meta<PlayerHandAndCustomArgs> = {
  title: 'TakeSix/PlayerHand',
  component: PlayerHand,
  argTypes: {
    allowSelectCard: { control: 'boolean' },
    cardsCount: { control: { type: 'range', min: 1, max: 10 } },
  },
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <div style={{ marginTop: '100px' }}>
      <PlayerHand {...args} cards={args.cardsCount ? args.cards.slice(0, args.cardsCount) : cards} />
    </div>
  ),
}

export default meta
type Story = StoryObj<PlayerHandAndCustomArgs>

const cards = [c(1), c(5), c(2), c(10), c(100), c(77), c(3), c(55), c(4)]

export const Primary: Story = {
  args: {
    cards,
    allowSelectCard: true,
    onCardSelected: () => {},
    selectedCard: {
      index: 1,
      accepted: true,
    },
    cardsCount: cards.length,
  },
}
