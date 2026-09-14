import { z } from "zod";

/**
 * Validation schema for client-accessible environment variables.
 * Enforces schema constraints on public client-side variables prefixed with NEXT_PUBLIC_.
 * Use this schema to safely validate configuration exposed to the browser.
 *
 * @see serverEnvSchema for server-only environment variables
 * @author Maruf Bepary
 */
export const clientEnvSchema = z.object({
  // Define client-side (NEXT_PUBLIC_*) variables here if needed
});

/**
 * Validation schema for server-only environment variables.
 * Enforces strict constraints on database credentials, authentication secrets, OAuth credentials, and third-party APIs.
 * Prevents application startup if critical secrets or configuration keys are missing or malformed.
 *
 * @see clientEnvSchema for browser-facing variables
 * @author Maruf Bepary
 */
export const serverEnvSchema = clientEnvSchema.extend({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "warning", "error", "fatal"])
    .default("info")
    .transform((val) => (val === "warn" ? "warning" : val)),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  CLIENT_ID_GITHUB: z.string().min(1, "CLIENT_ID_GITHUB is required"),
  CLIENT_SECRET_GITHUB: z.string().min(1, "CLIENT_SECRET_GITHUB is required"),
  CLIENT_ID_DISCORD: z.string().min(1, "CLIENT_ID_DISCORD is required"),
  CLIENT_SECRET_DISCORD: z.string().min(1, "CLIENT_SECRET_DISCORD is required"),
  POSTMARK_SERVER_TOKEN: z.string().min(1, "POSTMARK_SERVER_TOKEN is required"),
  POSTMARK_FROM_EMAIL: z
    .string()
    .email("POSTMARK_FROM_EMAIL must be a valid email address"),
  ARCJET_API_KEY: z.string().optional(),
});

/**
 * Inferred type representing validated client-side environment variables.
 *
 * @see clientEnvSchema
 * @author Maruf Bepary
 */
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Inferred type representing validated server-side environment variables.
 *
 * @see serverEnvSchema
 * @author Maruf Bepary
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Unified application environment variable type definition.
 * Serves as the primary type interface for application configuration access.
 *
 * @see ServerEnv
 * @author Maruf Bepary
 */
export type Env = ServerEnv;

/**
 * Validates environment variables according to the active runtime context.
 * Differentiates between client and server execution environments and runs validation
 * against Zod schemas. Pass explicit process.env keys so Next.js bundlers can inline variables.
 *
 * @param runtimeEnv - Key-value map of runtime environment variables to validate
 * @param isServerEnv - Flag indicating whether validation is running in a server context
 * @returns Fully validated and typed environment configuration object
 * @throws {Error} When required environment variables are missing or fail schema validation
 * @see serverEnvSchema
 * @see clientEnvSchema
 * @author Maruf Bepary
 */
export function validateEnv(
  runtimeEnv: Record<string, unknown> = {
    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    CLIENT_ID_GITHUB: process.env.CLIENT_ID_GITHUB,
    CLIENT_SECRET_GITHUB: process.env.CLIENT_SECRET_GITHUB,
    CLIENT_ID_DISCORD: process.env.CLIENT_ID_DISCORD,
    CLIENT_SECRET_DISCORD: process.env.CLIENT_SECRET_DISCORD,
    POSTMARK_SERVER_TOKEN: process.env.POSTMARK_SERVER_TOKEN,
    POSTMARK_FROM_EMAIL: process.env.POSTMARK_FROM_EMAIL,
    ARCJET_API_KEY: process.env.ARCJET_API_KEY,
  },
  isServerEnv: boolean = typeof window === "undefined",
): Env {
  if (
    process.env.SKIP_ENV_VALIDATION === "true" ||
    process.env.SKIP_ENV_VALIDATION === "1"
  ) {
    return runtimeEnv as unknown as Env;
  }

  const schema = isServerEnv ? serverEnvSchema : clientEnvSchema;
  const parsed = schema.safeParse(runtimeEnv);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    throw new Error("Invalid environment variables");
  }

  return parsed.data as unknown as Env;
}

/**
 * Singleton validated environment configuration object.
 * Provides type-safe access to application secrets and configuration across the server runtime.
 * Evaluated at module load time to fail fast if required environment variables are absent.
 *
 * @see validateEnv
 * @author Maruf Bepary
 */
export const env = validateEnv();
