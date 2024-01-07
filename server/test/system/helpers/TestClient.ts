import {
  SERVER_NOTIFICATION_DATA_SCHEMA_MAP,
  ServerToClientEventsUnion,
} from 'common/src/TypedClientSocket/ServerToClientEvents'
import { Socket } from 'socket.io-client'
import { z } from 'zod'
import { connectClientAsync, emitEvent } from './testHelpers'

// Holds a socket and a queue of expected events
export class TestClient {
  public readonly socket: Socket
  public readonly expectedEventsQueue: string[] = []

  /**
   * Should match variable name in source code, for easier traceability of failed tests. Is not expected to match user.name or socket.id. Convention is to use `client1`, `client2`, `client3` and so on.
   */
  public readonly variableName: string
  public disposed: boolean = false

  public static async connect({ port, variableName }: { port: number; variableName: string }): Promise<TestClient> {
    return new TestClient(await connectClientAsync(port), variableName)
  }

  constructor(socket: Socket, variableName: string) {
    this.socket = socket
    this.variableName = variableName
    this.socket.onAny(this.handleAnySocketEvent.bind(this))
  }

  public dispose(): void {
    if (this.disposed) {
      throw new Error('This object is already disposed')
    }

    this.socket.offAny(this.handleAnySocketEvent.bind(this))

    if (this.socket.connected) {
      this.socket.disconnect()
    }

    this.disposed = true
  }

  public get id(): string {
    return this.socket.id
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public emitEvent<RequestDataT = any, ResponseDataT = any>(
    event: string,
    data: RequestDataT,
    timeout = 1000,
  ): Promise<ResponseDataT> {
    return emitEvent(this.socket, event, data, timeout)
  }

  public waitForEvent<Event extends ServerToClientEventsUnion>(
    event: Event,
    options?: { timeout: number } | null | undefined,
  ): Promise<z.infer<(typeof SERVER_NOTIFICATION_DATA_SCHEMA_MAP)[Event]>> {
    const { socket } = this
    const timeout = options?.timeout || 1000

    this.expectedEventsQueue.push(event)

    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null

      const handleEvent = (unknownData: unknown): void => {
        timer && clearTimeout(timer)
        socket.off.apply(socket, [event, handleEvent])

        // const expectedEvent = this.expectedEventsQueue[0]
        // if (event !== expectedEvent) {
        //   return reject(
        //     new Error(`Client '${this.variableName}' expected to receive '${expectedEvent}' first, but received '${event}'`),
        //   )
        // }

        const dataSchema = SERVER_NOTIFICATION_DATA_SCHEMA_MAP[event]

        // Using `safeParse` here instead of `parse`, because need to call `reject` explicitly
        const dataParsingResult = dataSchema.safeParse(unknownData)

        if (dataParsingResult.success) {
          resolve(dataParsingResult.data)
        } else {
          reject(dataParsingResult.error)
        }
      }

      timer = setTimeout(() => {
        socket.off.apply(socket, [event, handleEvent])
        reject(new Error(`Client '${this.variableName}' did not receive '${event}' after ${timeout} ms`))
      }, timeout)

      socket.on.apply(socket, [event, handleEvent])
    })
  }

  private handleAnySocketEvent(event: string) {
    const { expectedEventsQueue } = this
    const expectedEvent = expectedEventsQueue[0]

    if (event !== expectedEvent) {
      throw new Error(
        `Client '${this.variableName}' received unexpected event: '${event}'. Expected events queue [${
          this.expectedEventsQueue.length
        }]: ${expectedEventsQueue
          .slice(0, 5)
          .map((event) => `"${event}"`)
          .join(', ')}`,
      )
    }

    expectedEventsQueue.shift()
  }
}
