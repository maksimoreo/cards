import { faker } from '@faker-js/faker'
import { random, sample } from 'lodash'

import { generateRandomColor, generateRandomName } from 'common/src/username'
import { ALLOWED_CHARACTERS_IN_USERNAME_REGEX, MAX_USERNAME_LENGTH } from '../../../../handlers/SetNameHandler'
import BotInternals from '../BotInternals'
import { State, UnexpectedEventError } from '../StateMachine'
import { GetAllRoomsListItem, Room } from '../dataTypes'
import { StateUpdateEvent } from '../events'
import { UnsuccessfulSendError } from '../socketEmitEvent'
import WaitingForPlayersState from './WaitingForPlayersState'
import { gracefullyDisconnectSocket } from './shared'

export default class InternalState {
  public readonly type = 'initial'
  public readonly botInternals: BotInternals

  constructor({ botInternals }: { botInternals: BotInternals }) {
    this.botInternals = botInternals
  }

  public async reduce(event: StateUpdateEvent): Promise<State> {
    const { botInternals } = this

    if (event.type === 'socketConnect') {
      await botInternals.socketEmit('setName', { name: generateUserName(), color: generateRandomColor() })

      const allRooms = await botInternals.socketEmit('getAllRooms', null)

      const waitingBotRooms = allRooms.filter((room) => botInternals.botSystem.isBotRoom(room.id) && !room.isPlaying)

      if (waitingBotRooms.length) {
        const randomRoomId = (sample(waitingBotRooms) as GetAllRoomsListItem).id

        const joinedRoom = (await botInternals.socketEmit('joinRoom', { id: randomRoomId })).room

        return new WaitingForPlayersState({ ...this, room: joinedRoom })
      }

      const createdRoom = await tryCreateRoom(botInternals)

      if (!createdRoom) {
        return gracefullyDisconnectSocket({ botInternals })
      }

      botInternals.botSystem.botRoomIds.push(createdRoom.id)

      return new WaitingForPlayersState({ ...this, room: createdRoom })
    }

    throw new UnexpectedEventError(event)
  }
}

function generateUserName(): string {
  if (random(0, 1, true) > 0.6) {
    return faker.internet
      .displayName()
      .split('')
      .filter((char) => char.match(ALLOWED_CHARACTERS_IN_USERNAME_REGEX))
      .join('')
      .substring(0, MAX_USERNAME_LENGTH)
  }

  return generateRandomName()
}

function generateRoomName(): string {
  return faker.location
    .city()
    .split('')
    .filter((char) => char.match(ALLOWED_CHARACTERS_IN_USERNAME_REGEX))
    .join('')
    .substring(0, MAX_USERNAME_LENGTH)
}

async function tryCreateRoom(botInternals: BotInternals): Promise<Room | undefined> {
  for (let i = 0; i < 3; i++) {
    try {
      return (await botInternals.socketEmit('createRoom', { name: generateRoomName() })).room
    } catch (error) {
      if (error instanceof UnsuccessfulSendError && error.response.message === 'BAD_REQUEST') {
        botInternals.logger.info(
          `Bot '${botInternals.id}' attempted to create room (attempt #${i}) but received response: '${error.response.message}'`,
        )
        continue
      }

      throw error
    }
  }
}
