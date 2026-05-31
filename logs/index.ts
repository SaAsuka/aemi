type LogLevel = "info" | "warn" | "error"

type LogEntry = {
  ts: string
  level: LogLevel
  service: string
  event: string
  [key: string]: unknown
}

export function createLogger(service: string) {
  function log(level: LogLevel, event: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      service,
      event,
      ...context,
    }
    const output = JSON.stringify(entry)
    if (level === "error") {
      console.error(output)
    } else if (level === "warn") {
      console.warn(output)
    } else {
      console.log(output)
    }
  }

  return {
    info: (event: string, context?: Record<string, unknown>) => log("info", event, context),
    warn: (event: string, context?: Record<string, unknown>) => log("warn", event, context),
    error: (event: string, context?: Record<string, unknown>) => log("error", event, context),
  }
}
