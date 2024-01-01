import { Socket } from 'socket.io-client'
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public waitForEvent<ResponseDataT = any>(
    event: string,
    options?: { timeout: number } | null | undefined,
  ): Promise<ResponseDataT> {
    const timeout = options?.timeout || 1000

    this.expectedEventsQueue.push(event)

    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null

      const handleEvent = (data: ResponseDataT): void => {
        timer && clearTimeout(timer)
        this.socket.off(event, handleEvent)

        // const expectedEvent = this.expectedEventsQueue[0]
        // if (event !== expectedEvent) {
        //   return reject(
        //     new Error(`Client '${this.variableName}' expected to receive '${expectedEvent}' first, but received '${event}'`),
        //   )
        // }

        resolve(data)
      }

      timer = setTimeout(() => {
        this.socket.off(event, handleEvent)
        reject(new Error(`Client '${this.variableName}' did not receive '${event}' after ${timeout} ms`))
      }, timeout)

      this.socket.on(event, handleEvent)
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
