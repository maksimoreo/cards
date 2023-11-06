import { PropsWithChildren } from 'react'

export default function MainViewHeader(props: PropsWithChildren) {
  return <div className='mx-12 h-12 xl:mx-0'>{props.children}</div>
}
