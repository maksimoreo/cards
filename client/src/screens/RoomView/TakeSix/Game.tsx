import { cloneDeep } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { S2C_EventData } from 'common/src/TypedClientSocket/ServerToClientEvents'
import { RootState } from '../../../app/store'
import { useUserIdentityCreator } from '../../../components/Chat/UserName/UserIdentity'
import { addMessage } from '../../../features/chat/chatSlice'
import { selectRequired, useRequiredAllRoomUsers } from '../../../features/room/selectors'
import useCurrentUser from '../../../hooks/useCurrentUser'
import useParty from '../../../hooks/useParty'
import { useSocket } from '../../../hooks/useSocket'
import useSocketEventListener from '../../../hooks/useSocketEventListener'
import { findByIdOrThrow } from '../../../utils/utils'
import CardsField from './CardsField/CardsField'
import { TiltedCard, TiltedCardHtmlElement, getRandomTilt } from './CardsField/Item'
import { RowNewItemSpaceHtmlElement } from './CardsField/Row'
import { FlyingCard } from './FlyingCardView'
import FlyingCardsContainer from './FlyingCardsContainer'
import PlayerHand from './PlayerHand'
import PlayerList, { PlayerCardContainerHtmlElement, PlayerListItem } from './PlayerList'
import StepTimeoutIndicator from './StepTimeoutIndicator/StepTimeoutIndicator'
import { Card, GameState, GameStep, PlayerMove } from './types'

const CARD_FLY_DURATION = 700
const PLAYER_CARDS_REVEAL_DURATION = 700
const AFTER_GAME_COMPLETED_DURATION = 2000

interface Props {
  readonly onGameDone?: (finalGameState: GameState) => void
}

export default function Game(props: Props): JSX.Element {
  const { socket, emit } = useSocket()
  const { id: currentUserId } = socket
  const allRoomUsers = useRequiredAllRoomUsers()
  const initialGameState = useSelector((state: RootState) => selectRequired(state.game))
  const { party } = useParty()
  const [delayedGameCompletedEvent, setDelayedGameCompletedEvent] = useState<S2C_EventData<'s2c_gameStopped'> | null>(
    null,
  )
  const currentUser = useCurrentUser()
  const dispatch = useDispatch()
  const createUserIdentity = useUserIdentityCreator()

  // PlayerList
  const [playerList, setPlayerList] = useState<readonly PlayerListItem[]>(
    initialGameState.game.players.map((player) => {
      const roomUser = allRoomUsers.find((user) => user.id === player.id)

      return {
        user: roomUser || player.user,
        penaltyPoints: player.penaltyPoints,
        hasSelectedCard: player.hasSelectedCard,
        selectedCard: undefined,
        isActive: player.isActive,
        isHighlighted:
          (initialGameState.lastStep &&
            'waitingPlayer' in initialGameState.lastStep &&
            initialGameState.lastStep.waitingPlayer === player.id) ??
          false,
      }
    }),
  )
  const playerCardContainersRef = useRef<PlayerCardContainerHtmlElement[]>([])
  const setHasSelectedCardTrue = (userId: string): void => {
    const playerListItemIndex = playerList.findIndex((item) => item.user.id === userId)

    setPlayerList([
      ...playerList.slice(0, playerListItemIndex),
      { ...playerList[playerListItemIndex], hasSelectedCard: true },
      ...playerList.slice(playerListItemIndex + 1),
    ])
  }

  // CardsField
  const [cardsFieldRows, setCardsFieldRows] = useState<readonly (readonly TiltedCard[])[]>(
    initialGameState.game.rows.map((row) => row.map((card) => new TiltedCard(card))),
  )
  const cardsFieldCardsRef = useRef<TiltedCardHtmlElement[][]>([])
  const rowNewItemEmptySpacesRef = useRef<RowNewItemSpaceHtmlElement[]>([])
  const [allowSelectRow, setAllowSelectRow] = useState(false)

  // PlayerHand
  const [currentPlayerCards, setCurrentPlayerCards] = useState<readonly Card[] | undefined>(
    initialGameState.playerCards,
  )
  const [selectedCardIndex, setSelectedCardIndex] = useState<
    { readonly index: number; readonly accepted: boolean } | undefined
  >()
  const [allowSelectCard, setAllowSelectCard] = useState(true)

  // Other
  const [stepsLeft, setStepsLeft] = useState(initialGameState.game.stepsLeft)

  // Animation
  type AnimationStep =
    | {
        readonly type: 'revealingCards'
        readonly gameStep: GameStep
        readonly finalGameState: GameState
      }
    | {
        readonly type: 'playingCard'
        readonly currentMoveIndex: number
        readonly moves: readonly PlayerMove[]
        readonly finalGameState: GameState
      }
    | {
        readonly type: 'takingCards'
        readonly currentMoveIndex: number
        readonly moves: readonly PlayerMove[]
        readonly finalGameState: GameState
      }
    | {
        readonly type: 'finalize'
        readonly finalGameState: GameState
      }
  const [flyingCards, setFlyingCards] = useState<readonly FlyingCard[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_animationStepTimer, setAnimationStepTimer] = useState<ReturnType<typeof setTimeout> | undefined>()
  const [animationStep, setAnimationStep] = useState<AnimationStep | undefined>()
  const [postponedCardSelections, setPostponedCardSelections] = useState<readonly string[]>([])

  // Step timeout indication
  // Note: Cannot use true/false here (i.e., need more than 2 states), bc sometimes there are multiple (2) messages per single render frame
  const [stepTimeoutIndicatorEnabled, setStepTimeoutIndicatorEnabled] = useState(true)
  const [stepTimeoutIndicatorKey, setStepTimeoutIndicatorKey] = useState(0)
  const resetStepTimeoutIndicator = () => setStepTimeoutIndicatorKey((currentValue) => currentValue + 1)

  useSocketEventListener('s2c_userPlayedCard', ({ userId }) => {
    if (animationStep) {
      // Other player skipped animation and sent their card before current player's animation is finished.
      // Postpone handling of this notification until animation is done

      setPostponedCardSelections(postponedCardSelections.filter((item) => item !== userId).concat(userId))
      return
    }

    setHasSelectedCardTrue(userId)
  })

  useSocketEventListener('s2c_usersLeft', ({ game }) => {
    if (!game) {
      return
    }

    setPlayerList((playerList) =>
      game.players.map((player) => {
        const playerOnClient = playerList.find((playerOnClient) => playerOnClient.user.id === player.id)

        return {
          ...player,
          selectedCard: playerOnClient ? playerOnClient.selectedCard : undefined,
          isHighlighted: playerOnClient?.isHighlighted ?? false,
        }
      }),
    )
  })

  useEffect(() => {
    if (!animationStep) {
      return
    }

    if (animationStep.type === 'revealingCards') {
      // Start this animation step
      const { gameStep, finalGameState } = animationStep

      // Reveal all cards
      setPlayerList(
        playerList.map((playerListItem) => {
          const selectedCard = gameStep.selectedCards.find((entry) => entry.playerId === playerListItem.user.id)?.card

          return {
            ...cloneDeep(playerListItem),
            hasSelectedCard: !!selectedCard,
            selectedCard,
          }
        }),
      )

      // After this animation is done
      setAnimationStepTimer(
        setTimeout((): void => {
          // Start next animation step
          if ('waitingPlayer' in gameStep) {
            setAnimationStep(undefined)

            const waitingPlayerId = gameStep.waitingPlayer

            if (waitingPlayerId === currentUserId) {
              setAllowSelectRow(true)
            }

            setPlayerList((playerList) =>
              playerList.map((playerListItem) => ({
                ...playerListItem,
                isHighlighted: waitingPlayerId === playerListItem.user.id,
              })),
            )

            // Wait for 's2c_gameStep' event
          } else {
            setAnimationStep({
              type: 'playingCard',
              currentMoveIndex: 0,
              moves: gameStep.moves,
              finalGameState: finalGameState,
            })
          }
        }, PLAYER_CARDS_REVEAL_DURATION),
      )
    } else if (animationStep.type === 'playingCard') {
      // Start this animation step
      const { moves, currentMoveIndex } = animationStep
      const move = moves[currentMoveIndex]

      // Remove card from source
      setPlayerList(
        playerList.map((playerListItem) => {
          if (playerListItem.user.id !== move.playerId) {
            return { ...playerListItem, isHighlighted: false }
          }

          return {
            ...playerListItem,
            hasSelectedCard: false,
            selectedCard: undefined,
            isHighlighted: true,
          }
        }),
      )

      // Create fake flying card
      const playerListItemIndex = playerList.findIndex((playerListItem) => playerListItem.user.id === move.playerId)

      const sourceRect = playerCardContainersRef.current[playerListItemIndex].getBoundingClientRect()
      const destinationRect = rowNewItemEmptySpacesRef.current[move.rowIndex].getBoundingClientRect()

      const tilt = getRandomTilt()

      // TODO: Add (generate) react prop 'key' here, in case u want to have multiple flying cards
      setFlyingCards([
        {
          card: move.card,
          from: {
            left: sourceRect.left,
            top: sourceRect.top,
            rotate: 0,
            scale: 0.5,
            opacity: 1,
          },
          to: {
            left: destinationRect.left,
            top: destinationRect.top,
            rotate: tilt,
            scale: 1,
            opacity: 1,
          },
          duration: CARD_FLY_DURATION,
        },
      ])

      // After this animation is done
      setAnimationStepTimer(
        setTimeout((): void => {
          // Dispose this animation step
          // Remove flying card
          setFlyingCards([])

          // Add real card to destination
          setCardsFieldRows(
            cardsFieldRows.map((row, index) => {
              if (index !== move.rowIndex) {
                return row
              }

              return [...row, new TiltedCard(move.card, tilt)]
            }),
          )

          // Start next animation step
          if (move.takesRow) {
            setAnimationStep({
              ...animationStep,
              type: 'takingCards',
            })
          } else {
            const nextMoveIndex = currentMoveIndex + 1

            if (nextMoveIndex < moves.length) {
              setAnimationStep({
                ...animationStep,
                currentMoveIndex: nextMoveIndex,
                type: 'playingCard',
              })
            } else {
              setAnimationStep({ ...animationStep, type: 'finalize' })
            }
          }
        }, CARD_FLY_DURATION),
      )
    } else if (animationStep.type === 'takingCards') {
      // Start this animation step
      const { moves, currentMoveIndex } = animationStep
      const move = moves[currentMoveIndex]

      // Cache cards that are going to fly
      // Drop last card
      const cardsToFly = cloneDeep(cardsFieldRows[move.rowIndex].slice(0, -1))

      // Create fake flying cards
      const playerListEntryIndex = playerList.findIndex((playerListEntry) => playerListEntry.user.id === move.playerId)

      const destinationRect = playerCardContainersRef.current[playerListEntryIndex].getBoundingClientRect()

      setFlyingCards(
        cardsToFly.map((tiltedCard, cardIndex) => {
          const sourceRect = cardsFieldCardsRef.current[move.rowIndex][cardIndex].getBoundingClientRect()

          return {
            card: tiltedCard.card,
            duration: CARD_FLY_DURATION,
            from: {
              rotate: tiltedCard.tilt,
              left: sourceRect.left,
              top: sourceRect.top,
              scale: 1,
              opacity: 1,
            },
            to: {
              rotate: 0,
              left: destinationRect.left,
              top: destinationRect.top,
              scale: 0.5,
              opacity: 0.5,
            },
          }
        }),
      )

      // Remove cards from source
      setCardsFieldRows(
        cardsFieldRows.map((row, index) => {
          if (index !== move.rowIndex) {
            return row
          }

          const lastItem = row[row.length - 1]

          return [cloneDeep(lastItem)]
        }),
      )

      // Increase player's penalty points
      setPlayerList(
        playerList.map((playerListEntry) => {
          if (playerListEntry.user.id !== move.playerId) {
            return playerListEntry
          }

          const newPenaltyPoints = findByIdOrThrow(animationStep.finalGameState.players, move.playerId).penaltyPoints

          return {
            ...playerListEntry,
            penaltyPoints: newPenaltyPoints,
          }
        }),
      )

      // After this animation is done
      setAnimationStepTimer(
        setTimeout((): void => {
          // Dispose this animation step
          // Remove flying cards
          setFlyingCards([])

          // Start next animation step
          const nextMoveIndex = currentMoveIndex + 1

          if (nextMoveIndex < moves.length) {
            setAnimationStep({
              ...animationStep,
              currentMoveIndex: nextMoveIndex,
              type: 'playingCard',
            })
          } else {
            setAnimationStep({ ...animationStep, type: 'finalize' })
          }
        }, CARD_FLY_DURATION),
      )
    } else if (animationStep.type === 'finalize') {
      // Remove all flying cards
      setFlyingCards([])

      // Render game state from server's state

      // Show players that selected cards while animation was playing
      setPlayerList(
        animationStep.finalGameState.players.map((player) => ({
          penaltyPoints: player.penaltyPoints,
          user: allRoomUsers.find((user) => user.id === player.id) || player.user,
          hasSelectedCard: postponedCardSelections.includes(player.id),
          selectedCard: undefined,
          isActive: player.isActive,
          isHighlighted: false,
        })),
      )
      setPostponedCardSelections([])

      setCardsFieldRows(
        animationStep.finalGameState.rows.map((row, rowIndex) =>
          row.map((card, cardIndex) => {
            const tiltedCard = cardsFieldRows[rowIndex][cardIndex]

            const tilt = tiltedCard ? tiltedCard.tilt : getRandomTilt()

            return { card, tilt }
          }),
        ),
      )

      if (delayedGameCompletedEvent) {
        const winnerIds = delayedGameCompletedEvent.winners.map((winner) => winner.id)

        if (winnerIds.includes(currentUser.id)) {
          party()
        }

        dispatch(
          addMessage({
            type: 'gameEnded',
            data: {
              reason: 'completed',
              winners: delayedGameCompletedEvent.winners.map((winner) => ({
                user: createUserIdentity(winner.user),
                penaltyPoints: winner.penaltyPoints,
              })),
              otherPlayers: delayedGameCompletedEvent.game.players
                .filter((player) => player.isActive && !winnerIds.includes(player.id))
                .sort((a, b) => a.penaltyPoints - b.penaltyPoints)
                .map((winner) => ({
                  user: createUserIdentity(winner.user),
                  penaltyPoints: winner.penaltyPoints,
                })),
            },
          }),
        )

        setAnimationStepTimer(
          setTimeout((): void => {
            props.onGameDone && props.onGameDone(animationStep.finalGameState)
          }, AFTER_GAME_COMPLETED_DURATION),
        )

        return
      }

      // Animations are done
      setAnimationStep(undefined)
      setAnimationStepTimer(undefined)

      // Allow selecting cards
      setAllowSelectCard(true)
    }
  }, [animationStep])

  useSocketEventListener('s2c_gameStep', (data): void => {
    setStepsLeft(data.game.stepsLeft)

    // Players will see animations for up to ~ 5-10 seconds, but server is already counting step timeout
    resetStepTimeoutIndicator()

    // Render player cards from server cards
    setCurrentPlayerCards(data.playerCards)

    // Unselect card
    setSelectedCardIndex(undefined)

    // Disallow selection of cards during animation
    setAllowSelectCard(false)
    setAllowSelectRow(false)

    // Start game step animation
    setAnimationStep({
      type: 'revealingCards',
      gameStep: data.step,
      finalGameState: data.game,
    })
  })

  useSocketEventListener('s2c_gameStopped', (data) => {
    if (data.reason !== 'completed') {
      // RoomView will handle it
      return
    }

    // Process this event after animations are completed
    setDelayedGameCompletedEvent(data)

    setStepTimeoutIndicatorEnabled(false)
  })

  const handleRowSelected = (rowIndex: number): void => {
    // TODO: Indicate that event is sent and we are waiting for the response from the server
    emit('selectRow', { rowIndex }, (response) => {
      if (response.code === 'SUCCESS') {
        setAllowSelectRow(false)

        // Continue when 's2c_gameStep' event comes in
      }
    })
  }

  const handleCardSelected = (cardIndex: number): void => {
    if (!currentPlayerCards) {
      return
    }

    const selectedCard = currentPlayerCards[cardIndex]

    setSelectedCardIndex({ index: cardIndex, accepted: false })

    emit('playCard', { card: selectedCard.value }, (response) => {
      if (response.code !== 'SUCCESS') {
        setSelectedCardIndex(undefined)

        throw Error('Unexpected response from the server')
      }

      // Bright border around selected card
      setSelectedCardIndex({ index: cardIndex, accepted: true })

      // Card selected identificator next to item in player list
      setHasSelectedCardTrue(currentUserId)
    })
  }

  return (
    <>
      <div className='flex flex-col md:flex-row' style={{ height: 'calc(100vh - 48px)' }}>
        <div className='mx-2 flex flex-col justify-center md:mx-4'>
          <p className='mb-1 text-center text-lg text-neutral-400'>
            <span className='font-bold text-neutral-300'>{stepsLeft}</span> Steps left
          </p>

          <PlayerList
            entries={playerList.map((playerListItem, index) => ({
              playerListItem,
              refSetter: (el): void => {
                playerCardContainersRef.current[index] = el
              },
            }))}
          />
        </div>

        <div className='mt-2 flex flex-col justify-center md:mt-0 md:flex-grow'>
          <div className='overflow-y-scroll pb-16 lg:pb-36'>
            <CardsField
              rows={cardsFieldRows.map((row, rowIndex) => ({
                items: row.map((tiltedCard, cardIndex) => ({
                  tiltedCard,
                  refSetter: (el): void => {
                    cardsFieldCardsRef.current[rowIndex] = cardsFieldCardsRef.current[rowIndex] || []
                    cardsFieldCardsRef.current[rowIndex][cardIndex] = el
                  },
                })),
                newItemEmptySpaceRefSetter: (el): void => {
                  rowNewItemEmptySpacesRef.current[rowIndex] = el
                },
              }))}
              allowSelectRow={allowSelectRow}
              onRowSelected={handleRowSelected}
            />
          </div>
        </div>
      </div>

      {currentPlayerCards && (
        <div className='flex justify-center'>
          <PlayerHand
            cards={currentPlayerCards}
            selectedCard={selectedCardIndex}
            onCardSelected={handleCardSelected}
            allowSelectCard={allowSelectCard}
          />
        </div>
      )}

      <FlyingCardsContainer flyingCards={flyingCards} />

      {/* By changing React's key, we can forcefully re-render this component, to restart animations */}
      {stepTimeoutIndicatorEnabled && <StepTimeoutIndicator key={stepTimeoutIndicatorKey.toString()} />}
    </>
  )
}
