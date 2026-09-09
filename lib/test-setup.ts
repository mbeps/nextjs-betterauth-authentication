/**
 * Mock environment fallback defaults for test runners (CI/JSDOM).
 * Prevents test runners from crashing when uncommitted .env files are absent.
 */
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:password@localhost:5432/better_auth_tutorial";
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET || "mock_better_auth_secret_at_least_1_char";
process.env.BETTER_AUTH_URL =
  process.env.BETTER_AUTH_URL || "http://localhost:3000";
process.env.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "mock_github_id";
process.env.GITHUB_CLIENT_SECRET =
  process.env.GITHUB_CLIENT_SECRET || "mock_github_secret";
process.env.DISCORD_CLIENT_ID =
  process.env.DISCORD_CLIENT_ID || "mock_discord_id";
process.env.DISCORD_CLIENT_SECRET =
  process.env.DISCORD_CLIENT_SECRET || "mock_discord_secret";
process.env.POSTMARK_SERVER_TOKEN =
  process.env.POSTMARK_SERVER_TOKEN || "mock_token";
process.env.POSTMARK_FROM_EMAIL =
  process.env.POSTMARK_FROM_EMAIL || "test@example.com";
