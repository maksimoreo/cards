import dotenvFlow from 'dotenv-flow'
import App from './App'
import { createAppLogger } from './Logger'

// Using 'dotenv-flow' here instead of 'dotenv', to match Vite's default .env loading mechanics
dotenvFlow.config()

const app = new App({
  port: process.env.OWL_SERVER_EXPRESS_APP_PORT ? parseInt(process.env.OWL_SERVER_EXPRESS_APP_PORT) : 5000,
  logger: createAppLogger(),
  expressAppHostname: process.env.OWL_SERVER_EXPRESS_APP_HOSTNAME,
})

let interrupted = false
;['SIGINT', 'SIGQUIT', 'SIGTERM'].forEach((signal) => {
  process.once(signal, async () => {
    console.log(`Received ${signal}`)

    if (!interrupted) {
      interrupted = true
      await app.close()
    }

    process.exit()
  })
})
;(async (): Promise<void> => {
  app.logger.info('Starting the server...')
  await app.start()
  app.logger.info(`Running server on port ${app.port}. Link: http://${app.expressAppHostname}:${app.port}`)
})()
