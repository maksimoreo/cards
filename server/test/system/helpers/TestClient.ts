import { Socket } from 'socket.io-client'
import { connectClientAsync } from './testHelpers'

export class TestClient {
  public readonly socket: Socket
  public readonly expectedEventsQueue: string[] = []

  public static async connect({ port }: { port: number }): Promise<TestClient> {
    return new TestClient(await connectClientAsync(port))
  }

  constructor(socket: Socket) {
    this.socket = socket
    this.socket.onAny(this.handleAnySocketEvent.bind(this))
  }

  public dispose(): void {
    this.socket.offAny(this.handleAnySocketEvent.bind(this))

    if (this.socket.connected) {
      this.socket.disconnect()
    }
  }

  public get id(): string {
    return this.socket.id
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public waitForEvent<ResponseDataT = any>(event: string, { timeout }: { timeout: number }): Promise<ResponseDataT> {
    this.expectedEventsQueue.push(event)

    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null

      const handleEvent = (data: ResponseDataT): void => {
        timer && clearTimeout(timer)
        this.socket.off(event, handleEvent)

        const expectedEvent = this.expectedEventsQueue[0]
        if (event !== expectedEvent) {
          return reject(
            new Error(`Client '${this.id}' expected to receive '${expectedEvent}' first, but received '${event}'`),
          )
        }

        resolve(data)
      }

      timer = setTimeout(() => {
        this.socket.off(event, handleEvent)
        reject(new Error(`Client '${this.id}' did not receive '${event}' after ${timeout} ms`))
      }, timeout)

      this.socket.on(event, handleEvent)
    })
  }

  private handleAnySocketEvent(event: string) {
    const { expectedEventsQueue } = this
    const expectedEvent = expectedEventsQueue[0]

    if (event !== expectedEvent) {
      throw new Error(
        `Client '${this.id}' received unexpected event: '${event}'. Expected events queue [${
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
