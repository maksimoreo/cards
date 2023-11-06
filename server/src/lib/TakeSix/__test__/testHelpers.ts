import Card from '../Card'
import { DEFAULT_CARDS_SET_VALUE_TO_PENALTY_POINTS_MAP } from '../defaultCardsSet'

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

export function c(value: number): Card
export function c(values: readonly number[]): Card[]
export function c(v: number | readonly number[]): Card | Card[] {
  return typeof v === 'number' ? cardFromValue(v) : cardsFromValues(v)
}
