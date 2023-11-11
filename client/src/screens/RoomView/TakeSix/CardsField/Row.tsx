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
      className={classNames('relative mb-2 w-full', allowClick && isHovered && 'bg-slate-600')}
    >
      <div className={classNames('absolute z-30 h-full w-full', allowClick && 'owl-dashed-border-animated')}></div>

      <div className='relative m-2 mx-auto w-[196px] lg:w-[352px]'>
        <div className='owl-takesix-row-bg absolute bottom-0 h-8 w-full bg-neutral-800'></div>

        <ul className={classNames('flex')}>
          {items.map((item) => (
            <li key={item.tiltedCard.card.value} className='z-20 w-9 lg:w-16'>
              <Item tiltedCardWithRef={item} />
            </li>
          ))}

          <li className='w-9 lg:w-16' ref={newItemEmptySpaceRefSetter}></li>
        </ul>
      </div>
    </button>
  )
}
