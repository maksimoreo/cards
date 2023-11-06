import { Logger } from 'winston'
import App from '../../App'
import { decide } from '../../utils'
import { Bot } from './Bot'
import { createBotsLogger } from './Logger'

interface BotSystemConfig {
  readonly botCountRange: {
    readonly min: number
    readonly max: number
  }
  readonly botPopulationInterval: number
}

// Orchestrates bots
export class BotSystem {
  public readonly botRoomIds: string[]
  public readonly logger: Logger

  private readonly app: App
  private readonly config: BotSystemConfig
  private readonly bots: Bot[]
  private botPopulationIntervalTimer: NodeJS.Timeout | undefined

  constructor({ app, config }: { app: App; config: BotSystemConfig }) {
    this.app = app
    this.config = config
    this.logger = createBotsLogger()
    this.bots = []
    this.botRoomIds = []
  }

  public get appConnectionUrl(): string {
    return `http://localhost:${this.app.port}`
  }

  public start(): void {
    this.logger.info('Starting BotSystem...')

    this.populateBots()
    this.botPopulationIntervalTimer = setInterval(() => {
      this.populateBots()
    }, this.config.botPopulationInterval)

    this.logger.info('BotSystem started.')
  }

  public async close(): Promise<void> {
    this.logger.info(`Closing BotSystem (${this.bots.length} connected bot(s))...`)

    clearInterval(this.botPopulationIntervalTimer)

    this.bots.map(async (bot) => {
      await bot.disconnect()
    })

    this.logger.info('BotSystem closed.')
  }

  public isBotRoom(roomId: string): boolean {
    return this.botRoomIds.some((id) => id === roomId)
  }

  public isBot(botId: string): boolean {
    return this.bots.some((bot) => bot.id === botId)
  }

  public populateBots(): void {
    if (this.bots.length < this.config.botCountRange.max && decide(0.2)) {
      this.createBot()
    }
  }

  public createBot(): void {
    this.logger.info('Creating new bot...')

    this.bots.push(new Bot({ botSystem: this, onHalt: (bot) => this.removeBotById(bot.id) }))

    this.logger.info('New bot created.')
  }

  private removeBotById(id: string): void {
    this.logger.info(`Removing bot by id: ${id}...`)

    const { bots } = this
    const index = bots.findIndex((bot) => bot.id === id)

    if (index === -1) {
      this.logger.error(`Could not find bot by id: ${id}, will not remove anything.`)
      return
    }

    bots.splice(index, 1)
    this.logger.info(`Removed bot by id: ${id}.`)
  }
}
