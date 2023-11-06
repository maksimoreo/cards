import { z } from 'zod'

import {
  RESPONSE_CODE_BAD_REQUEST,
  RESPONSE_CODE_SERVER_ERROR,
  RESPONSE_CODE_SUCCESS,
} from 'common/src/TypedClientSocket/send'
import App from '../App'
import { SocketT } from '../ISocketData'
import User from '../models/User'
import { AcknowledgeCallback } from '../Router/AcknowledgeCallback'

export interface MessageHandlerConstructorOptions<ResponseData> {
  readonly app: App
  readonly socket: SocketT
  readonly input: unknown
  readonly currentUser: User
  readonly acknowledgeCallback: AcknowledgeCallback<ResponseData>
}

export type MessageHandlerConstructor<ResponseData> = {
  new (options: MessageHandlerConstructorOptions<ResponseData>): MessageHandler<ResponseData>
}

type ZodIssues = readonly z.ZodIssue[]

export abstract class MessageHandler<ResponseData> {
  protected readonly app: App
  protected readonly socket: SocketT
  protected readonly input: unknown
  protected readonly currentUser: User
  private readonly acknowledgeCallback: AcknowledgeCallback<ResponseData>

  constructor({
    app,
    socket,
    input,
    currentUser,
    acknowledgeCallback,
  }: MessageHandlerConstructorOptions<ResponseData>) {
    this.app = app
    this.socket = socket
    this.input = input
    this.currentUser = currentUser
    this.acknowledgeCallback = acknowledgeCallback
  }

  public abstract call(): Promise<void>

  // protected respond(data: ResponseData): void {
  //   this.acknowledgeCallback.call(data)
  // }

  protected respondWithSuccess(data: ResponseData): void {
    this.acknowledgeCallback.call({ code: RESPONSE_CODE_SUCCESS, data })
  }

  protected respondWithValidationErrors(errors: ZodIssues): void {
    this.acknowledgeCallback.call({
      code: RESPONSE_CODE_BAD_REQUEST,
      message: 'Invalid data',
      validationErrors: errors,
    })
  }

  protected respondWithBadRequest(message: string): void {
    this.acknowledgeCallback.call({ code: RESPONSE_CODE_BAD_REQUEST, message, validationErrors: [] })
  }

  protected respondWithServerError(): void {
    this.acknowledgeCallback.call({ code: RESPONSE_CODE_SERVER_ERROR })
  }
}

export type MessageHandlerReturnValue<DataT> =
  | { data: DataT }
  | { badRequest: string }
  | { validationErrors: ZodIssues }

export abstract class ResponseReturningMessageHandler<ResponseData> extends MessageHandler<ResponseData> {
  public async call(): Promise<void> {
    const returnValue = await this.handle()

    if ('data' in returnValue) {
      this.respondWithSuccess(returnValue.data)
    } else if ('badRequest' in returnValue) {
      this.respondWithBadRequest(returnValue.badRequest)
    } else if ('validationErrors' in returnValue) {
      this.respondWithValidationErrors(returnValue.validationErrors)
    } else {
      this.respondWithServerError()
    }
  }

  protected abstract handle(): Promise<MessageHandlerReturnValue<ResponseData>>
}

export type VoidMessageHandlerReturnValue = undefined | void | { badRequest: string } | { validationErrors: ZodIssues }

export abstract class VoidMessageHandler extends MessageHandler<void> {
  public async call(): Promise<void> {
    const returnValue = await this.handle()

    if (!returnValue) {
      this.respondWithSuccess()
    } else if ('badRequest' in returnValue) {
      this.respondWithBadRequest(returnValue.badRequest)
    } else if ('validationErrors' in returnValue) {
      this.respondWithValidationErrors(returnValue.validationErrors)
    } else {
      this.respondWithServerError()
    }
  }

  protected abstract handle(): Promise<VoidMessageHandlerReturnValue>
}

export abstract class BasicMessageHandler<ResponseData> extends MessageHandler<ResponseData> {
  public async call(): Promise<void> {
    await this.handle()
  }

  protected abstract handle(): Promise<void>
}

export abstract class ConnectHandler {
  constructor(
    protected readonly app: App,
    protected readonly socket: SocketT,
  ) {}

  public abstract call(): Promise<void>
}

export type ConnectHandlerConstructor = {
  new (app: App, socket: SocketT): ConnectHandler
}
