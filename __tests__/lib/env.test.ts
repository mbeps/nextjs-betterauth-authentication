import { describe, expect, it } from "vitest";
import { validateEnv } from "@/lib/env";

const validServerEnv = {
  NODE_ENV: "test",
  DATABASE_URL:
    "postgresql://postgres:password@localhost:5432/better_auth_tutorial",
  BETTER_AUTH_SECRET: "EBWYmxjaxopyyoW3Xq4ka7S9Q8ZCN6g2",
  BETTER_AUTH_URL: "http://localhost:3000",
  CLIENT_ID_GITHUB: "mock_github_id",
  CLIENT_SECRET_GITHUB: "mock_github_secret",
  CLIENT_ID_DISCORD: "mock_discord_id",
  CLIENT_SECRET_DISCORD: "mock_discord_secret",
  POSTMARK_SERVER_TOKEN: "mock_postmark_token",
  POSTMARK_FROM_EMAIL: "noreply@example.com",
};

describe("validateEnv", () => {
  it("validates valid server environment variables successfully", () => {
    const parsed = validateEnv(validServerEnv, true);
    expect(parsed.DATABASE_URL).toBe(validServerEnv.DATABASE_URL);
    expect(parsed.POSTMARK_FROM_EMAIL).toBe(validServerEnv.POSTMARK_FROM_EMAIL);
    expect(parsed.NODE_ENV).toBe("test");
  });

  it("defaults NODE_ENV to development if not provided", () => {
    const { NODE_ENV: _, ...withoutNodeEnv } = validServerEnv;
    const parsed = validateEnv(withoutNodeEnv, true);
    expect(parsed.NODE_ENV).toBe("development");
  });

  it("throws when a required server environment variable is missing", () => {
    const { DATABASE_URL: _, ...invalidEnv } = validServerEnv;
    expect(() => validateEnv(invalidEnv, true)).toThrow(
      /Invalid environment variables/,
    );
  });

  it("throws when BETTER_AUTH_URL is not a valid URL", () => {
    const invalidEnv = { ...validServerEnv, BETTER_AUTH_URL: "not-a-url" };
    expect(() => validateEnv(invalidEnv, true)).toThrow(
      /Invalid environment variables/,
    );
  });

  it("throws when POSTMARK_FROM_EMAIL is not a valid email address", () => {
    const invalidEnv = {
      ...validServerEnv,
      POSTMARK_FROM_EMAIL: "invalid-email",
    };
    expect(() => validateEnv(invalidEnv, true)).toThrow(
      /Invalid environment variables/,
    );
  });

  it("succeeds in client context without server secrets", () => {
    const clientEnv = validateEnv({}, false);
    expect(clientEnv).toBeDefined();
  });

  it("skips validation when SKIP_ENV_VALIDATION is true", () => {
    process.env.SKIP_ENV_VALIDATION = "true";
    try {
      const parsed = validateEnv({});
      expect(parsed).toBeDefined();
    } finally {
      delete process.env.SKIP_ENV_VALIDATION;
    }
  });
});

