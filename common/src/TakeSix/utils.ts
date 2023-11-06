import { Card } from './types'
import { DEFAULT_CARDS_SET_VALUE_TO_PENALTY_POINTS_MAP } from './defaultCardsSet'

export function createValueToPenaltyPointsMapFromCardsSet(cardsSet: readonly Card[]): Map<number, number> {
  return new Map(cardsSet.map(({ value, penaltyPoints }) => [value, penaltyPoints]))
}

export function createValueToCardMapFromCardsSet(cardsSet: readonly Card[]): Map<number, Card> {
  return new Map(cardsSet.map((card) => [card.value, card]))
}

export function cardFromValue(value: number): Card {
  const penaltyPoints = DEFAULT_CARDS_SET_VALUE_TO_PENALTY_POINTS_MAP.get(value)

  if (!penaltyPoints) {
    throw `Invalid card value: ${value}`
  }

  return { value, penaltyPoints }
}

export function cardsFromValues(values: readonly number[]): Card[] {
  return values.map(cardFromValue)
}

export function cardOrCardsFromValues(value: number): Card
export function cardOrCardsFromValues(values: readonly number[]): Card[]
export function cardOrCardsFromValues(v: number | readonly number[]): Card | Card[] {
  return typeof v === 'number' ? cardFromValue(v) : cardsFromValues(v)
}
