import { ResponseCodeBadRequest } from 'common/src/TypedClientSocket/send'
import { isEqual } from 'lodash'

export { assertUnreachable } from './utils'

export function requireState<T>(state: T | null) {
  if (!state) {
    throw new Error('State is null')
  }
}

// https://stackoverflow.com/a/57103940
export type DistributiveOmit<T, K extends keyof T> = T extends T ? Omit<T, K> : never

export function assignResponseValidationMessagesToForm(
  response: {
    code: ResponseCodeBadRequest
    message: string
    validationErrors: { path: (string | number)[]; message: string }[]
  },
  {
    fields,
    global: globalErrorMessageSetter,
  }: { fields?: Record<string, (errorMessage: string) => void>; global?: (errorMessage: string) => void },
): void {
  if (fields) {
    for (const field in fields) {
      if (Object.prototype.hasOwnProperty.call(fields, field)) {
        const errorMessageSetter = fields[field]

        const errors = response.validationErrors
          .filter((validationError) => isEqual(validationError.path, [field]))
          .map((validationError) => validationError.message)
          .join('\n')

        if (errors) {
          errorMessageSetter(errors)
        } else {
          errorMessageSetter('')
        }
      }
    }
  }

  if (typeof globalErrorMessageSetter === 'function') {
    if (response.validationErrors.length >= 1) {
      globalErrorMessageSetter('')
    } else {
      globalErrorMessageSetter(response.message)
    }
  }
}
