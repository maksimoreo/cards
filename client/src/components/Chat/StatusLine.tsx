import classNames from 'classnames'

interface Props {
  readonly connected: boolean
}

export function StatusLine({ connected }: Props): JSX.Element {
  return (
    <div
      className={classNames(
        'z-10 bg-red-700 px-3 transition-[height] duration-300 ease-in-out',
        connected ? 'h-0' : 'h-8',
      )}
    >
      <div className='py-1'>Disconnected</div>
    </div>
  )
}
