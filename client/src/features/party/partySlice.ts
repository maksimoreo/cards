import { createSlice } from '@reduxjs/toolkit'

export type PartyState = { enabled: boolean; trigger: boolean }

const initialState = { enabled: false, trigger: false }

export const partySlice = createSlice({
  name: 'party',
  initialState,
  reducers: {
    party: (state) => ({ enabled: true, trigger: !state.trigger }),
  },
})

export const { party } = partySlice.actions

export default partySlice.reducer
