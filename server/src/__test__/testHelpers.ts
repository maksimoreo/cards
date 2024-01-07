import App from '../App'
import { AcknowledgeCallback } from '../Router/AcknowledgeCallback'
import { EventHandlerConstructor } from '../Router/EventHandler'
import User from '../models/User'
import { instantly } from '../utils'
import { createAppFake, createSocketFake } from './mocks/mocks'

export interface callMessageHandlerOptions {
  app?: App
  currentUser?: User
  input?: unknown
}

/**
 * Creates instance of given MessageHandler class with given parameters and calls it.
 * Usage:
 * ```ts
 * // with app, currentUser defined
 * const result = await callMessageHandler(SendMessageHandler, { app, currentUser, input })
 * ```
 * @param handlerConstructor Class, that extends MessageHandler and implements '#call'.
 * @param handlerOptions Options to pass to handler constructor. If `app` or `currentUser` are not specified, will
 * create fake instances on each call.
 * @returns Promise with result of calling instantiated handler.
 */
export async function callMessageHandler<HandlerReturnType>(
  handlerConstructor: EventHandlerConstructor<HandlerReturnType>,
  handlerOptions: callMessageHandlerOptions = {},
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
    throw Error('Message handler did not call .respond()')
  }

  return instantly(response.current)
}

/**
 * Creates MessageHandler caller function. Usage:
 * ```ts
 * // with app, currentUser defined
 * const call = createMessageHandlerCaller(SendMessageHandler)
 * await call({ app, currentUser, input })
 * ```
 * @param callerClass Class, that extends MessageHandler and implements `#call`
 * @returns Caller function with binded MessageHandler
 */
export function createMessageHandlerCaller<HandlerReturnType, T extends EventHandlerConstructor<HandlerReturnType>>(
  callerClass: T,
): (opts?: callMessageHandlerOptions) => Promise<HandlerReturnType | undefined> {
  return (opts?: callMessageHandlerOptions) => callMessageHandler(callerClass, opts)
}
