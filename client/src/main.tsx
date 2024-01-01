import React from 'react'
import ReactDOM from 'react-dom/client'
import socketio, { io } from 'socket.io-client'
import App from './App'
import { LOCAL_STORAGE_KEY__SERVER_URL } from './const'
import './index.css'

// For debug on devices on the same network
const serverAddress =
  localStorage.getItem(LOCAL_STORAGE_KEY__SERVER_URL) || import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'
console.log(`Using "${serverAddress}" to connect to the server.`)
const socket = io(serverAddress)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App socket={socket} />
  </React.StrictMode>,
)

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cola: Record<string, any>
  }
}

window.cola = {
  socketio,
  socket,
  serverEval: (password: string, code: string): void => {
    socket.emit('eval', { password, input: code }, (response: unknown) => {
      console.log(response)
    })
  },
}
