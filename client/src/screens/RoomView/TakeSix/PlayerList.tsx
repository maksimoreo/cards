import classNames from 'classnames'
import { User } from '../../../commonTypes'
import UserNameFromUser from '../../../components/Chat/UserName/UserNameFromUser'
import { useRequiredRoom } from '../../../features/room/selectors'
import { useSocket } from '../../../hooks/useSocket'
import { RefSetter } from '../../../utils/utils'
import PlayingCard from './PlayingCard'
import { Card } from './types'

export type PlayerCardContainerHtmlElement = HTMLDivElement

type PlayerCardContainerRefSetter = RefSetter<PlayerCardContainerHtmlElement>

export interface PlayerListItem {
  readonly user: User

  readonly isActive: boolean
  readonly penaltyPoints: number

  // If hasSelectedCard === true && selectedCard === undefined -> selectedCard is hidden
  readonly hasSelectedCard: boolean
  readonly selectedCard: Card | undefined

  readonly isPickingRow: boolean
}

interface Props {
  readonly entries: readonly {
    readonly playerListItem: PlayerListItem
    readonly refSetter: PlayerCardContainerRefSetter
  }[]
}

export default function PlayerList({ entries }: Props): JSX.Element {
  const {
    socket: { id: currentUserId },
  } = useSocket()
  const {
    owner: { id: roomOwnerId },
  } = useRequiredRoom()

  const entriesWithAdditionalData = entries.map((entry) => {
    const userId = entry.playerListItem.user.id

    return {
      refSetter: entry.refSetter,
      playerListItem: {
        ...entry.playerListItem,
        isCurrentUser: currentUserId === userId,
        isRoomOwner: roomOwnerId === userId,
      },
    }
  })

  return (
    <table className='mx-auto mt-4' style={{ whiteSpace: 'nowrap' }}>
      <tbody>
        {entriesWithAdditionalData.map(({ playerListItem, refSetter }) => {
          return (
            <tr
              key={playerListItem.user.id}
              className={classNames('', playerListItem.isPickingRow && 'owl-takesix-player-list-item-selecting-row')}
            >
              <td className='pl-2 pr-4'>
                <UserNameFromUser user={playerListItem.user} isInactive={!playerListItem.isActive} />
              </td>

              <td className='px-2 text-center text-base text-neutral-400 lg:text-2xl'>
                {playerListItem.penaltyPoints}
              </td>

              <td className='py-1 pr-2'>
                <div className='h-7 w-5 lg:h-14 lg:w-10'>
                  <div ref={refSetter} className='h-7 w-5 lg:h-14 lg:w-10'>
                    {!playerListItem.isActive ? (
                      <div className='h-7 w-5 rounded lg:h-14 lg:w-10'></div>
                    ) : playerListItem.hasSelectedCard ? (
                      playerListItem.selectedCard === undefined ? (
                        <div className='h-7 w-5 rounded bg-neutral-500 lg:h-14 lg:w-10'></div>
                      ) : (
                        <div style={{ transform: 'scale(0.5) translate(-50%, -50%)' }}>
                          <PlayingCard card={playerListItem.selectedCard} />
                        </div>
                      )
                    ) : (
                      <div className='h-7 w-5 rounded bg-neutral-800 lg:h-14 lg:w-10'></div>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
