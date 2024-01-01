import React from 'react'
import { assertUnreachable } from '../../../utils'
import { ChatMessage } from '../ChatMessage'
import UserIdentity from '../UserName/UserIdentity'
import UserName from '../UserName/UserName'
import BasicMessageLine from './BasicMessageLine'
import LocalUserMessageLine from './LocalUserMessageLine'
import RemoteUserMessageLine from './RemoteUserMessageLine'

function RoomName({ roomName }: { roomName: string }): JSX.Element {
  return <span className='text-base font-bold text-gray-300'>{roomName}</span>
}

function joinUsers(users: readonly UserIdentity[]) {
  const userNames = users.map<React.ReactNode>((user, index) => <UserName key={index} {...user} />)

  if (userNames.length <= 1) {
    return userNames
  }

  return userNames
    .slice(1, userNames.length - 1)
    .reduce<React.ReactNode[]>((nodes, userName) => nodes.concat([', ', userName]), [userNames[0]])
    .concat([' and ', userNames.at(-1)])
}

interface LineProps {
  message: ChatMessage
}

export default function Line({ message }: LineProps): JSX.Element {
  if (message.type === 'localUserMessage') {
    return <LocalUserMessageLine message={message} />
  } else if (message.type === 'remoteUserMessage') {
    return <RemoteUserMessageLine message={message} />
  } else if (message.type === 'localNotification') {
    return <BasicMessageLine>{message.text}</BasicMessageLine>
  } else if (message.type === 'userJoinedRoom') {
    return (
      <BasicMessageLine>
        <UserName {...message.user} /> joined <RoomName roomName={message.roomName} />
      </BasicMessageLine>
    )
  } else if (message.type === 'userLeftRoom') {
    return (
      <BasicMessageLine>
        <UserName {...message.user} /> left <RoomName roomName={message.roomName} />
      </BasicMessageLine>
    )
  } else if (message.type === 'usersLeftRoom') {
    const users = joinUsers(message.users)
    const text =
      message.reason === 'kickedForInactivity' ? (
        <>
          {users} {message.users.length == 1 ? 'was' : 'were'} kicked from <RoomName roomName={message.roomName} /> due
          to inactivity
        </>
      ) : message.reason === 'selfAction' ? (
        <>
          {users} left <RoomName roomName={message.roomName} />
        </>
      ) : (
        ''
      )

    return <BasicMessageLine>{text}</BasicMessageLine>
  } else if (message.type === 'currentUserJoinedRoom') {
    return (
      <BasicMessageLine>
        You joined <RoomName roomName={message.roomName} />
      </BasicMessageLine>
    )
  } else if (message.type === 'currentUserLeftRoom') {
    const text =
      message.reason === 'kickedForInactivity' ? (
        <>
          You have been kicked from <RoomName roomName={message.roomName} /> due to inactivity
        </>
      ) : (
        <>
          You left <RoomName roomName={message.roomName} />
        </>
      )

    return <BasicMessageLine>{text}</BasicMessageLine>
  } else if (message.type === 'gameStarted') {
    return <BasicMessageLine>Game started with {joinUsers(message.players)}</BasicMessageLine>
  } else if (message.type === 'gameEnded') {
    if (message.sortedPlayers && message.sortedPlayers.length > 0) {
      const winnerPoints = message.sortedPlayers[0].penaltyPoints
      const winners = message.sortedPlayers
        .filter((player) => player.penaltyPoints === winnerPoints)
        .map((player) => player.user)

      return (
        <BasicMessageLine>
          Game ended! {joinUsers(winners)} won with the least penalty points ({winnerPoints}).
        </BasicMessageLine>
      )
    }

    return <BasicMessageLine>Game ended. Reason: {message.reason}</BasicMessageLine>
  } else if (message.type === 'ownerLeftRoom') {
    return (
      <BasicMessageLine>
        <UserName {...message.user} /> left <RoomName roomName={message.roomName} />,{' '}
        <UserName {...message.newRoomOwner} /> is now room owner
      </BasicMessageLine>
    )
  } else if (message.type === 'command' || message.type === 'serverMessage') {
    // TODO: Implement these messages

    return (
      <p>
        <span>{message.type}</span>
        <span>{message.id}</span>
      </p>
    )
  } else if (message.type === 'usersMovedToSpectators') {
    return <BasicMessageLine>{joinUsers(message.users)} were moved to spectators due to inactivity</BasicMessageLine>
  } else if (message.type === 'youHaveBeenMovedToSpectators') {
    return <BasicMessageLine>You have been moved to spectators due to inactivity</BasicMessageLine>
  }

  assertUnreachable(message)
}
