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
process.env.CLIENT_ID_GITHUB = process.env.CLIENT_ID_GITHUB || "mock_github_id";
process.env.CLIENT_SECRET_GITHUB =
  process.env.CLIENT_SECRET_GITHUB || "mock_github_secret";
process.env.CLIENT_ID_DISCORD =
  process.env.CLIENT_ID_DISCORD || "mock_discord_id";
process.env.CLIENT_SECRET_DISCORD =
  process.env.CLIENT_SECRET_DISCORD || "mock_discord_secret";
process.env.POSTMARK_SERVER_TOKEN =
  process.env.POSTMARK_SERVER_TOKEN || "mock_token";
process.env.POSTMARK_FROM_EMAIL =
  process.env.POSTMARK_FROM_EMAIL || "test@example.com";
