export const STEP_TIMEOUT_VALUES = ['fifteen', 'thirty', 'sixty'] as const
export const DEFAULT_STEP_TIMEOUT_VALUE = 'thirty'
export type StepTimeoutValue = (typeof STEP_TIMEOUT_VALUES)[number]
export function isValueStepTimeout(value: string): value is StepTimeoutValue {
  return (STEP_TIMEOUT_VALUES as readonly string[]).indexOf(value) !== -1
}

export const STEP_TIMEOUT_NUMBER_TO_STEP_TIMEOUT_VALUE_MAP = {
  15: 'fifteen',
  30: 'thirty',
  60: 'sixty',
} as Record<number, StepTimeoutValue>

export const STEP_TIMEOUT_VALUE_TO_STEP_TIMEOUT_NUMBER_MAP = {
  fifteen: 15,
  thirty: 30,
  sixty: 60,
}
