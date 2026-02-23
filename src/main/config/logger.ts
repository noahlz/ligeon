import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'
import os from 'os'
import { loadSettings } from './settingsStore.js'
import { IpcError } from '../../shared/types/ipcError.js'

// Not configurable...
const LOG_DIR = path.join(os.homedir(), '.ligeon', 'logs')
const settings =  loadSettings();

export const logger = winston.createLogger({
  level: settings.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'ligeon-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: settings.logging.maxSize,
      maxFiles: `${settings.logging.retentionDays}d`,
      format: winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
        return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`
      })
    })
  ]
})

export function logAndThrow(
  module: string,
  operation: string,
  context: Record<string, unknown>,
  error: unknown,
  userMessage: string
): never {
  logError(module, operation, context, error)
  throw new IpcError(userMessage, module, operation, context)
}

/**
 * Convenience function to log errors with context */
export function logError(
  module: string,
  operation: string,
  context: Record<string, unknown>,
  error: unknown
): void {
  logger.error(`[${module}] ${operation} failed`, {
    context,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  })
}
