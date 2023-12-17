import _ from 'lodash'

export function removeSingleByPropertyOrThrow<ValueT, K extends PropertyKey, T extends Record<K, ValueT>>(
  items: T[],
  property: K,
  value: ValueT,
): void {
  const itemIndex = items.findIndex((item) => item[property] === value)

  if (itemIndex === -1) {
    throw `Cannot find item by property ${String(property)} with value ${value} in array of ${items.length} items`
  }

  items.splice(itemIndex, 1)
}

export function findSingleByIdOrThrow<T extends { id: string }>(items: readonly T[], id: string): T {
  const item = items.find((item) => item.id === id)

  if (!item) {
    throw new Error(`Cannot find item by id: "${id}"`)
  }

  return item
}

export function removeSingleByIdOrThrow(items: { id: string }[], id: string): void {
  removeSingleByPropertyOrThrow(items, 'id', id)
}

// Don't forget to `await`!
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function instantly<T>(value: T): Promise<T> {
  return new Promise((resolve) => resolve(value))
}

export function withTimeout<ValueT, ErrorT>(
  timeout: number,
  callback: (resolve: (value: ValueT) => void, reject: (error: ErrorT) => void) => void,
  onTimeout: (() => void) | null = null,
): Promise<ValueT> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout && onTimeout()
      reject(new Error(`Promise timed out after ${timeout} ms`))
    }, timeout)

    callback(
      (value: ValueT) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: ErrorT) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

export function objectHasOwnProperty<X extends object, Y extends PropertyKey>(
  obj: X,
  prop: Y,
): obj is X & Record<Y, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

export function unkonwnHasOwnProperty<Y extends PropertyKey>(
  something: unknown,
  property: Y,
): something is Record<Y, unknown> {
  return typeof something === 'object' && !!something && objectHasOwnProperty(something, property)
}

export function isObject(object: unknown): object is object {
  return typeof object === 'object' && !Array.isArray(object) && object !== null
}

export function assertUnreachable(value: never): never {
  throw `Unhandled value: ${value}`
}

export type ValueOf<T> = T[keyof T]

export function decide(probability: number): boolean {
  return _.random(true) > probability
}

/**
 * Returns a formatted string which includes size of array and sample array elements (5 by default). Sort of matches
 * Chrome DevTools console style.
 *
 * Example:
 *
 * ```
 * toPrintableList([1, 2, 3, 4, 5, 6, 7])
 * // (7) [1, 2, 3, 4, 5, ...]
 * ```
 *
 * @param items Items to print
 * @param options Options
 * @returns Formatted printable list of items
 */
export function toPrintableList<T>(
  items: readonly T[],
  options?: { sampleItemsLimit?: number | null | undefined },
): string {
  const sampleItemsLimit = options?.sampleItemsLimit ?? 5
  const { length } = items
  const sampleItems = items
    .slice(0, sampleItemsLimit)
    .map((item) => `"${item}"`)
    .join(', ')
  const ellipsis = length > sampleItemsLimit ? ', ...' : ''

  return `(${length}) [${sampleItems}${ellipsis}]`
}
