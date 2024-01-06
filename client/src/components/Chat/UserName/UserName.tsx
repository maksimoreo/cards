import { faCrown, faEye } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'

interface Props {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly isRoomOwner: boolean
  readonly isCurrentUser: boolean
  readonly isInactive?: boolean
  readonly isSpectator?: boolean
}

export default function UserName({
  name,
  color,
  isRoomOwner,
  isCurrentUser,
  isInactive,
  isSpectator,
}: Props): JSX.Element {
  return (
    <span className={classNames('text-base', isInactive && 'line-through')} style={{ color }}>
      <span className='font-bold'>{name}</span>
      {isRoomOwner && (
        <span className='text-yellow-500'>
          {' '}
          <FontAwesomeIcon icon={faCrown} />
        </span>
      )}
      {isSpectator && <FontAwesomeIcon icon={faEye} className='ml-1' />}
      {isCurrentUser && <span className='text-neutral-400'> (you)</span>}
    </span>
  )
}
