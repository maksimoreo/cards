import { PropsWithChildren } from 'react'

export default function MainViewHeader(props: PropsWithChildren) {
  return (
    <>
      <div className='fixed left-0 right-0 top-0 mx-12 h-12 bg-neutral-900 xl:mx-0'>{props.children}</div>
      <div className='h-12'></div>
    </>
  )
}
