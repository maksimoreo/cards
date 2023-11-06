import { createSelector } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux'
import { RootState } from '../../app/store'

const selectRoom = (state: RootState) => state.room

export const useRoom = () => useSelector(selectRoom)

export function selectRequired<T>(state: T) {
  if (!state) {
    throw new Error('Provided value is null or undefined')
  }

  return state
}

export const selectRequiredRoom = createSelector(selectRoom, selectRequired)
export const useRequiredRoom = () => useSelector(selectRequiredRoom)

export const selectRequiredAllRoomUsers = createSelector(selectRoom, (state) => {
  if (!state) {
    throw new Error('Provided value is null or undefined')
  }

  return state.users.concat(state.owner)
})
export const useRequiredAllRoomUsers = () => useSelector(selectRequiredAllRoomUsers)
