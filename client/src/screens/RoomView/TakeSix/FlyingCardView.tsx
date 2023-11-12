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
  const positionStyles = useSpring({
    from: {
      left: from.left,
      top: from.top,
      scale: from.scale,
    },
    to: {
      left: to.left,
      top: to.top,
      scale: to.scale,
    },
    config: {
      duration,
      easing: easings.easeOutQuint,
    },
  })

  const rotationStyles = useSpring({
    from: {
      rotate: from.rotate,
    },
    to: {
      rotate: to.rotate,
    },
    config: {
      duration,
      easing: easings.easeOutQuint,
    },
  })

  // Split animations into position & rotation, bc position must be applied relative to origin-top-left, but rotation
  // must not. Otherwise card will noticeably teleport by ~5px at the end of animation.

  return (
    <animated.div className='fixed z-30 origin-top-left' style={positionStyles}>
      <animated.div style={rotationStyles}>
        <PlayingCard card={card} />
      </animated.div>
    </animated.div>
  )
}
