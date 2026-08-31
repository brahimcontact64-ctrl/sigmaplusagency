import { log, newCorrelationId } from "./logger";
import type { ErrorCode } from "@/domain/error-codes";

export interface ErrorReporter {
  captureException(error: unknown, context: { component: string; errorCode?: ErrorCode; correlationId?: string }): string;
}

/**
 * Prepared boundary for a future provider (Sentry or similar) — Phase
 * 9 §39. No provider is configured (no credentials, no dependency
 * added merely to tick a box); the default implementation is
 * structured logging via `logger.ts`, which is already genuinely
 * useful without any external service. Swapping in a real provider
 * later means implementing this interface once, not touching every
 * call site — same pattern as `AIProvider`/the SEO adapters.
 */
class LoggingErrorReporter implements ErrorReporter {
  captureException(error: unknown, context: { component: string; errorCode?: ErrorCode; correlationId?: string }): string {
    const correlationId = context.correlationId ?? newCorrelationId();
    const message = error instanceof Error ? error.message : String(error);
    log({
      level: "ERROR",
      event: "exception_captured",
      component: context.component,
      errorCode: context.errorCode ?? "UNEXPECTED",
      correlationId,
      message: process.env.NODE_ENV === "production" ? undefined : message,
    });
    return correlationId;
  }
}

const activeReporter: ErrorReporter = new LoggingErrorReporter();

/** Returns a correlation ID safe to show a user ("reference this ID if you contact support") — never a raw DB UUID or the error message itself. */
export function reportError(error: unknown, context: { component: string; errorCode?: ErrorCode; correlationId?: string }): string {
  return activeReporter.captureException(error, context);
}
