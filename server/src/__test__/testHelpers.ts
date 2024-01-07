import App from '../App'
import { AcknowledgeCallback } from '../Router/AcknowledgeCallback'
import { EventHandlerConstructor } from '../Router/EventHandler'
import User from '../models/User'
import { instantly } from '../utils'
import { createAppFake, createSocketFake } from './mocks/mocks'

export interface callEventHandlerOptions {
  app?: App
  currentUser?: User
  input?: unknown
}

/**
 * Creates instance of given EventHandler class with given parameters and calls it.
 * Usage:
 * ```ts
 * // with app, currentUser defined
 * const result = await callEventHandler(SendMessageHandler, { app, currentUser, input })
 * ```
 * @param handlerConstructor Class, that extends EventHandler and implements '#call'.
 * @param handlerOptions Options to pass to handler constructor. If `app` or `currentUser` are not specified, will
 * create fake instances on each call.
 * @returns Promise with result of calling instantiated handler.
 */
export async function callEventHandler<HandlerReturnType>(
  handlerConstructor: EventHandlerConstructor<HandlerReturnType>,
  handlerOptions: callEventHandlerOptions = {},
): Promise<HandlerReturnType> {
  const app = handlerOptions.app ?? createAppFake()
  const currentUser = handlerOptions.currentUser ?? new User({ socket: createSocketFake(), name: 'user' })

  const response: { current: HandlerReturnType | undefined } = { current: undefined }
  const acknowledgeCallback = new AcknowledgeCallback((data: HandlerReturnType) => {
    response.current = data
  })
  const instance = new handlerConstructor({
    app,
    socket: currentUser.socket,
    input: handlerOptions.input,
    currentUser,
    acknowledgeCallback,
  })

  await instance.call()

  if (response.current === undefined) {
    throw Error('Event handler did not call .respond()')
  }

  return instantly(response.current)
}

/**
 * Creates EventHandler caller function. Usage:
 * ```ts
 * // with app, currentUser defined
 * const call = createEventHandlerCaller(SendMessageHandler)
 * await call({ app, currentUser, input })
 * ```
 * @param callerClass Class, that extends EventHandler and implements `#call`
 * @returns Caller function with binded EventHandler
 */
export function createEventHandlerCaller<HandlerReturnType, T extends EventHandlerConstructor<HandlerReturnType>>(
  callerClass: T,
): (opts?: callEventHandlerOptions) => Promise<HandlerReturnType | undefined> {
  return (opts?: callEventHandlerOptions) => callEventHandler(callerClass, opts)
}
