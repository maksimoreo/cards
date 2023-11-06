import Client from 'socket.io-client'
import { v4 as uuidv4 } from 'uuid'
import { Logger } from 'winston'

import { ClientSocketT } from 'common/src/TypedClientSocket/ClientSocketT'
import { isServerEvent, SERVER_NOTIFICATION_DATA_SCHEMA_MAP } from 'common/src/TypedClientSocket/ServerToClientEvents'
import { random } from 'lodash'
import { BotSystem } from '../BotSystem'
import Bot, { HaltCallback } from './Bot'
import {
  DisconnectRequestEvent,
  ServerEvent,
  ServerEventT,
  SocketConnectEvent,
  SocketDisconnectEvent,
  StateUpdateEvent,
  TimerDoneEvent,
} from './events'
import { createSocketEventEmittingFunction } from './socketEmitEvent'
import StateMachine, { EventDroppedError, State } from './StateMachine'
import InitialState from './states/Initial'

interface SharedState {
  gamesPlayed: number
  gamesWon: number
  readonly willPlayGames: number
}

export default class BotInternals {
  public readonly id: string
  public readonly botSystem: BotSystem
  public readonly socket: ClientSocketT
  public readonly socketEmit

  public readonly sharedState: SharedState
  private readonly onHalt: HaltCallback
  private readonly bot: Bot

  private didError = false
  private allowToQueueEvents = true
  private readonly stateMachine: StateMachine

  constructor(options: { botSystem: BotSystem; onHalt: HaltCallback; bot: Bot }) {
    this.id = uuidv4()
    this.botSystem = options.botSystem
    this.onHalt = options.onHalt
    this.bot = options.bot

    this.socket = Client(this.botSystem.appConnectionUrl)
    this.socketEmit = createSocketEventEmittingFunction(this.socket)

    this.sharedState = { gamesPlayed: 0, gamesWon: 0, willPlayGames: random(3, 5) }
    this.stateMachine = new StateMachine(new InitialState({ botInternals: this }))

    this.socket.on('connect', async () => {
      this.log({ type: 'receivedConnect' })

      await this.safelyProcessStateChange({
        changeState: (event) => this.stateMachine.pushToQueueAndProcess(event),
        event: new SocketConnectEvent(),
      })
    })

    this.socket.on('disconnect', async (reason) => {
      this.log({ type: 'receivedDisconnect', reason })

      this.allowToQueueEvents = false

      if (this.didError) {
        return
      }

      await this.safelyProcessStateChange({
        changeState: (event) => this.stateMachine.dropAllEventsAndProcessEventImmediatelyAfterCurrentEvent(event),
        event: new SocketDisconnectEvent(),
      })
    })

    this.socket.onAny(async (event: string, untypedData: unknown): Promise<void> => {
      this.log({ type: 'receivedEvent', event })

      if (!this.allowToQueueEvents) {
        console.log('allowToQueueEvents is false')
        return
      }

      if (isServerEvent(event)) {
        const dataSchema = SERVER_NOTIFICATION_DATA_SCHEMA_MAP[event]
        const data = dataSchema.parse(untypedData)

        const serverEvent = { type: event, data } as ServerEventT

        await this.safelyProcessStateChange({
          changeState: (event) => this.stateMachine.pushToQueueAndProcess(event),
          event: new ServerEvent({ serverEvent }),
        })
      }
    })

    this.socket.onAnyOutgoing((event: string) => {
      this.log({ type: 'sentEvent', event })
    })
  }

  public get logger(): Logger {
    return this.botSystem.logger
  }

  public async sendDisconnectEvent(): Promise<void> {
    this.allowToQueueEvents = false

    await this.safelyProcessStateChange({
      changeState: (event) => this.stateMachine.dropAllEventsAndProcessEventImmediatelyAfterCurrentEvent(event),
      event: new DisconnectRequestEvent(),
    })
  }

  public sendTimerDoneAfter(ms: number): NodeJS.Timeout {
    return setTimeout(async () => {
      await this.safelyProcessStateChange({
        changeState: (event) => this.stateMachine.pushToQueueAndProcess(event),
        event: new TimerDoneEvent(),
      })
    }, ms)
  }

  private async safelyProcessStateChange({
    changeState,
    event,
  }: {
    changeState: (event: StateUpdateEvent) => Promise<State>
    event: StateUpdateEvent
  }): Promise<void> {
    try {
      this.log({ type: 'startProcessingEvent', event })
      const newState = await changeState(event)
      this.log({ type: 'processedEvent', event })

      this.invokeHaltCallbackIfNeeded(newState)
    } catch (error) {
      if (error instanceof EventDroppedError) {
        // expected
        return
      }

      this.didError = true
      this.log({ type: 'errorWillDisconnect', error })
      this.socket.disconnect()

      this.onHalt(this.bot)
    }
  }

  private invokeHaltCallbackIfNeeded(state: State): void {
    if (state.type === 'halt') {
      this.onHalt(this.bot)
    }
  }

  private log<T extends { type: string }>(meta: T): void {
    this.logger.info('bot log', { ...meta, botId: this.id, state: this.stateMachine.currentState })
  }
}
