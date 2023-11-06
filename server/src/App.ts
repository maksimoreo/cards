import express from 'express'
import http from 'http'
import path from 'path'
import { Logger } from 'winston'

import Room from './models/Room'

import { ServerT, socketIoServerConstructor } from './ISocketData'
import UsersDatabase from './db/UsersDatabase'
import { BotSystem } from './lib/Bots/BotSystem'
import defineRoutes from './routes'

interface AppOptions {
  readonly port?: number
  readonly logger: Logger
  readonly botsEnabled?: boolean
  readonly expressAppHostname?: string | null | undefined
}

export default class App {
  public readonly logger: Logger
  public readonly io: ServerT
  public readonly users: UsersDatabase
  public readonly rooms: Room[]

  public readonly expressAppHostname: string
  public readonly port: number

  public botSystem: BotSystem | undefined

  private readonly expressApp: express.Application
  private readonly httpServer: http.Server

  constructor(options: AppOptions) {
    // Init logger
    this.logger = options.logger

    // Init simple fields
    this.expressAppHostname = options.expressAppHostname ?? 'localhost'
    this.port = options.port || 5000

    this.logger.info(
      `Initializing with options:\nExpress app port: ${this.port}\nExpress app hostname: ${this.expressAppHostname}`,
    )

    // Init databases
    this.users = new UsersDatabase()
    this.rooms = []

    // Init express app
    this.expressApp = express()
    // Make sure frontend app is built and up to date (run from root directory: `yarn workspace client build`)
    this.expressApp.use(express.static(path.join(__dirname, '..', '..', 'client', 'dist')))

    // Init http server
    this.httpServer = http.createServer(this.expressApp)

    // Init SocketIO
    this.io = new socketIoServerConstructor(this.httpServer, {
      cors: {
        origin: '*',
      },
    })

    defineRoutes(this)
  }

  public async start(): Promise<void> {
    await this.startServer()

    if (process.env.OWL_SERVER_ENABLE_BOTS && process.env.OWL_SERVER_ENABLE_BOTS !== '0') {
      this.startBotSystem()
    }
  }

  public startServer(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.listen(this.port, this.expressAppHostname, () => {
        resolve()
      })
    })
  }

  public startBotSystem(): void {
    if (this.botSystem) {
      return
    }

    this.botSystem = new BotSystem({
      app: this,
      config: {
        botCountRange: {
          min: 0,
          max: 10,
        },
        botPopulationInterval: 10 * 1000,
      },
    })
    this.botSystem.start()
  }

  public async close(): Promise<void> {
    try {
      this.logger.info('Closing App...')

      if (this.botSystem) {
        this.logger.info('Closing BotSystem...')
        await this.botSystem.close()
      }

      this.logger.info('Closing all rooms...')
      this.rooms.forEach((room) => {
        room.close()
      })

      this.logger.info('Closing server...')
      const ioClosePromise = new Promise<void>((resolve, reject) => {
        this.io.close((err) => {
          if (err) {
            reject(err)
          }

          resolve()
        })
      })

      await ioClosePromise

      this.logger.info('Bye')
    } catch (error) {
      this.logger.info('Catched an error, will force close HTTP & WebSocket server')
      this.io.close()
      throw error
    }
  }

  public async closeBotSystem(): Promise<void> {
    if (!this.botSystem) {
      return
    }

    return this.botSystem.close()
  }
}
