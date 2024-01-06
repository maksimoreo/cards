import { User } from '../../../commonTypes'
import { useUserIdentityCreator } from './UserIdentity'
import UserName from './UserName'

interface Props {
  readonly user: User
  readonly isInactive?: boolean
  readonly isSpectator?: boolean
}

export default function UserNameFromUser({ user, ...otherProps }: Props): JSX.Element {
  const createIdentity = useUserIdentityCreator()

  const identity = createIdentity(user)

  return <UserName {...identity} {...otherProps} />
}
