import { PayloadAction, createSlice } from '@reduxjs/toolkit'

export interface CurrentUserState {
  readonly name: string
  readonly color: string
}

export const currentUserSlice = createSlice({
  name: 'currentUser',
  initialState: {
    name: '',
    color: '',
  },
  reducers: {
    setIdentity: (state, action: PayloadAction<{ name?: string; color?: string }>) => {
      if (action.payload.name) {
        state.name = action.payload.name
      }

      if (action.payload.color) {
        state.color = action.payload.color
      }
    },

    setName: (state, action: PayloadAction<string>) => {
      state.name = action.payload
    },

    setColor: (state, action: PayloadAction<string>) => {
      state.color = action.payload
    },
  },
})

export const { setIdentity, setName, setColor } = currentUserSlice.actions

export default currentUserSlice.reducer
