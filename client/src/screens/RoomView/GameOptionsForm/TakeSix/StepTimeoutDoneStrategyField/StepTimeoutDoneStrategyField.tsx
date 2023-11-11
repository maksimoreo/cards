import { faBolt, faEye, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import FieldsetOption from '../../FieldsetOption'
import {
  DEFAULT_STEP_TIMEOUT_DONE_STRATEGY_VALUE,
  StepTimeoutDoneStrategyValue,
  isValueStepTimeoutDoneStrategy,
} from './extra'

interface StepTimeoutDoneStrategyFieldOptionProps {
  readonly id: string
  readonly title: JSX.Element
  readonly onChange: (newValue: StepTimeoutDoneStrategyValue) => void
  readonly value: StepTimeoutDoneStrategyValue
  readonly selectedValue: StepTimeoutDoneStrategyValue

  readonly labelSelectedClasses: string
  readonly titleSelectedClasses: string
}

const StepTimeoutDoneStrategyFieldFieldsetOption = ({
  id,
  value,
  selectedValue,
  onChange,
  title,
  labelSelectedClasses,
  titleSelectedClasses,
}: StepTimeoutDoneStrategyFieldOptionProps) => (
  <FieldsetOption
    id={id}
    name='stepTimeoutDoneStrategy'
    title={title}
    value={value}
    selectedValue={selectedValue}
    onChange={(newValue) =>
      onChange(isValueStepTimeoutDoneStrategy(newValue) ? newValue : DEFAULT_STEP_TIMEOUT_DONE_STRATEGY_VALUE)
    }
    labelClasses={'px-4 py-3'}
    labelSelectedClasses={labelSelectedClasses}
    labelNotSelectedClasses={'outline-neutral-500'}
    titleSelectedClasses={titleSelectedClasses}
  />
)

interface Props {
  readonly value: StepTimeoutDoneStrategyValue
  readonly onChange: (newValue: StepTimeoutDoneStrategyValue) => void
  readonly disabled: boolean
}

export default function StepTimeoutDoneStrategyField({ value, onChange, disabled }: Props) {
  return (
    <fieldset className='mt-6' disabled={disabled}>
      <legend className='mb-4 mt-8 text-center text-neutral-400'>Action for inactive players:</legend>

      <div className='flex flex-row flex-wrap justify-center gap-4'>
        <StepTimeoutDoneStrategyFieldFieldsetOption
          id='game-options-take-six-step-timeout-done-strategy-force-play'
          value='forcePlay'
          onChange={onChange}
          selectedValue={value}
          title={
            <>
              {' '}
              <FontAwesomeIcon icon={faBolt} className='ml-1 mr-2' /> Force play
            </>
          }
          labelSelectedClasses='outline-yellow-500'
          titleSelectedClasses='text-yellow-500'
        />

        <StepTimeoutDoneStrategyFieldFieldsetOption
          id='game-options-take-six-step-timeout-done-strategy-move-to-spectators'
          value='moveToSpectators'
          onChange={onChange}
          selectedValue={value}
          title={
            <>
              {' '}
              <FontAwesomeIcon icon={faEye} className='ml-1 mr-2' /> Move to spectators
            </>
          }
          labelSelectedClasses='outline-yellow-500'
          titleSelectedClasses='text-yellow-500'
        />

        <StepTimeoutDoneStrategyFieldFieldsetOption
          id='game-options-take-six-step-timeout-done-strategy-kick'
          value='kick'
          onChange={onChange}
          selectedValue={value}
          title={
            <>
              {' '}
              <FontAwesomeIcon icon={faRightFromBracket} className='ml-1 mr-2' /> Kick
            </>
          }
          labelSelectedClasses='outline-red-500'
          titleSelectedClasses='text-red-500'
        />
      </div>
    </fieldset>
  )
}
