import _ from 'lodash'
import { adjectives, animals, uniqueNamesGenerator } from 'unique-names-generator'

export const COLORS = [
  '#ffffff',
  '#e3342f',
  '#f6993f',
  '#ffed4a',
  '#38c172',
  '#4dc0b5',
  '#3490dc',
  '#6574cd',
  '#9561e2',
  '#f66d9b',
]

export const DEFAULT_COLOR = COLORS[0]

export function generateRandomName(): string {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    style: 'capital',
    separator: '',
  })
}

export function generateRandomColor(): string {
  return _.sample(COLORS) || COLORS[0]
}
