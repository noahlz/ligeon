export class IpcError extends Error {
  constructor(
    readonly userMessage: string,
    readonly module: string,
    readonly operation: string,
    readonly context: Record<string, unknown>
  ) {
    // Encode into message — structured clone only preserves message/name/stack across IPC
    super(`IPC_ERROR:${JSON.stringify({ userMessage, module, operation, context })}`)
    this.name = 'IpcError'
  }

  static getUserMessage(error: unknown): string | null {
    if (!(error instanceof Error)) return null
    if (!error.message.startsWith('IPC_ERROR:')) return null
    try {
      return JSON.parse(error.message.slice(10)).userMessage as string
    } catch { return null }
  }
}
