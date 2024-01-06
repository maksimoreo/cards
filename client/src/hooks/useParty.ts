import { useDispatch } from 'react-redux'
import { party } from '../features/party/partySlice'

export default function useParty() {
  const dispatch = useDispatch()

  return {
    party: () => {
      dispatch(party())
    },
  }
}
