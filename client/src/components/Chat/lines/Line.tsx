import React from 'react'
import { assertUnreachable } from '../../../utils'
import { ChatMessage } from '../ChatMessage'
import UserIdentity from '../UserName/UserIdentity'
import UserName from '../UserName/UserName'
import BasicMessageLine from './BasicMessageLine'
import UserMessageLine from './UserMessageLine'

function RoomName({ roomName }: { roomName: string }): JSX.Element {
  return <span className='text-base font-bold text-gray-300'>{roomName}</span>
}

function joinUsers(users: readonly UserIdentity[]) {
  return nodesToSentence(users.map((user) => <UserName key={user.id} {...user} />))
}

function nodesToSentence(nodes: React.ReactNode[]): React.ReactNode[] {
  if (nodes.length <= 1) {
    return nodes
  }

  return nodes
    .slice(1, nodes.length - 1)
    .reduce<React.ReactNode[]>((accumulatedNodes, nextNode) => accumulatedNodes.concat([', ', nextNode]), [nodes[0]])
    .concat([' and ', nodes.at(-1)])
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
    if (message.reason === 'completed') {
      return (
        <>
          Game ended! {joinUsers(message.winners.map((winner) => winner.user))} won with the least penalty points (
          {message.winners[0].penaltyPoints}). Other players:{' '}
          {nodesToSentence(
            message.otherPlayers.map((entry) => [
              <UserName key={entry.user.id} {...entry.user} />,
              ` - ${entry.penaltyPoints}`,
            ]),
          )}
        </>
      )
    } else if (message.reason === 'playerInactivity') {
      return <>Game ended due to players being inactive</>
    } else if (message.reason === 'playerLeft') {
      return <>Game ended because players left</>
    } else if (message.reason === 'roomClosed') {
      return <>Game ended because room was closed</>
    } else if (message.reason === 'roomOwnerAction') {
      return <>Room owner stopped the game</>
    }

    assertUnreachable(message.reason)
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
