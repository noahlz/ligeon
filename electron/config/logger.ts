import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'
import os from 'os'

const LOG_DIR = path.join(os.homedir(), '.ligeon', 'logs')
const LOG_RETENTION_DAYS = process.env.LOG_RETENTION_DAYS || '90'

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
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
      maxSize: '10m',
      maxFiles: `${LOG_RETENTION_DAYS}d`,
      format: winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
        return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`
      })
    })
  ]
})

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
