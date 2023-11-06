import { random } from 'lodash'
import { RefSetter } from '../../../../utils/utils'
import PlayingCard from '../PlayingCard'
import { Card } from '../types'

const MAX_CARD_TILT = 5

export const getRandomTilt = (): number => random(-MAX_CARD_TILT, MAX_CARD_TILT, true)

export class TiltedCard {
  constructor(
    public readonly card: Card,
    public readonly tilt = getRandomTilt(),
  ) {}
}

export type TiltedCardHtmlElement = HTMLDivElement

export interface TiltedCardWithRef {
  readonly tiltedCard: TiltedCard
  readonly refSetter: RefSetter<TiltedCardHtmlElement>
}

interface Props {
  readonly tiltedCardWithRef: TiltedCardWithRef
}

export default function Item({
  tiltedCardWithRef: {
    tiltedCard: { card, tilt },
    refSetter,
  },
}: Props): JSX.Element {
  return (
    <div ref={refSetter} style={{ transform: `rotate(${tilt}deg)` }}>
      <PlayingCard card={card} />
    </div>
  )
}
