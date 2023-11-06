import { faCrown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'

interface Props {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly isRoomOwner: boolean
  readonly isCurrentUser: boolean
  readonly isInactive?: boolean
}

export default function UserName({ name, color, isRoomOwner, isCurrentUser, isInactive }: Props): JSX.Element {
  return (
    <span className={classNames('text-base', isInactive && 'line-through')} style={{ color }}>
      <span className='font-bold'>{name}</span>
      {isRoomOwner && (
        <span className='text-yellow-500'>
          {' '}
          <FontAwesomeIcon icon={faCrown} />
        </span>
      )}
      {isCurrentUser && <span className='text-neutral-400'> (you)</span>}
    </span>
  )
}
