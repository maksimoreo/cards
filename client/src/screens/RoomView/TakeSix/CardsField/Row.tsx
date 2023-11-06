import classNames from 'classnames'
import { useState } from 'react'
import { RefSetter } from '../../../../utils/utils'
import Item, { TiltedCardWithRef } from './Item'

export type RowNewItemSpaceHtmlElement = HTMLLIElement

type RowNewItemSpaceRefSetter = RefSetter<RowNewItemSpaceHtmlElement>

export interface CardsFieldRow {
  readonly items: readonly TiltedCardWithRef[]
  readonly newItemEmptySpaceRefSetter: RowNewItemSpaceRefSetter
}

interface Props {
  readonly cardsFieldRow: CardsFieldRow
  readonly allowClick: boolean
  readonly onClick: () => void
}
export default function Row({
  cardsFieldRow: { items, newItemEmptySpaceRefSetter },
  allowClick,
  onClick,
}: Props): JSX.Element {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={(): void => {
        setIsHovered(false)
        onClick()
      }}
      disabled={!allowClick}
      onMouseEnter={(): void => {
        allowClick && setIsHovered(true)
      }}
      onMouseLeave={(): void => {
        allowClick && setIsHovered(false)
      }}
      className='w-full'
    >
      <div
        className={classNames(
          '-my-1.5 mx-auto w-[196px] rounded-lg bg-neutral-800 p-2 md:-my-1 md:w-[352px] md:rounded-2xl',
          allowClick && isHovered && 'bg-slate-700',
        )}
      >
        <ul className='flex'>
          {items.map((item) => (
            <li key={item.tiltedCard.card.value} className='w-9 md:w-16'>
              <Item tiltedCardWithRef={item} />
            </li>
          ))}

          <li className='w-9 md:w-16' ref={newItemEmptySpaceRefSetter}></li>
        </ul>
      </div>
    </button>
  )
}
