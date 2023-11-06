import classNames from 'classnames'
import { useState } from 'react'
import PlayingCard from '../PlayingCard'
import { Card } from '../types'

export type SelectedState = 'none' | 'pending' | 'selected'

interface Props {
  readonly card: Card
  readonly tilt: number
  readonly lift: number
  readonly allowClick: boolean
  readonly onClick: (cardValue: number) => void
  readonly selectedState: SelectedState
}

export default function PlayerHandItem({ card, tilt, lift, allowClick, onClick, selectedState }: Props): JSX.Element {
  const [isHovered, setIsHovered] = useState(false)

  const highlight = isHovered || selectedState === 'selected' || selectedState === 'pending'

  return (
    <li
      key={card.value}
      className={classNames(
        'min-w-0 shrink overflow-visible duration-100 ease-in-out',
        selectedState === 'selected' ? '-translate-y-4' : isHovered && '-translate-y-2',
        highlight ? 'basis-11 md:basis-20' : 'basis-9 md:basis-14 ',
      )}
      onMouseEnter={(): void => {
        allowClick && setIsHovered(true)
      }}
      onMouseLeave={(): void => {
        allowClick && setIsHovered(false)
      }}
    >
      <button
        onClick={(): void => {
          allowClick && onClick(card.value)
        }}
        disabled={!allowClick}
      >
        <div
          className={classNames(
            selectedState === 'selected'
              ? 'rounded-xl bg-green-300'
              : selectedState === 'pending'
              ? 'rounded-xl bg-yellow-300'
              : isHovered
              ? 'rounded-xl bg-sky-300'
              : '',
          )}
          style={{
            transform: `rotate(${tilt}rad) translateY(${lift}px)`,
            filter:
              selectedState === 'selected'
                ? 'drop-shadow(0 0 4px rgba(45, 255, 0, 0.5))'
                : selectedState === 'pending'
                ? 'drop-shadow(0 0 4px rgba(253, 224, 71, 0.5))'
                : isHovered
                ? 'drop-shadow(0 0 4px rgba(125, 211, 252, 0.5)'
                : '',
          }}
        >
          <PlayingCard value={card.value} penaltyPoints={card.penaltyPoints} />
        </div>
      </button>
    </li>
  )
}
