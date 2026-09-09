import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateEnv } from "./env.ts";

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
    assert.equal(parsed.DATABASE_URL, validServerEnv.DATABASE_URL);
    assert.equal(
      parsed.POSTMARK_FROM_EMAIL,
      validServerEnv.POSTMARK_FROM_EMAIL,
    );
    assert.equal(parsed.NODE_ENV, "test");
  });

  it("defaults NODE_ENV to development if not provided", () => {
    const { NODE_ENV: _, ...withoutNodeEnv } = validServerEnv;
    const parsed = validateEnv(withoutNodeEnv, true);
    assert.equal(parsed.NODE_ENV, "development");
  });

  it("throws when a required server environment variable is missing", () => {
    const { DATABASE_URL: _, ...invalidEnv } = validServerEnv;
    assert.throws(
      () => validateEnv(invalidEnv, true),
      /Invalid environment variables/,
    );
  });

  it("throws when BETTER_AUTH_URL is not a valid URL", () => {
    const invalidEnv = { ...validServerEnv, BETTER_AUTH_URL: "not-a-url" };
    assert.throws(
      () => validateEnv(invalidEnv, true),
      /Invalid environment variables/,
    );
  });

  it("throws when POSTMARK_FROM_EMAIL is not a valid email address", () => {
    const invalidEnv = {
      ...validServerEnv,
      POSTMARK_FROM_EMAIL: "invalid-email",
    };
    assert.throws(
      () => validateEnv(invalidEnv, true),
      /Invalid environment variables/,
    );
  });

  it("succeeds in client context without server secrets", () => {
    const clientEnv = validateEnv({}, false);
    assert.ok(clientEnv);
  });

  it("skips validation when SKIP_ENV_VALIDATION is true", () => {
    process.env.SKIP_ENV_VALIDATION = "true";
    try {
      const parsed = validateEnv({});
      assert.ok(parsed);
    } finally {
      delete process.env.SKIP_ENV_VALIDATION;
    }
  });
});
