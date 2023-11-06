import { PropsWithChildren } from 'react'

export default function BasicMessageLine({ children }: PropsWithChildren): JSX.Element {
  return (
    <div className='border-b border-y-neutral-700 pb-1 pt-2 hover:bg-white/5'>
      <p className='text-center text-neutral-400'>{children}</p>
    </div>
  )
}
