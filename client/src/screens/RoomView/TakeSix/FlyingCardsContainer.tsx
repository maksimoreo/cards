import FlyingCardView, { FlyingCard } from './FlyingCardView'

interface Props {
  readonly flyingCards: readonly FlyingCard[]
}

// Container for cards that 'fly' from one place to another on screen
export default function FlyingCardsContainer({ flyingCards }: Props): JSX.Element {
  return (
    <div className=''>
      {flyingCards.map(({ card, from, to, duration }) => (
        <FlyingCardView key={card.value} card={card} from={from} to={to} duration={duration} />
      ))}
    </div>
  )
}
