import { animated, easings, useSpring } from 'react-spring'

import PlayingCard from './PlayingCard'
import { Card } from './types'

interface FlyingCardAnimationProps {
  readonly left: number
  readonly top: number
  readonly rotate: number
  readonly scale: number
  readonly opacity: number
}

export interface FlyingCard {
  readonly card: Card
  readonly from: FlyingCardAnimationProps
  readonly to: FlyingCardAnimationProps
  readonly duration: number
}

// A card that 'flies' from one place to another, animated
export default function FlyingCardView({ card, from, to, duration }: FlyingCard): JSX.Element {
  const styles = useSpring({
    from: {
      left: from.left,
      top: from.top,
      scale: from.scale,
      rotate: from.rotate,
    },
    to: {
      left: to.left,
      top: to.top,
      scale: to.scale,
      rotate: to.rotate,
    },
    config: {
      duration,
      easing: easings.easeOutQuint,
    },
  })

  return (
    <animated.div className='absolute z-30 origin-top-left' style={styles}>
      <PlayingCard card={card} />
    </animated.div>
  )
}
