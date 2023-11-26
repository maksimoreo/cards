import RoomGameTakeSix from '../lib/RoomGameTakeSix/Game'

interface InitOptions {
  readonly game: RoomGameTakeSix
}

export class MoveInactivePlayersToSpectators {
  public game: RoomGameTakeSix

  public static call(options: InitOptions) {
    new MoveInactivePlayersToSpectators(options).call()
  }

  public constructor(options: InitOptions) {
    this.game = options.game
  }

  public call() {}
}
