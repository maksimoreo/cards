import App from './App'
import { SocketT } from './ISocketData'
import { ConnectHandlerConstructor, MessageHandlerConstructor } from './Router/MessageHandler'
import { AcknowledgeCallback } from './Router/AcknowledgeCallback'

type RouterDocument = {
  connect: ConnectHandlerConstructor | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: Record<string, MessageHandlerConstructor<any>>
}

export class Router {
  private connectHandlerConstructor: ConnectHandlerConstructor | undefined | null

  constructor(private app: App) {}

  public draw(document: RouterDocument): void {
    this.connectHandlerConstructor = document.connect

    this.app.io.on('connect', async (socket) => {
      await this.handleConnect(socket)

      Object.entries(document.messages).forEach(([clientMessage, messageHandlerConstructor]) => {
        socket.on(clientMessage, this.wrap(socket, clientMessage, messageHandlerConstructor))
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

  private wrap<MessageHandlerReturnT>(
    socket: SocketT,
    clientMessage: string,
    handlerConstructor: MessageHandlerConstructor<MessageHandlerReturnT>,
  ) {
    return async (firstArgument: unknown, secondArgument: unknown): Promise<void> => {
      try {
        this.app.logger.info({
          message: `Received new message: '${clientMessage}' from ${socket.id} (${socket.data.user?.name})`,
          isSocketMessageLog: true,
          socketEvent: clientMessage,
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
        const messageHandler = new handlerConstructor({
          app: this.app,
          socket,
          input: firstArgument,
          currentUser,
          acknowledgeCallback,
        })

        await messageHandler.call()

        if (clientMessage !== 'disconnect' && !acknowledgeCallback.wasCalled) {
          this.app.logger.warn('AcknowledgeCallback was not called')
        }
      } catch (e) {
        this.app.logger.error(e)
      }
    }
  }
}
