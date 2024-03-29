import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { uniqueId } from 'lodash'
import { ChatMessage, LocalUserMessageDeliveryStatus } from '../../components/Chat/ChatMessage'
import { DistributiveOmit } from '../../utils'

const MAX_MESSAGES_COUNT = 100

export interface ChatState {
  readonly messages: readonly ChatMessage[]
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [] as readonly ChatMessage[],
  },
  reducers: {
    addMessage: (
      state,
      action: PayloadAction<ChatMessage | DistributiveOmit<DistributiveOmit<ChatMessage, 'id'>, 'timestamp'>>,
    ) => {
      const { payload } = action
      const id = 'id' in payload ? payload.id : uniqueId()
      const timestamp = 'timestamp' in payload ? payload.timestamp : Date.now()
      const newMessage = {
        ...action.payload,
        id,
        timestamp,
      }

      if (state.messages.length >= MAX_MESSAGES_COUNT) {
        state.messages = state.messages.slice(1).concat(newMessage)
      } else {
        state.messages.push(newMessage)
      }
    },

    updateDeliveryStatus: (
      state,
      action: PayloadAction<{ id: string; deliveryStatus: LocalUserMessageDeliveryStatus }>,
    ) => {
      const message = state.messages.find((message) => message.id === action.payload.id)

      if (!message) {
        throw new Error(`Could not find message with id: ${action.payload.id}`)
      }

      if (message.type !== 'localUserMessage') {
        throw new Error(`Message#${message.id} is not of type localUserMessage`)
      }

      message.data.deliveryStatus = action.payload.deliveryStatus
    },
  },
})

export const { addMessage, updateDeliveryStatus } = chatSlice.actions

export default chatSlice.reducer
