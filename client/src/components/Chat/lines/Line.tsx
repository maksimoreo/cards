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

function getMessageLineText({ type, data }: ChatMessage) {
  if (type === 'localNotification') {
    return data.text
  } else if (type === 'userJoinedRoom') {
    return (
      <>
        <UserName {...data.user} /> joined <RoomName roomName={data.roomName} />
      </>
    )
  } else if (type === 'userLeftRoom') {
    return (
      <>
        <UserName {...data.user} /> left <RoomName roomName={data.roomName} />
      </>
    )
  } else if (type === 'usersLeftRoom') {
    const users = joinUsers(data.users)
    return data.reason === 'kickedForInactivity' ? (
      <>
        {users} {data.users.length == 1 ? 'was' : 'were'} kicked from <RoomName roomName={data.roomName} /> due to
        inactivity
      </>
    ) : data.reason === 'selfAction' ? (
      <>
        {users} left <RoomName roomName={data.roomName} />
      </>
    ) : (
      ''
    )
  } else if (type === 'currentUserJoinedRoom') {
    return (
      <>
        You joined <RoomName roomName={data.roomName} />
      </>
    )
  } else if (type === 'currentUserLeftRoom') {
    return data.reason === 'kickedForInactivity' ? (
      <>
        You have been kicked from <RoomName roomName={data.roomName} /> due to inactivity
      </>
    ) : (
      <>
        You left <RoomName roomName={data.roomName} />
      </>
    )
  } else if (type === 'gameStarted') {
    return <>Game started with {joinUsers(data.players)}</>
  } else if (type === 'gameEnded') {
    if (data.reason === 'completed') {
      return (
        <>
          Game ended! {joinUsers(data.winners.map((winner) => winner.user))} won with the least penalty points (
          {data.winners[0].penaltyPoints}). Other players:{' '}
          {nodesToSentence(
            data.otherPlayers.map((entry) => [
              <UserName key={entry.user.id} {...entry.user} />,
              ` - ${entry.penaltyPoints}`,
            ]),
          )}
        </>
      )
    } else if (data.reason === 'playerInactivity') {
      return <>Game ended due to players being inactive</>
    } else if (data.reason === 'playerLeft') {
      return <>Game ended because players left</>
    } else if (data.reason === 'roomClosed') {
      return <>Game ended because room was closed</>
    } else if (data.reason === 'roomOwnerAction') {
      return <>Room owner stopped the game</>
    }

    assertUnreachable(data.reason)
  } else if (type === 'usersMovedToSpectators') {
    return <>{joinUsers(data.users)} were moved to spectators due to inactivity</>
  } else if (type === 'youHaveBeenMovedToSpectators') {
    return <>You have been moved to spectators due to inactivity</>
  } else if (type === 'newRoomOwner') {
    return (
      <>
        <UserName {...data.owner} /> is new owner of <RoomName roomName={data.roomName} />
      </>
    )
  }
}
