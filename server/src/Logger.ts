import colors from 'colors'
import { createLogger, format, Logger, transports } from 'winston'
import { MAX_USERNAME_LENGTH } from './handlers/SetNameHandler'

const MAX_EVENT_NAME_LENGTH = 30

function beautifyStackTrace(stackTrace: string): string {
  return stackTrace
    .split('\n')
    .map((line) => (line.includes('node') ? colors.dim.red(line) : colors.red(line)))
    .join('\n')
}

function formatTimestamp({ timestamp }: { timestamp: string }): string {
  return `[${colors.gray(timestamp)}]`
}

function formatSocketId({ socketId, isBot }: { socketId: string; isBot: boolean }): string {
  return isBot ? `${colors.gray(socketId)} (bot)` : `${colors.blue(socketId)}      `
}

function formatUserName({ userName, isBot }: { userName: string; isBot: boolean }): string {
  const paddedUserName = userName.padEnd(MAX_USERNAME_LENGTH, ' ')

  return isBot ? colors.gray(paddedUserName) : colors.blue(paddedUserName)
}

function formatCombineForJson() {
  return format.combine(
    //
    format.splat(),
    format.json(),
  )
}

function formatCombineForHumanReadable() {
  return format.combine(
    format.colorize(), // Colorizes only 'level'

    // `info` is typed as { message: string; type: string }, but we are working with way more
    // fields on this object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    format.printf((info: any) => {
      if (info.isSocketEventLog) {
        const paddedEventName = (info.socketEvent || '').padEnd(MAX_EVENT_NAME_LENGTH, ' ')

        return (
          `${formatTimestamp(info)} ${formatSocketId(info)} ${formatUserName(info)} sends ` +
          `'${colors.green(paddedEventName)}' with ${JSON.stringify(info.input.firstArgument)}`
        )
      } else if (info.isSocketConnectionLog) {
        return `${formatTimestamp(info)} ${formatSocketId(info)} connected`
      }

      const parts = [
        info.newRequest && '\n\n',
        `[${colors.gray(info.timestamp)}]`,
        ` ${info.level}:`,
        info.message && ` ${info.message}`,
        info.stack && `\n${beautifyStackTrace(info.stack)}`,
      ]

      return parts.filter((item) => item).join('')
    }),
  )
}

export function createAppLogger(): Logger {
  const loggerTransports = []

  if (process.env.OWL_SERVER_LOGGER_OUTPUT_PATH_APP_JSON) {
    loggerTransports.push(
      new transports.File({
        filename: process.env.OWL_SERVER_LOGGER_OUTPUT_PATH_APP_JSON,
        format: formatCombineForJson(),
        level: 'info',
      }),
    )
  }

  if (process.env.OWL_SERVER_LOGGER_OUTPUT_PATH_APP) {
    loggerTransports.push(
      new transports.File({
        filename: process.env.OWL_SERVER_LOGGER_OUTPUT_PATH_APP,
        format: formatCombineForHumanReadable(),
        level: 'info',
      }),
    )
  }

  if (process.env.OWL_SERVER_ENABLE_CONSOLE_LOGGER) {
    loggerTransports.push(
      new transports.Console({
        format: formatCombineForHumanReadable(),
        level: 'info',
      }),
    )
  }

  return createLogger({
    format: format.combine(
      //
      format.errors({ stack: true }),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    ),

    transports: loggerTransports,
  })
}

export function createTestLogger(): Logger {
  return createLogger({
    format: format.combine(
      //
      format.errors({ stack: true }),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    ),

    transports: [
      new transports.File({
        filename: 'log/test.json.log',
        format: formatCombineForJson(),
        level: 'info',
      }),

      new transports.File({
        filename: 'log/test.log',
        format: formatCombineForHumanReadable(),
        level: 'info',
      }),
    ],
  })
}
