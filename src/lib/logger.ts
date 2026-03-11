import { db } from "@/lib/db";
import { appLogs } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  input?: unknown;
  output?: unknown;
  expected?: string;
  error?: unknown;
  metadata?: Record<string, unknown>;
  durationMs?: number;
}

function formatError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack };
  }
  return { message: String(err) };
}

function emit(level: LogLevel, operation: string, payload: LogPayload) {
  const entry: Record<string, unknown> = {
    level,
    operation,
    timestamp: new Date().toISOString(),
  };

  if (payload.input !== undefined) entry.input = payload.input;
  if (payload.output !== undefined) entry.output = payload.output;
  if (payload.expected !== undefined) entry.expected = payload.expected;
  if (payload.durationMs !== undefined) entry.durationMs = payload.durationMs;
  if (payload.metadata !== undefined) entry.metadata = payload.metadata;

  if (payload.error !== undefined) {
    const { message, stack } = formatError(payload.error);
    entry.error = message;
    if (stack) entry.errorStack = stack;
  }

  const consoleFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  consoleFn(JSON.stringify(entry));

  if (level === "error") {
    persistLog(operation, payload).catch(console.error);
  }
}

async function persistLog(operation: string, payload: LogPayload) {
  const { message, stack } = payload.error ? formatError(payload.error) : { message: undefined, stack: undefined };

  await db.insert(appLogs).values({
    level: "error",
    operation,
    input: payload.input as Record<string, unknown> | undefined,
    output: payload.output as Record<string, unknown> | undefined,
    expected: payload.expected,
    errorMessage: message,
    errorStack: stack,
    metadata: payload.metadata,
    durationMs: payload.durationMs,
  });
}

export const log = {
  debug: (operation: string, payload: LogPayload = {}) => emit("debug", operation, payload),
  info: (operation: string, payload: LogPayload = {}) => emit("info", operation, payload),
  warn: (operation: string, payload: LogPayload = {}) => emit("warn", operation, payload),
  error: (operation: string, payload: LogPayload = {}) => emit("error", operation, payload),
};

// --- API Route Wrapper ---

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<NextResponse | Response>;

/**
 * Wraps an API route handler with automatic error logging.
 * Catches unhandled errors, logs them with full context, and returns a 500 JSON response.
 */
export function withLogging(
  operation: string,
  handler: RouteHandler,
  errorMessage = "Ein unerwarteter Fehler ist aufgetreten.",
): RouteHandler {
  return async (request, context) => {
    const start = Date.now();
    try {
      return await handler(request, context);
    } catch (error) {
      log.error(operation, {
        error,
        durationMs: Date.now() - start,
        metadata: {
          method: request.method,
          url: request.url,
        },
      });
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  };
}
