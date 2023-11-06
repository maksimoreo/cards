import { Meta, StoryObj } from '@storybook/react'
import { cardOrCardsFromValues as c } from 'common/src/TakeSix/utils'
import CardsField from '.'
import { CardsFieldRow } from './Row'

const meta: Meta<typeof CardsField> = {
  title: 'TakeSix/CardsField',
  component: CardsField,
  argTypes: {
    allowSelectRow: { control: 'boolean' },
  },
}

const rows: readonly CardsFieldRow[] = [
  {
    items: [
      //
      { tiltedCard: { card: c(1), tilt: -1.51 }, refSetter: () => {} },
    ],
    newItemEmptySpaceRefSetter: () => {},
  },
  {
    items: [
      //
      { tiltedCard: { card: c(42), tilt: -0.1 }, refSetter: () => {} },
      { tiltedCard: { card: c(5), tilt: 0.39 }, refSetter: () => {} },
      { tiltedCard: { card: c(3), tilt: -3.4 }, refSetter: () => {} },
    ],
    newItemEmptySpaceRefSetter: () => {},
  },
  {
    items: [
      //
      { tiltedCard: { card: c(6), tilt: 2.77 }, refSetter: () => {} },
      { tiltedCard: { card: c(77), tilt: 3.4 }, refSetter: () => {} },
      { tiltedCard: { card: c(10), tilt: -0.99 }, refSetter: () => {} },
      { tiltedCard: { card: c(60), tilt: 2.0 }, refSetter: () => {} },
      { tiltedCard: { card: c(18), tilt: -1.55 }, refSetter: () => {} },
    ],
    newItemEmptySpaceRefSetter: () => {},
  },
  {
    items: [
      //
      { tiltedCard: { card: c(100), tilt: 3.45 }, refSetter: () => {} },
      { tiltedCard: { card: c(9), tilt: 1.3 }, refSetter: () => {} },
      { tiltedCard: { card: c(11), tilt: -1.23 }, refSetter: () => {} },
      { tiltedCard: { card: c(55), tilt: 3.27 }, refSetter: () => {} },
      { tiltedCard: { card: c(15), tilt: 4.38 }, refSetter: () => {} },
      { tiltedCard: { card: c(72), tilt: 2.11 }, refSetter: () => {} },
    ],
    newItemEmptySpaceRefSetter: () => {},
  },
]

export default meta
type Story = StoryObj<typeof CardsField>

export const Primary: Story = {
  args: {
    allowSelectRow: true,
    rows,
    onRowSelected: () => {},
  },
  // parameters: {
  //   backgrounds: [{ name: 'black', value: '#000', default: true }],
  // },
}
