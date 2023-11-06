import { useRoom } from '../../features/room/selectors'
import AboutSection from './AboutSection'
import DebugSection from './DebugSection'
import RoomSection from './RoomSection'

// Despite its name, this side bar is, in fact, shown on the left side of the screen.
// Don't be fooled by this function name. Can't trust anyone these days.
export default function SideBarRight() {
  const room = useRoom()

  return (
    <>
      <h1 className='owl-font-playpen-sans mx-3 mb-8 text-5xl font-bold text-neutral-300 xl:mt-4'>Cards</h1>

      {room && <RoomSection room={room} />}

      {import.meta.env.DEV && <DebugSection />}

      <AboutSection />
    </>
  )
}
