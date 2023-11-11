export const GAME_MODE_VALUES = ['normal', 'expert'] as const
export const DEFAULT_GAME_MODE_VALUE = 'normal'
export type GameModeValue = (typeof GAME_MODE_VALUES)[number]
export function isValueGameMode(value: string): value is GameModeValue {
  return (GAME_MODE_VALUES as readonly string[]).indexOf(value) !== -1
}
