import Card from './Card'
import { createValueToCardMapFromCardsSet, createValueToPenaltyPointsMapFromCardsSet } from './utils'

// https://en.wikipedia.org/wiki/6_nimmt!#Rules
const DEFAULT_CARDS_SET: readonly Card[] = [
  { value: 1, penaltyPoints: 1 },
  { value: 2, penaltyPoints: 1 },
  { value: 3, penaltyPoints: 1 },
  { value: 4, penaltyPoints: 1 },
  { value: 5, penaltyPoints: 2 },
  { value: 6, penaltyPoints: 1 },
  { value: 7, penaltyPoints: 1 },
  { value: 8, penaltyPoints: 1 },
  { value: 9, penaltyPoints: 1 },
  { value: 10, penaltyPoints: 3 },
  { value: 11, penaltyPoints: 5 },
  { value: 12, penaltyPoints: 1 },
  { value: 13, penaltyPoints: 1 },
  { value: 14, penaltyPoints: 1 },
  { value: 15, penaltyPoints: 2 },
  { value: 16, penaltyPoints: 1 },
  { value: 17, penaltyPoints: 1 },
  { value: 18, penaltyPoints: 1 },
  { value: 19, penaltyPoints: 1 },
  { value: 20, penaltyPoints: 3 },
  { value: 21, penaltyPoints: 1 },
  { value: 22, penaltyPoints: 5 },
  { value: 23, penaltyPoints: 1 },
  { value: 24, penaltyPoints: 1 },
  { value: 25, penaltyPoints: 2 },
  { value: 26, penaltyPoints: 1 },
  { value: 27, penaltyPoints: 1 },
  { value: 28, penaltyPoints: 1 },
  { value: 29, penaltyPoints: 1 },
  { value: 30, penaltyPoints: 3 },
  { value: 31, penaltyPoints: 1 },
  { value: 32, penaltyPoints: 1 },
  { value: 33, penaltyPoints: 5 },
  { value: 34, penaltyPoints: 1 },
  { value: 35, penaltyPoints: 2 },
  { value: 36, penaltyPoints: 1 },
  { value: 37, penaltyPoints: 1 },
  { value: 38, penaltyPoints: 1 },
  { value: 39, penaltyPoints: 1 },
  { value: 40, penaltyPoints: 3 },
  { value: 41, penaltyPoints: 1 },
  { value: 42, penaltyPoints: 1 },
  { value: 43, penaltyPoints: 1 },
  { value: 44, penaltyPoints: 5 },
  { value: 45, penaltyPoints: 2 },
  { value: 46, penaltyPoints: 1 },
  { value: 47, penaltyPoints: 1 },
  { value: 48, penaltyPoints: 1 },
  { value: 49, penaltyPoints: 1 },
  { value: 50, penaltyPoints: 3 },
  { value: 51, penaltyPoints: 1 },
  { value: 52, penaltyPoints: 1 },
  { value: 53, penaltyPoints: 1 },
  { value: 54, penaltyPoints: 1 },
  { value: 55, penaltyPoints: 7 },
  { value: 56, penaltyPoints: 1 },
  { value: 57, penaltyPoints: 1 },
  { value: 58, penaltyPoints: 1 },
  { value: 59, penaltyPoints: 1 },
  { value: 60, penaltyPoints: 3 },
  { value: 61, penaltyPoints: 1 },
  { value: 62, penaltyPoints: 1 },
  { value: 63, penaltyPoints: 1 },
  { value: 64, penaltyPoints: 1 },
  { value: 65, penaltyPoints: 2 },
  { value: 66, penaltyPoints: 5 },
  { value: 67, penaltyPoints: 1 },
  { value: 68, penaltyPoints: 1 },
  { value: 69, penaltyPoints: 1 },
  { value: 70, penaltyPoints: 3 },
  { value: 71, penaltyPoints: 1 },
  { value: 72, penaltyPoints: 1 },
  { value: 73, penaltyPoints: 1 },
  { value: 74, penaltyPoints: 1 },
  { value: 75, penaltyPoints: 2 },
  { value: 76, penaltyPoints: 1 },
  { value: 77, penaltyPoints: 5 },
  { value: 78, penaltyPoints: 1 },
  { value: 79, penaltyPoints: 1 },
  { value: 80, penaltyPoints: 3 },
  { value: 81, penaltyPoints: 1 },
  { value: 82, penaltyPoints: 1 },
  { value: 83, penaltyPoints: 1 },
  { value: 84, penaltyPoints: 1 },
  { value: 85, penaltyPoints: 2 },
  { value: 86, penaltyPoints: 1 },
  { value: 87, penaltyPoints: 1 },
  { value: 88, penaltyPoints: 5 },
  { value: 89, penaltyPoints: 1 },
  { value: 90, penaltyPoints: 3 },
  { value: 91, penaltyPoints: 1 },
  { value: 92, penaltyPoints: 1 },
  { value: 93, penaltyPoints: 1 },
  { value: 94, penaltyPoints: 1 },
  { value: 95, penaltyPoints: 2 },
  { value: 96, penaltyPoints: 1 },
  { value: 97, penaltyPoints: 1 },
  { value: 98, penaltyPoints: 1 },
  { value: 99, penaltyPoints: 5 },
  { value: 100, penaltyPoints: 3 },
  { value: 101, penaltyPoints: 1 },
  { value: 102, penaltyPoints: 1 },
  { value: 103, penaltyPoints: 1 },
  { value: 104, penaltyPoints: 1 },
]

export default DEFAULT_CARDS_SET

export const DEFAULT_CARDS_SET_VALUE_TO_PENALTY_POINTS_MAP: ReadonlyMap<number, number> =
  createValueToPenaltyPointsMapFromCardsSet(DEFAULT_CARDS_SET)

export const DEFAULT_CARDS_SET_VALUE_TO_CARD_MAP: ReadonlyMap<number, Card> =
  createValueToCardMapFromCardsSet(DEFAULT_CARDS_SET)
