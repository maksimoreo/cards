import { useSelector } from 'react-redux'
import { RootState } from '../../../../app/store'
import { DEFAULT_STEP_TIMEOUT_NUMBER } from '../../GameOptionsForm/TakeSix/StepTimeoutField/extra'

export default function StepTimeoutIndicator() {
  const duration = useSelector((state: RootState) => state.room?.gameOptions.stepTimeout || DEFAULT_STEP_TIMEOUT_NUMBER)

  return (
    <div
      className='owl-takesix-timeout-indicator absolute left-0 right-0 top-0 z-30 h-[4px] bg-red-500'
      style={{ animationDuration: `${duration}ms` }}
    ></div>
  )
}
