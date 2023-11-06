import classNames from 'classnames'

export interface TextInputProps extends React.ComponentPropsWithoutRef<'input'> {
  readonly error?: string | undefined
}

export default function TextInput(props: TextInputProps) {
  const { error, ...rest } = props

  return (
    <div>
      <input
        type='text'
        {...rest}
        className={classNames(
          'rounded border border-neutral-800 bg-transparent px-3 py-2 text-neutral-300',
          props.className,
        )}
      />

      {/* Keep at least one line of error text, to prevent jumping UI when error is set */}
      <p className='mt-1 min-h-[1.25rem] whitespace-pre-line text-sm text-red-500'>{error}</p>
    </div>
  )
}
