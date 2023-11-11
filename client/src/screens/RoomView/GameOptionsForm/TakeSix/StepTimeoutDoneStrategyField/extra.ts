export const STEP_TIMEOUT_DONE_STRATEGY_VALUES = ['forcePlay', 'moveToSpectators', 'kick'] as const
export const DEFAULT_STEP_TIMEOUT_DONE_STRATEGY_VALUE = STEP_TIMEOUT_DONE_STRATEGY_VALUES[0]
export type StepTimeoutDoneStrategyValue = (typeof STEP_TIMEOUT_DONE_STRATEGY_VALUES)[number]
export function isValueStepTimeoutDoneStrategy(value: string): value is StepTimeoutDoneStrategyValue {
  return (STEP_TIMEOUT_DONE_STRATEGY_VALUES as readonly string[]).indexOf(value) !== -1
}
