import classNames from 'classnames'

interface Props {
  readonly id: string
  readonly name: string
  readonly selectedValue: string
  readonly title: JSX.Element | string
  readonly subtitle?: JSX.Element | string | undefined | null

  readonly value: string
  readonly onChange: (newValue: string) => void

  readonly labelClasses?: string | undefined | null
  readonly labelSelectedClasses?: string | undefined | null
  readonly labelNotSelectedClasses?: string | undefined | null

  readonly titleSelectedClasses?: string | undefined | null
}

export default function FieldsetOption({
  id,
  name,
  selectedValue,
  value,
  title,
  subtitle,
  labelClasses,
  labelSelectedClasses,
  labelNotSelectedClasses,
  titleSelectedClasses,
  onChange,
}: Props) {
  const isSelected = selectedValue === value

  return (
    <label
      htmlFor={id}
      className={classNames(
        'flex flex-col justify-center rounded-lg p-2 outline',
        labelClasses,
        isSelected ? 'outline-2' : 'outline-1',
        isSelected ? labelSelectedClasses : labelNotSelectedClasses,
      )}
    >
      <p className={classNames('text-center text-xl font-bold text-neutral-300', isSelected && titleSelectedClasses)}>
        <input
          type='radio'
          name={name}
          id={id}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          checked={isSelected}
        />
        {title}
      </p>

      {subtitle && <p className='text-center text-sm italic text-neutral-400'>{subtitle}</p>}
    </label>
  )
}
