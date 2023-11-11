import { faBolt, faDice, faMugHot } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import FieldsetOption from '../../FieldsetOption'
import { DEFAULT_STEP_TIMEOUT_VALUE, StepTimeoutValue, isValueStepTimeout } from './extra'

interface StepTimeoutFieldOptionProps {
  readonly id: string
  readonly title: JSX.Element
  readonly onChange: (newValue: StepTimeoutValue) => void
  readonly value: StepTimeoutValue
  readonly selectedValue: StepTimeoutValue

  readonly labelSelectedClasses: string
  readonly titleSelectedClasses: string
}

const StepTimeoutFieldFieldsetOption = ({
  id,
  value,
  selectedValue,
  onChange,
  title,
  labelSelectedClasses,
  titleSelectedClasses,
}: StepTimeoutFieldOptionProps) => (
  <FieldsetOption
    id={id}
    name='stepTimeout'
    title={title}
    value={value}
    selectedValue={selectedValue}
    onChange={(newValue) => onChange(isValueStepTimeout(newValue) ? newValue : DEFAULT_STEP_TIMEOUT_VALUE)}
    labelClasses={'px-4 py-3'}
    labelSelectedClasses={labelSelectedClasses}
    labelNotSelectedClasses={'outline-neutral-500'}
    titleSelectedClasses={titleSelectedClasses}
  />
)

interface Props {
  readonly value: StepTimeoutValue
  readonly onChange: (newValue: StepTimeoutValue) => void
  readonly disabled: boolean
}

export default function StepTimeoutField({ value, onChange, disabled }: Props) {
  return (
    <fieldset className='mt-6' disabled={disabled}>
      <legend className='mb-4 text-center text-neutral-400'>Step Timeout:</legend>

      <div className='flex flex-row flex-wrap justify-center gap-4'>
        <StepTimeoutFieldFieldsetOption
          id='game-options-take-six-step-timeout-fifteen'
          value='fifteen'
          onChange={onChange}
          selectedValue={value}
          title={
            <>
              {' '}
              <FontAwesomeIcon icon={faBolt} className='ml-1 mr-2' /> 15 sec
            </>
          }
          labelSelectedClasses='outline-red-500'
          titleSelectedClasses='text-red-500'
        />

        <StepTimeoutFieldFieldsetOption
          id='game-options-take-six-step-timeout-thirty'
          value='thirty'
          onChange={onChange}
          selectedValue={value}
          title={
            <>
              {' '}
              <FontAwesomeIcon icon={faDice} className='ml-1 mr-2' /> 30 sec
            </>
          }
          labelSelectedClasses='outline-yellow-500'
          titleSelectedClasses='text-yellow-500'
        />

        <StepTimeoutFieldFieldsetOption
          id='game-options-take-six-step-timeout-sixty'
          value='sixty'
          onChange={onChange}
          selectedValue={value}
          title={
            <>
              {' '}
              <FontAwesomeIcon icon={faMugHot} className='ml-1 mr-2' /> 60 sec
            </>
          }
          labelSelectedClasses='outline-green-500'
          titleSelectedClasses='text-green-500'
        />
      </div>
    </fieldset>
  )
}
