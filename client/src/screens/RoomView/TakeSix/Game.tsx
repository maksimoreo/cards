import { cloneDeep } from 'lodash'
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { RootState } from '../../../app/store'
import { selectRequired, useRequiredAllRoomUsers } from '../../../features/room/selectors'
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

interface Props {
  readonly onGameDone?: (finalGameState: GameState) => void
}

export default function Game(props: Props): JSX.Element {
  const { socket, send } = useSocket()
  const { id: currentUserId } = socket
  const allRoomUsers = useRequiredAllRoomUsers()
  const initialGameState = useSelector((state: RootState) => selectRequired(state.game))

  // PlayerList
  const [playerList, setPlayerList] = useState<readonly PlayerListItem[]>(
    initialGameState.gameState.players.map((player) => {
      const roomUser = allRoomUsers.find((user) => user.id === player.id)

      return {
        user: roomUser || player.user,
        penaltyPoints: player.penaltyPoints,
        hasSelectedCard: player.hasSelectedCard,
        selectedCard: undefined,
        isActive: player.isActive, // This prob will always be `true`
        isPickingRow:
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
    initialGameState.gameState.rows.map((row) => row.map((card) => new TiltedCard(card))),
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
  const [stepTimeoutIndicatorKey, setStepTimeoutIndicatorKey] = useState(false)
  const resetStepTimeoutIndicator = () => setStepTimeoutIndicatorKey((currentValue) => !currentValue)

  useSocketEventListener('notifyUserPlayedCard', ({ userId }) => {
    if (animationStep) {
      // Other player skipped animation and sent their card before current player's animation is finished.
      // Postpone handling of this notification until animation is done

      setPostponedCardSelections(postponedCardSelections.filter((item) => item !== userId).concat(userId))
      return
    }

    setHasSelectedCardTrue(userId)
  })

  const updatePlayerListOnUserLeave = (game: GameState) => {
    setPlayerList((playerList) =>
      game.players.map((player) => {
        const playerOnClient = playerList.find((playerOnClient) => playerOnClient.user.id === player.id)

        return {
          ...player,
          selectedCard: playerOnClient ? playerOnClient.selectedCard : undefined,
          isPickingRow: playerOnClient?.isPickingRow ?? false,
        }
      }),
    )
  }

  useSocketEventListener('notifyUserLeft', ({ game }) => {
    if (game) {
      updatePlayerListOnUserLeave(game)
    }
  })

  useSocketEventListener('notifyOwnerLeft', ({ game }) => {
    if (game) {
      updatePlayerListOnUserLeave(game)
    }
  })

  const finalizeStep = (gameState: GameState): void => {
    // Animations are done
    setAnimationStep(undefined)
    setAnimationStepTimer(undefined)

    // Remove all flying cards
    setFlyingCards([])

    // Render game state from server's state

    // Show players that selected cards while animation was playing
    setPlayerList(
      gameState.players.map((player) => ({
        penaltyPoints: player.penaltyPoints,
        user: allRoomUsers.find((user) => user.id === player.id) || player.user,
        hasSelectedCard: postponedCardSelections.includes(player.id),
        selectedCard: undefined,
        isActive: player.isActive,
        isPickingRow: false,
      })),
    )
    setPostponedCardSelections([])

    setCardsFieldRows(
      gameState.rows.map((row, rowIndex) =>
        row.map((card, cardIndex) => {
          const tiltedCard = cardsFieldRows[rowIndex][cardIndex]

          const tilt = tiltedCard ? tiltedCard.tilt : getRandomTilt()

          return { card, tilt }
        }),
      ),
    )

    if (gameState.stepsLeft === 0) {
      console.log('Our frontend intelligence has detected that the gaem has been ended')

      props.onGameDone && props.onGameDone(gameState)

      return
    }

    // Allow selecting cards
    setAllowSelectCard(true)
  }

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
                isPickingRow: waitingPlayerId === playerListItem.user.id,
              })),
            )

            // Wait for 'notifyGameStep' message
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
            return playerListItem
          }

          return {
            ...playerListItem,
            hasSelectedCard: false,
            selectedCard: undefined,
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
      // Do this as separate step to ensure that finalizeStep() function gets the most recent updated state vars
      finalizeStep(animationStep.finalGameState)
    }
  }, [animationStep])

  useSocketEventListener('notifyGameStep', (data): void => {
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
      finalGameState: data.gameState,
    })
  })

  const handleRowSelected = (rowIndex: number): void => {
    // TODO: Indicate that message is sent and we are waiting for the response from the server
    send('selectRow', { rowIndex }, (response) => {
      if (response.code === 'SUCCESS') {
        setAllowSelectRow(false)

        // Continue when 'notifyGameStep' message comes in
      }
    })
  }

  const handleCardSelected = (cardIndex: number): void => {
    if (!currentPlayerCards) {
      return
    }

    const selectedCard = currentPlayerCards[cardIndex]

    setSelectedCardIndex({ index: cardIndex, accepted: false })

    send('playCard', { card: selectedCard.value }, (response) => {
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
        <div className='mx-2 flex items-center md:mx-4'>
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
      <StepTimeoutIndicator key={stepTimeoutIndicatorKey.toString()} />
    </>
  )
}
