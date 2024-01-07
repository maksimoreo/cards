import { random } from 'lodash'

import BotInternals from '../BotInternals'
import { Card, GameState, Room } from '../dataTypes'
import WaitingBeforePlayingCardState from './WaitingBeforePlayingCard'
import WaitingBeforeStartingTheGameState from './WaitingBeforeStartingTheGame'
import WaitingForPlayersState from './WaitingForPlayersState'
import WaitingForSocketDisconnectState from './WaitingForSocketDisconnect'

export function canStartGame({ botInternals, room }: { botInternals: BotInternals; room: Room }): boolean {
  return botInternals.socket.id === room.owner.id && room.users.length + 1 >= 2
}

export function toWaitingBeforeStartingTheGame({
  botInternals,
  room,
}: {
  botInternals: BotInternals
  room: Room
}): WaitingBeforeStartingTheGameState {
  return new WaitingBeforeStartingTheGameState({
    botInternals,
    room,
    timer: botInternals.sendTimerDoneAfter(random(10000, 15000)),
  })
}

export function toWaitingForGame(props: { botInternals: BotInternals; room: Room }) {
  if (canStartGame(props)) {
    return toWaitingBeforeStartingTheGame(props)
  }

  return new WaitingForPlayersState(props)
}

export function toWaitingBeforePlayingCard(partialProps: {
  botInternals: BotInternals
  room: Room
  gameState: GameState
  playerCards: readonly Card[]
}): WaitingBeforePlayingCardState {
  return new WaitingBeforePlayingCardState({
    ...partialProps,
    timer: partialProps.botInternals.sendTimerDoneAfter(random(2000, 10000)),
  })
}

export function gracefullyDisconnectSocket({
  botInternals,
}: {
  botInternals: BotInternals
}): WaitingForSocketDisconnectState {
  if (botInternals.socket.connected) {
    botInternals.socket.disconnect()
  }

  return new WaitingForSocketDisconnectState()
}
