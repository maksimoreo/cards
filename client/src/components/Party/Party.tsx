import { useEffect, useState } from 'react'
import ReactConfetti from 'react-confetti'
import { useSelector } from 'react-redux'
import { useWindowSize } from 'react-use'
import { RootState } from '../../app/store'

const duration = 3000

export default function Confetti() {
  const partyState = useSelector((state: RootState) => state.party)

  const { width, height } = useWindowSize()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!partyState.enabled) {
      return
    }

    setEnabled(true)

    const timer = setTimeout(() => {
      setEnabled(false)
    }, duration)

    return () => {
      clearTimeout(timer)
    }
  }, [partyState])

  return (
    <ReactConfetti
      style={{ zIndex: 999 }}
      width={width}
      height={height}
      recycle={true}
      numberOfPieces={enabled ? 300 : 0}
    />
  )
}
