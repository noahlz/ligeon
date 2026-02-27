const IPC_ERROR_PREFIX = 'IPC_ERROR:'

export class IpcError extends Error {
  constructor(
    readonly userMessage: string,
    readonly module: string,
    readonly operation: string,
    readonly context: Record<string, unknown>
  ) {
    // Encode into message — structured clone only preserves message/name/stack across IPC
    let payload: string
    try {
      payload = JSON.stringify({ userMessage, module, operation, context })
    } catch {
      payload = JSON.stringify({ userMessage, module, operation, context: '[unserializable]' })
    }
    super(`${IPC_ERROR_PREFIX}${payload}`)
    this.name = 'IpcError'
  }

  static getUserMessage(error: unknown): string | null {
    if (!(error instanceof Error)) return null
    if (!error.message.startsWith(IPC_ERROR_PREFIX)) return null
    try {
      const payload = JSON.parse(error.message.slice(IPC_ERROR_PREFIX.length)) as { userMessage?: unknown }
      const msg = payload?.userMessage
      return typeof msg === 'string' ? msg : null
    } catch { return null }
  }
}
