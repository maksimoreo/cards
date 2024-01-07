import App from './App'
import { SocketT } from './ISocketData'
import { AcknowledgeCallback } from './Router/AcknowledgeCallback'
import { ConnectHandlerConstructor, EventHandlerConstructor } from './Router/EventHandler'

type RouterDocument = {
  connect: ConnectHandlerConstructor | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: Record<string, EventHandlerConstructor<any>>
}

export class Router {
  private connectHandlerConstructor: ConnectHandlerConstructor | undefined | null

  constructor(private app: App) {}

  public draw(document: RouterDocument): void {
    this.connectHandlerConstructor = document.connect

    this.app.io.on('connect', async (socket) => {
      await this.handleConnect(socket)

      Object.entries(document.events).forEach(([clientEvent, eventHandlerConstructor]) => {
        socket.on(clientEvent, this.wrap(socket, clientEvent, eventHandlerConstructor))
      })
    })
  }

  private async handleConnect(socket: SocketT): Promise<void> {
    if (typeof this.connectHandlerConstructor !== 'function') {
      return
    }

    try {
      const handler = new this.connectHandlerConstructor(this.app, socket)
      await handler.call()
    } catch (e) {
      this.app.logger.error(e)
    }
  }

  private wrap<EventHandlerReturnT>(
    socket: SocketT,
    clientEvent: string,
    handlerConstructor: EventHandlerConstructor<EventHandlerReturnT>,
  ) {
    return async (firstArgument: unknown, secondArgument: unknown): Promise<void> => {
      try {
        this.app.logger.info({
          message: `Received new event: '${clientEvent}' from ${socket.id} (${socket.data.user?.name})`,
          isSocketEventLog: true,
          socketEvent: clientEvent,
          socketId: socket.id,
          userName: socket.data.user?.name,
          isBot: socket.data.user?.isBot,
          input: { firstArgument, secondArgument },
        })

        const currentUser = socket.data.user

        if (!currentUser) {
          throw `currentUser is not initialized on socket: ${socket.id}`
        }

        const acknowledgeCallback = new AcknowledgeCallback(secondArgument)
        const eventHandler = new handlerConstructor({
          app: this.app,
          socket,
          input: firstArgument,
          currentUser,
          acknowledgeCallback,
        })

        await eventHandler.call()

        if (clientEvent !== 'disconnect' && !acknowledgeCallback.wasCalled) {
          this.app.logger.warn('AcknowledgeCallback was not called')
        }
      } catch (e) {
        this.app.logger.error(e)
      }
    }
  }
}
