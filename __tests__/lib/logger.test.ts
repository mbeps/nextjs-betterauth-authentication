import { describe, expect, it } from "vitest";
import {
  configureLogging,
  configureLoggingSync,
  consoleFormatter,
  getLogger,
} from "@/lib/logger";

describe("Logger Module (lib/logger.ts)", () => {
  it("exports getLogger returning logger with standard methods", () => {
    const log = getLogger(["app", "test"]);
    expect(log).toBeDefined();
    expect(typeof log.debug).toBe("function");
    expect(typeof log.info).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
    expect(typeof log.fatal).toBe("function");
  });

  it("allows configureLoggingSync to be called multiple times idempotently", () => {
    expect(() => {
      configureLoggingSync();
      configureLoggingSync();
    }).not.toThrow();
  });

  it("resolves configureLogging async helper without errors", async () => {
    await expect(configureLogging()).resolves.toBeUndefined();
  });

  it("formats log records conforming to columnar visual layout", () => {
    const formatted = consoleFormatter({
      category: ["app", "actions", "test"],
      level: "info",
      message: ["Test message"],
      timestamp: Date.now(),
      rawMessage: "Test message",
      properties: {},
    });

    expect(formatted).toBeDefined();
    expect(formatted).toContain("app·actions·test");
    expect(formatted).toContain("│");
    expect(formatted).toContain("Test message");
  });
});

