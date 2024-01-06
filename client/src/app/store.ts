import { configureStore } from '@reduxjs/toolkit'
import chatReducer from '../features/chat/chatSlice'
import currentUserReducer from '../features/currentUser/currentUserSlice'
import gameReducer from '../features/game/gameSlice'
import partyReducer from '../features/party/partySlice'
import roomReducer from '../features/room/roomSlice'
import screenReducer from '../features/screen/screenSlice'

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    currentUser: currentUserReducer,
    game: gameReducer,
    party: partyReducer,
    room: roomReducer,
    screen: screenReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
