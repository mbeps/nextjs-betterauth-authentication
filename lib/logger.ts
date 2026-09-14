import {
  configureSync,
  getAnsiColorFormatter,
  getConsoleSink,
  getLogger as getLogTapeLogger,
  type LogLevel,
} from "@logtape/logtape";
import { env } from "@/config/env";

let initialized = false;

const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

/**
 * ANSI console formatter with aligned columns, generous spacing, and subtle delimiters.
 * Adheres strictly to the columnar layout:
 * [HH:mm:ss.SSS]  [LEVEL  ]  [CATEGORY                ]  │  [MESSAGE]
 */
export const consoleFormatter = getAnsiColorFormatter({
  timestamp: "time",
  level: "FULL",
  categoryStyle: "dim",
  timestampStyle: "dim",
  format({ timestamp, level, category, message, record }) {
    // 1. Join category parts with a middle dot and pad to 24 characters
    const rawCategory = record.category.join("·");
    const padLength = Math.max(0, 24 - rawCategory.length);
    const paddedCategory = category + " ".repeat(padLength);

    // 2. Pad level string to 7 characters (longest is "WARNING")
    // Use record.level (unformatted string) to calculate padding, avoiding ANSI escape width distortion
    const levelStr = record.level.toUpperCase();
    const levelPad = " ".repeat(Math.max(0, 7 - levelStr.length));

    // 3. Assemble aligned row
    return `${timestamp}  ${level}${levelPad}  ${paddedCategory}  ${DIM}│${RESET}  ${message}`;
  },
});

/**
 * Synchronously configures the LogTape logging system with non-blocking console sink in web runtime,
 * and synchronous sink in test runners.
 */
export function configureLoggingSync(): void {
  if (initialized) return;

  const isTest =
    typeof process !== "undefined" &&
    (process.env.NODE_ENV === "test" || Boolean(process.env.VITEST));

  try {
    configureSync({
      sinks: {
        console: getConsoleSink({
          formatter: consoleFormatter,
          // Non-blocking in runtime to never stall requests; synchronous in tests to avoid runner teardown races
          nonBlocking: !isTest,
        }),
      },
      loggers: [
        // Silence LogTape internal meta logger diagnostic notice
        {
          category: ["logtape", "meta"],
          lowestLevel: "warning",
          sinks: ["console"],
        },
        // Root application logger
        {
          category: ["app"],
          lowestLevel: (env.LOG_LEVEL || "info") as LogLevel,
          sinks: ["console"],
        },
      ],
    });
    initialized = true;
  } catch {
    initialized = true;
  }
}

/**
 * Async entry point for application startup (optional instrumentation hook).
 */
export async function configureLogging(): Promise<void> {
  configureLoggingSync();
}

/**
 * Export getLogger from LogTape, guaranteeing the logging system is configured.
 */
export function getLogger(
  ...args: Parameters<typeof getLogTapeLogger>
): ReturnType<typeof getLogTapeLogger> {
  if (!initialized) {
    configureLoggingSync();
  }
  return getLogTapeLogger(...args);
}
