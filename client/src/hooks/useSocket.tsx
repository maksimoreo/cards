import { ClientSocketT } from 'common/src/TypedClientSocket/ClientSocketT'
import { createSocketEventEmitter } from 'common/src/TypedClientSocket/emit'
import React, { useMemo } from 'react'

interface SocketContextValueT {
  socket: ClientSocketT
  send: ReturnType<typeof createSocketEventEmitter>
}

export const SocketContext = React.createContext<SocketContextValueT | null>(null)

export function useSocket(): SocketContextValueT {
  const value = React.useContext(SocketContext)

  if (value === null) {
    throw 'useSocket must be inside a SocketProvider'
  }

  return value
}

export function SocketProvider({ socket, children }: React.PropsWithChildren<{ socket: ClientSocketT }>): JSX.Element {
  const send = useMemo(() => createSocketEventEmitter(socket), [])

  return <SocketContext.Provider value={{ socket, send }}>{children}</SocketContext.Provider>
}
