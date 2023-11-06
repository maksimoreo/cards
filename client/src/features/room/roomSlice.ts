import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { Room, User } from '../../commonTypes'

export type RoomState = Room | null

const initialState = null as RoomState

function ifNotNull<StateT, ActionT>(callback: (state: NonNullable<StateT>, action: ActionT) => void) {
  return (state: StateT, action: ActionT) => {
    if (!state) {
      throw new Error('State is null')
    }

    callback(state, action)
  }
}

export const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setRoom: (_state, action: PayloadAction<RoomState>) => action.payload,

    addUser: ifNotNull((state, action: PayloadAction<User>) => {
      state.users.push(action.payload)
    }),

    removeUser: ifNotNull((state, action: PayloadAction<string>) => {
      const index = state.users.findIndex((member) => member.id === action.payload)
      if (index !== -1) state.users.splice(index, 1)
    }),
  },
})

export const { setRoom } = roomSlice.actions

export default roomSlice.reducer
