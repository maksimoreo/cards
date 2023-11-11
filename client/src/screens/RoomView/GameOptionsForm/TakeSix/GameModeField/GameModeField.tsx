import { faMugHot } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import FieldsetOption from '../../FieldsetOption'
import { DEFAULT_GAME_MODE_VALUE, GameModeValue, isValueGameMode } from './extra'

interface GameModeFieldOptionProps {
  readonly id: string
  readonly title: JSX.Element
  readonly subtitle: JSX.Element
  readonly onChange: (newValue: GameModeValue) => void
  readonly value: GameModeValue
  readonly selectedValue: GameModeValue

  readonly labelSelectedClasses: string
  readonly titleSelectedClasses: string
}

const GameModeFieldFieldsetOption = ({
  id,
  value,
  selectedValue,
  onChange,
  title,
  subtitle,
  labelSelectedClasses,
  titleSelectedClasses,
}: GameModeFieldOptionProps) => (
  <FieldsetOption
    id={id}
    name='GameMode'
    title={title}
    subtitle={subtitle}
    value={value}
    selectedValue={selectedValue}
    onChange={(newValue) => onChange(isValueGameMode(newValue) ? newValue : DEFAULT_GAME_MODE_VALUE)}
    labelClasses={'p-2 w-36 min-h-[8em]'}
    labelSelectedClasses={labelSelectedClasses}
    labelNotSelectedClasses={'outline-neutral-500'}
    titleSelectedClasses={titleSelectedClasses}
  />
)

interface Props {
  readonly value: GameModeValue
  readonly onChange: (newValue: GameModeValue) => void
  readonly cardsCount: number
  readonly disabled: boolean
}

export default function GameModeField({ value, onChange, disabled, cardsCount }: Props) {
  return (
    <fieldset disabled={disabled}>
      <legend className='mb-4 mt-8 text-center text-neutral-400'>Game mode:</legend>

      <div className='flex flex-row flex-wrap justify-center gap-4'>
        <GameModeFieldFieldsetOption
          id='game-options-take-six-game-mode-normal'
          value='normal'
          onChange={onChange}
          selectedValue={value}
          title={
            <>
              {' '}
              <FontAwesomeIcon icon={faMugHot} className='ml-1 mr-2' /> Normal
            </>
          }
          subtitle={<>{cardsCount} random cards from 1 to 104</>}
          labelSelectedClasses='outline-green-500'
          titleSelectedClasses='text-green-500'
        />

        <GameModeFieldFieldsetOption
          id='game-options-take-six-game-mode-expert'
          value='expert'
          onChange={onChange}
          selectedValue={value}
          title={
            <>
              {' '}
              <FontAwesomeIcon icon={faMugHot} className='ml-1 mr-2' /> Expert
            </>
          }
          subtitle={
            <>
              {cardsCount} shuffled cards
              <br />
              from 1 to {cardsCount}
            </>
          }
          labelSelectedClasses='outline-red-500'
          titleSelectedClasses='text-red-500'
        />
      </div>
    </fieldset>
  )
}
