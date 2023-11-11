import { faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { animated, useSpring } from 'react-spring'
import { useMeasure } from 'react-use'

interface Props {
  title: string
  content: JSX.Element
}

export default function Collapsable({ content, title }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [ref, { height }] = useMeasure<HTMLDivElement>()

  const toggleStyles = useSpring({ transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)' })

  const contentStyles = useSpring({
    height: isOpen ? height : 0,
    opacity: isOpen ? 1 : 0,
  })

  return (
    <div>
      <div
        onClick={() => setIsOpen((isOpen) => !isOpen)}
        className='mx-3 flex cursor-pointer items-baseline text-lg font-bold text-neutral-300'
      >
        <span className='grow'>{title}</span>

        <animated.div className='h-[18px] w-[18px] grow-0' style={toggleStyles}>
          <FontAwesomeIcon className='block' icon={faChevronUp} />
        </animated.div>
      </div>

      <animated.div className='overflow-hidden' style={contentStyles}>
        <div ref={ref}>{content}</div>
      </animated.div>
    </div>
  )
}
