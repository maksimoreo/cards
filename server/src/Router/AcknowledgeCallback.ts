import { ResponseCodeBadRequest, ResponseCodeServerError, ResponseCodeSuccess } from 'common/src/TypedClientSocket/emit'
import { z } from 'zod'

export type ResponseCode = ResponseCodeSuccess | ResponseCodeBadRequest | ResponseCodeServerError

type SerializedResponse<DataT> =
  | {
      readonly code: ResponseCodeSuccess
      readonly data: DataT | undefined
    }
  | {
      readonly code: ResponseCodeBadRequest
      readonly message: string
      readonly validationErrors: readonly z.ZodIssue[]
    }
  | {
      readonly code: ResponseCodeServerError
    }

// A callback that can be called only once
export class AcknowledgeCallback<DataT> {
  private callCount: number

  constructor(private readonly callback: unknown) {
    this.callCount = 0
  }

  public call(data: SerializedResponse<DataT>): void {
    if (this.callCount >= 1) {
      throw Error('Acknowledge callback has been already called. Did you call it second time?')
    }

    this.callCount += 1

    if (typeof this.callback === 'function') {
      this.callback(data)
    }
  }

  public get wasCalled(): boolean {
    return this.callCount >= 1
  }
}
