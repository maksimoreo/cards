import { Card } from '../types'
import PlayerHandItem, { SelectedState } from './PlayerHandItem'

function normalize(value: number, min: number, max: number): number {
  return (value - min) / (max - min)
}

function lerp(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t
}

function easeOutSine(x: number): number {
  return Math.sin((x * Math.PI) / 2)
}

function maxCartLiftFromCardsCount(cardsCount: number): number {
  return lerp(0, 30, easeOutSine(normalize(cardsCount, 1, 10)))
}

function maxCardTiltFromCardsCount(cardsCount: number): number {
  return lerp(0, 0.9, easeOutSine(normalize(cardsCount, 1, 10)))
}

interface Props {
  readonly cards: readonly Card[]
  readonly selectedCard:
    | {
        readonly index: number
        readonly accepted: boolean
      }
    | undefined
  readonly onCardSelected: (card: number) => void
  readonly allowSelectCard: boolean
}

export default function PlayerHand({ cards, selectedCard, onCardSelected, allowSelectCard }: Props): JSX.Element {
  const handleCardIndexClick = (index: number): void => {
    onCardSelected(index)
  }
  const cardsCount = cards.length

  const maxCardLift = maxCartLiftFromCardsCount(cardsCount)
  const maxCardTilt = maxCardTiltFromCardsCount(cardsCount)

  const calculateSelectedStateForItemWithIndex = (itemIndex: number): SelectedState => {
    return allowSelectCard && selectedCard?.index === itemIndex ? 'selected' : 'none'
  }

  return (
    // <ul className='flex flex-row justify-center mx-auto' style={{ width: listWidth }}>
    <ul className='fixed bottom-0 flex w-[calc(100vw-16px)] flex-row justify-center md:w-full'>
      {cardsCount === 1 ? (
        <PlayerHandItem
          key={cards[0].value}
          tilt={0}
          lift={0}
          allowClick={allowSelectCard}
          onClick={(): void => handleCardIndexClick(0)}
          card={cards[0]}
          selectedState={calculateSelectedStateForItemWithIndex(0)}
        />
      ) : (
        cards.map((card, index) => {
          // [0, 1]
          const t = index / (cardsCount - 1)

          const lift = -Math.sin(t * Math.PI) * maxCardLift
          const tilt = Math.atan((-Math.PI * Math.cos(t * Math.PI)) / 10) * maxCardTilt

          return (
            <PlayerHandItem
              key={card.value}
              tilt={tilt}
              lift={lift}
              allowClick={allowSelectCard}
              onClick={(): void => handleCardIndexClick(index)}
              card={card}
              selectedState={calculateSelectedStateForItemWithIndex(index)}
            />
          )
        })
      )}
    </ul>
  )
}
