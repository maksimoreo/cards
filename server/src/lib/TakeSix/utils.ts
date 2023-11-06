import Card from './Card'

export function createValueToPenaltyPointsMapFromCardsSet(cardsSet: readonly Card[]): Map<number, number> {
  return new Map(cardsSet.map(({ value, penaltyPoints }) => [value, penaltyPoints]))
}

export function createValueToCardMapFromCardsSet(cardsSet: readonly Card[]): Map<number, Card> {
  return new Map(cardsSet.map((card) => [card.value, card]))
}
