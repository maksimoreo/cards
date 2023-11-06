import { PayloadAction, createSlice } from '@reduxjs/toolkit'

export type ScreenState = 'login' | 'rooms' | 'room' | 'createRoom'

const initialState = 'login' as ScreenState

export const screenSlice = createSlice({
  name: 'screen',
  initialState,
  reducers: {
    setScreen: (_state, action: PayloadAction<ScreenState>) => action.payload,
  },
})

export const { setScreen } = screenSlice.actions

export default screenSlice.reducer
