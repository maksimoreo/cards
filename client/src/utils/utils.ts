// A place for homeless functions ;-;

export function assertUnreachable(value: never): never {
  throw `Unhandled value: ${value}`
}

export async function sleep(duration: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, duration)
  })
}

export async function instantlyResolve(): Promise<void> {
  return new Promise((resolve) => resolve())
}

export function findOrThrow<T>(
  list: readonly T[],
  callback: (item: T) => boolean,
  failMessage = 'Could not find item in list',
): T {
  const item = list.find(callback)

  if (!item) {
    throw Error(failMessage)
  }

  return item
}

interface Identifiable<IdT = string> {
  id: IdT
}

export function findByIdOrThrow<T extends Identifiable<IdT>, IdT = string>(list: readonly T[], id: IdT): T {
  return findOrThrow(list, (item) => item.id === id, `Could not find item with id=${id}`)
}

export function tryFindById<T extends Identifiable<IdT>, IdT = string>(
  list: readonly T[],
  id: IdT,
  onFind: (item: T) => void,
): void {
  const item = list.find((item) => item.id === id)

  item && onFind(item)
}

export type RefSetter<HtmlElementT> = (element: HtmlElementT) => void
