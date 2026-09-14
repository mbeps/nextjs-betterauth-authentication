/**
 * Next.js server runtime instrumentation hook.
 * Pre-initializes LogTape logging synchronously on server startup.
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation}
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { configureLoggingSync } = await import("@/lib/logger");
    configureLoggingSync();
  }
}
