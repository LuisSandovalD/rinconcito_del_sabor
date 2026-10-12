type LogLevel = "info" | "warn" | "error";

const REDACTED_KEYS = /password|secret|token|authorization|api[_-]?key/i;

function sanitizeString(value: string) {
  return value
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[REDACTED]")
    .replace(/([a-z][a-z0-9+.-]*:\/\/)[^@\s/]+@/gi, "$1[REDACTED]@")
    .replace(/(\b(?:password|secret|token|api[_-]?key)=)[^\s&,;]+/gi, "$1[REDACTED]");
}

function sanitize(value: unknown): unknown {
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, REDACTED_KEYS.test(key) ? "[REDACTED]" : sanitize(item)])
    );
  }
  return value;
}

function write(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const safeContext = sanitize(context ?? {}) as Record<string, unknown>;
  const entry = JSON.stringify({ level, message, ...safeContext, timestamp: new Date().toISOString() });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => write("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => write("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => write("error", message, context)
};
