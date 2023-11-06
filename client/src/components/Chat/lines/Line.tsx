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

// https://stackoverflow.com/a/40788571
function joinUsers(users: readonly UserIdentity[]) {
  return users
    .map<React.ReactNode>((user, index) => <UserName key={index} {...user} />)
    .reduce((prev, current) => [prev, ', ', current])
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
  } else if (message.type === 'currentUserJoinedRoom') {
    return (
      <BasicMessageLine>
        You joined <RoomName roomName={message.roomName} />
      </BasicMessageLine>
    )
  } else if (message.type === 'currentUserLeftRoom') {
    return (
      <BasicMessageLine>
        You left <RoomName roomName={message.roomName} />
      </BasicMessageLine>
    )
  } else if (message.type === 'gameStarted') {
    return <BasicMessageLine>Game started with {joinUsers(message.players)}</BasicMessageLine>
  } else if (message.type === 'gameEnded') {
    const winnerPoints = message.sortedPlayers[0].penaltyPoints
    const winners = message.sortedPlayers
      .filter((player) => player.penaltyPoints === winnerPoints)
      .map((player) => player.user)

    return (
      <BasicMessageLine>
        Game ended! {joinUsers(winners)} won with {winnerPoints} penalty points.
      </BasicMessageLine>
    )
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
  }

  assertUnreachable(message)
}
