import React from 'react'
import { ChatMessage } from '../ChatMessage'
import UserIdentity from '../UserName/UserIdentity'
import UserName from '../UserName/UserName'
import BasicMessageLine from './BasicMessageLine'
import UserMessageLine from './UserMessageLine'

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
  if (message.type === 'localUserMessage' || message.type === 'remoteUserMessage') {
    return <UserMessageLine message={message} />
  } else {
    return <BasicMessageLine message={message}>{getMessageLineText(message)}</BasicMessageLine>
  }

  // assertUnreachable(message)
}

function getMessageLineText(message: ChatMessage) {
  if (message.type === 'localNotification') {
    return message.text
  } else if (message.type === 'userJoinedRoom') {
    return (
      <>
        <UserName {...message.user} /> joined <RoomName roomName={message.roomName} />
      </>
    )
  } else if (message.type === 'userLeftRoom') {
    return (
      <>
        <UserName {...message.user} /> left <RoomName roomName={message.roomName} />
      </>
    )
  } else if (message.type === 'usersLeftRoom') {
    const users = joinUsers(message.users)
    return message.reason === 'kickedForInactivity' ? (
      <>
        {users} {message.users.length == 1 ? 'was' : 'were'} kicked from <RoomName roomName={message.roomName} /> due to
        inactivity
      </>
    ) : message.reason === 'selfAction' ? (
      <>
        {users} left <RoomName roomName={message.roomName} />
      </>
    ) : (
      ''
    )
  } else if (message.type === 'currentUserJoinedRoom') {
    return (
      <>
        You joined <RoomName roomName={message.roomName} />
      </>
    )
  } else if (message.type === 'currentUserLeftRoom') {
    return message.reason === 'kickedForInactivity' ? (
      <>
        You have been kicked from <RoomName roomName={message.roomName} /> due to inactivity
      </>
    ) : (
      <>
        You left <RoomName roomName={message.roomName} />
      </>
    )
  } else if (message.type === 'gameStarted') {
    return <>Game started with {joinUsers(message.players)}</>
  } else if (message.type === 'gameEnded') {
    if (message.sortedPlayers && message.sortedPlayers.length > 0) {
      const winnerPoints = message.sortedPlayers[0].penaltyPoints
      const winners = message.sortedPlayers
        .filter((player) => player.penaltyPoints === winnerPoints)
        .map((player) => player.user)

      return (
        <>
          Game ended! {joinUsers(winners)} won with the least penalty points ({winnerPoints}).
        </>
      )
    }

    return <>Game ended. Reason: {message.reason}</>
  } else if (message.type === 'usersMovedToSpectators') {
    return <>{joinUsers(message.users)} were moved to spectators due to inactivity</>
  } else if (message.type === 'youHaveBeenMovedToSpectators') {
    return <>You have been moved to spectators due to inactivity</>
  } else if (message.type === 'newRoomOwner') {
    return (
      <>
        <UserName {...message.owner} /> is new owner of <RoomName roomName={message.roomName} />
      </>
    )
  }
}
