import { BaseEvent, StateUpdateEvent } from './events'

export interface State {
  readonly type: string
  reduce(event: StateUpdateEvent): Promise<State>
}

export class UnexpectedEventError extends Error {
  constructor(public readonly event: BaseEvent) {
    super(`Received unexpected event: "${event.toString()}"`)

    Object.setPrototypeOf(this, UnexpectedEventError.prototype)
  }
}

export class EventDroppedError extends Error {
  constructor() {
    super('Event was dropped')

    Object.setPrototypeOf(this, EventDroppedError.prototype)
  }
}

interface EventQueueItem {
  readonly event: StateUpdateEvent
  readonly resolve: (state: State) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly reject: (reason?: any) => void
}

export default class StateMachine {
  private _currentState: State
  private currentEventQueueItem: EventQueueItem | undefined
  private queue: EventQueueItem[]

  constructor(initialState: State) {
    this._currentState = initialState
    this.queue = []
  }

  public get currentState(): State {
    return this._currentState
  }

  public pushToQueueAndProcess(event: StateUpdateEvent): Promise<State> {
    return new Promise((resolve, reject) => {
      this.queue.push({ event, resolve, reject })

      // NOTE: Dropping promise without awaiting
      this.processEventQueueIfNotProcessing()
    })
  }

  public dropAllEventsAndProcessEventImmediatelyAfterCurrentEvent(event: StateUpdateEvent): Promise<State> {
    this.queue.forEach((eventQueueItem: EventQueueItem) => {
      eventQueueItem.reject(new EventDroppedError())
    })

    return new Promise((resolve, reject) => {
      this.queue = [{ event, resolve, reject }]

      // NOTE: Dropping promise without awaiting
      this.processEventQueueIfNotProcessing()
    })
  }

  private async processEventQueueIfNotProcessing(): Promise<void> {
    if (this.currentEventQueueItem) {
      return
    }

    for (
      this.currentEventQueueItem = this.queue.shift();
      this.currentEventQueueItem;
      this.currentEventQueueItem = this.queue.shift()
    ) {
      const { currentEventQueueItem } = this
      const { event } = currentEventQueueItem

      try {
        this._currentState = await this._currentState.reduce(event)
        this.currentEventQueueItem.resolve(this._currentState)
      } catch (error) {
        this.currentEventQueueItem.reject(error)
      }
    }

    this.currentEventQueueItem = undefined
  }
}
