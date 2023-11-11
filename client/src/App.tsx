import { faBars, faMessage } from '@fortawesome/free-solid-svg-icons'
import classNames from 'classnames'
import { ClientSocketT } from 'common/src/TypedClientSocket/ClientSocketT'
import { useState } from 'react'
import { Provider } from 'react-redux'
import AppMainView from './AppMainView'
import { store } from './app/store'
import Button from './components/Button'
import { Chat } from './components/Chat/Chat'
import SideBarRight from './components/SideBarRight'
import { SocketProvider } from './hooks/useSocket'

type AppProps = {
  socket: ClientSocketT
}

function App({ socket }: AppProps): JSX.Element {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)

  return (
    <div className='dark'>
      <SocketProvider socket={socket}>
        <Provider store={store}>
          <div className='bg-neutral-900'>
            {/* Navbar */}
            <div className='fixed top-0 z-[200] flex h-12 w-full flex-row items-center justify-between'>
              <Button
                iconProps={{ icon: faBars }}
                onClick={() => {
                  if (isSideMenuOpen) {
                    setIsSideMenuOpen(false)
                  } else {
                    setIsChatOpen(false)
                    setIsSideMenuOpen(true)
                  }
                }}
                className='xl:hidden'
              />

              <Button
                iconProps={{ icon: faMessage }}
                onClick={() => {
                  if (isChatOpen) {
                    setIsChatOpen(false)
                  } else {
                    setIsSideMenuOpen(false)
                    setIsChatOpen(true)
                  }
                }}
                className='md:hidden'
              />
            </div>

            <div className='flex h-screen flex-row xl:mx-12 2xl:mx-36'>
              {/* Sidebar */}
              <div
                className={classNames(
                  'fixed left-0 top-0 z-[100] h-full w-full transition-transform sm:w-80 xl:relative xl:block xl:translate-x-0 xl:border-r-2 xl:border-neutral-800 xl:transition-none',
                  { '-translate-x-full': !isSideMenuOpen },
                )}
              >
                <div className='mt-12 flex h-[calc(100%-48px)] flex-col overflow-y-scroll bg-neutral-900 pb-8 xl:mt-0 xl:h-full'>
                  <SideBarRight />
                </div>
              </div>

              {/* Main view */}
              <div className='flex-grow overflow-y-scroll'>
                <AppMainView />
              </div>

              {/* (Left) Chat v2 */}
              <div
                className={classNames(
                  'fixed right-0 top-0 z-[100] h-full w-full transition-transform sm:w-80 md:relative md:block md:translate-x-0 md:border-l-2 md:border-neutral-800 md:transition-none',
                  { 'translate-x-full': !isChatOpen },
                )}
              >
                <div className='mt-12 flex h-[calc(100%-48px)] flex-col bg-neutral-900 md:mt-0 md:h-full'>
                  <Chat />
                </div>
              </div>

              {/* Backdrop */}
              <div
                className={classNames(
                  'transition-color fixed left-0 top-12 z-[99] h-full w-full bg-neutral-950 opacity-75 xl:hidden',
                  { hidden: !isChatOpen && !isSideMenuOpen },
                )}
                onClick={() => {
                  setIsChatOpen(false)
                  setIsSideMenuOpen(false)
                }}
              ></div>
            </div>
          </div>
        </Provider>
      </SocketProvider>
    </div>
  )
}

export default App
