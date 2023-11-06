import colors from 'colors'
import { createLogger, format, Logger, transports } from 'winston'
import { StateUpdateEvent } from './Bot/events'
import { UnsuccessfulSendError } from './Bot/socketEmitEvent'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogT = any

function formatBotId(botId: string): string {
  return `Bot ${colors.bgCyan.black(botId)}`
}

function formatSocketEvent(socketEvent: string): string {
  return `'${colors.blue(socketEvent)}'`
}

function formatTimestamp(timestamp: string): string {
  return colors.dim.gray(timestamp)
}

function formatReceivedEvent(log: LogT, event: string): string {
  return `${formatBotLogStart(log)} received ${formatSocketEvent(event)}`
}

function formatBotLogStart(log: LogT): string {
  const stateType = colors.green((log.state.type || '').padEnd(20, ' '))

  return `${formatTimestamp(log.timestamp)} ${formatBotId(log.botId)} (state: ${stateType})`
}

function formatStateUpdateEvent(event: StateUpdateEvent): string {
  return `'${colors.blue(event.toString())}'`
}

export function createBotsLogger(): Logger {
  const loggerTransports = []

  if (process.env.OWL_SERVER_LOGGER_OUTPUT_PATH_BOTS_JSON) {
    loggerTransports.push(
      new transports.File({
        filename: process.env.OWL_SERVER_LOGGER_OUTPUT_PATH_BOTS_JSON,
        level: 'info',
        format: format.combine(
          //
          format.splat(),
          format.json(),
        ),
      }),
    )
  }

  if (process.env.OWL_SERVER_LOGGER_OUTPUT_PATH_BOTS) {
    loggerTransports.push(
      new transports.File({
        filename: process.env.OWL_SERVER_LOGGER_OUTPUT_PATH_BOTS,
        level: 'info',
        format: format.combine(
          //
          format.printf((log): string => {
            switch (log.type) {
              case 'receivedConnect':
                return formatReceivedEvent(log, 'connect')
              case 'receivedDisconnect':
                return formatReceivedEvent(log, 'disconnect')
              case 'receivedEvent':
                return formatReceivedEvent(log, log.event)
              case 'sentEvent':
                return `${formatBotLogStart(log)} sent event ${formatSocketEvent(log.event)}`
              case 'errorWillHalt':
                return `${formatBotLogStart(log)} catched '${log.error}', will halt`
              case 'errorWillDisconnect': {
                const errorExtra =
                  log.error instanceof UnsuccessfulSendError
                    ? `\nExtra: ${JSON.stringify(log.error.response.validationErrors)}`
                    : ''

                return `${formatBotLogStart(log)} catched an error, will disconnect.\n${log.error.stack}${errorExtra}`
              }
              case 'errorWillDisconnectManually':
                return `${formatBotLogStart(log)} catched '${log.error}', will disconnect manually`
              case 'startProcessingEvent':
                return `${formatBotLogStart(log)} processing event ${formatStateUpdateEvent(log.event)}`
              case 'processedEvent':
                return `${formatBotLogStart(log)} processed event ${formatStateUpdateEvent(log.event)}`
              case 'eventAfterDisconnect':
                return (
                  `${formatBotLogStart(log)} will not place event ${formatStateUpdateEvent(log.event)} after ` +
                  `'disconnect' or 'socketDisconnect'`
                )
              default:
                break
            }

            return `${colors.dim.gray(log.timestamp)} ${log.message}`
          }),
        ),
      }),
    )
  }

  return createLogger({
    level: 'info',
    format: format.combine(
      //
      format.errors({ stack: true }),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    ),
    transports: loggerTransports,
  })
}
