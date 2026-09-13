import { z } from "zod";

export const clientEnvSchema = z.object({
  // Define client-side (NEXT_PUBLIC_*) variables here if needed
});

export const serverEnvSchema = clientEnvSchema.extend({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
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

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type Env = ServerEnv;

/**
 * Validates environment variables according to active runtime context.
 * Pass explicit process.env keys so Next.js bundlers can inline NEXT_PUBLIC_* variables.
 */
export function validateEnv(
  runtimeEnv: Record<string, unknown> = {
    NODE_ENV: process.env.NODE_ENV,
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

export const env = validateEnv();
