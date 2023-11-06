import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { ClientGameState } from '../../screens/RoomView/TakeSix/types'

// TODO: Currently this state represents only initial game state, when user joined room, but in realisticly it should be in sync with the game (or actually the only source of truth)

export type GameState = ({ type: 'takesix' } & ClientGameState) | null

export const gameSlice = createSlice({
  name: 'game',
  initialState: null as GameState,
  reducers: {
    setGame: (_state, action: PayloadAction<GameState>) => action.payload,
  },
})

export const { setGame } = gameSlice.actions

export default gameSlice.reducer
