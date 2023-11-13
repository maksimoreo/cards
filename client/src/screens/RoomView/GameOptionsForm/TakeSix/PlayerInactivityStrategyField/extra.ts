export const PLAYER_INACTIVITY_STRATEGY_VALUES = ['forcePlay', 'moveToSpectators', 'kick'] as const
export const DEFAULT_PLAYER_INACTIVITY_STRATEGY_VALUE = PLAYER_INACTIVITY_STRATEGY_VALUES[0]
export type PlayerInactivityStrategyValue = (typeof PLAYER_INACTIVITY_STRATEGY_VALUES)[number]
export function isValuePlayerInactivityStrategy(value: string): value is PlayerInactivityStrategyValue {
  return (PLAYER_INACTIVITY_STRATEGY_VALUES as readonly string[]).indexOf(value) !== -1
}
