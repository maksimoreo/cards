import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'

export type ButtonProps = React.PropsWithChildren<React.ComponentPropsWithoutRef<'button'>> & {
  readonly iconProps?: FontAwesomeIconProps | undefined
  readonly color?: 'default' | 'success' | 'error' | undefined
}

export default function Button({ children, color, iconProps, ...rest }: ButtonProps) {
  const colorClasses = rest.disabled
    ? 'text-neutral-400'
    : color === 'success'
    ? 'text-green-400 hover:text-green-300'
    : color === 'error'
    ? 'text-red-400 hover:text-red-300'
    : 'text-neutral-400 hover:text-neutral-300'

  return (
    <button {...rest} className={classNames('p-3 transition-colors', colorClasses, rest.className)}>
      {iconProps && (
        <FontAwesomeIcon
          // size='lg'
          {...iconProps}
          className={classNames('inline-block', children && 'mr-3', iconProps.className)}
        />
      )}
      {children}
    </button>
  )
}
