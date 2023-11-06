import { BotSystem } from '../BotSystem'
import BotInternals from './BotInternals'

export type HaltCallback = (bot: Bot) => void

export default class Bot {
  private internals: BotInternals

  constructor({ botSystem, onHalt }: { botSystem: BotSystem; onHalt: HaltCallback }) {
    this.internals = new BotInternals({ botSystem, onHalt, bot: this })
  }

  public get id(): string {
    return this.internals.id
  }

  public async disconnect(): Promise<void> {
    const promiseToRealDisconnect = new Promise<void>((resolve) => {
      this.internals.socket.once('disconnect', () => resolve())
    })

    await this.internals.sendDisconnectEvent()

    return promiseToRealDisconnect
  }
}
