import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: { "@": path.resolve(import.meta.dirname, ".") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      exclude: [
        "drizzle/**",
        "**/node_modules/**",
        "**/.next/**",
        "app/**",
        "components/**",
        "types/**",
        "scripts/**",
        "lib/env.ts",
        "lib/auth/auth.ts",
        "lib/auth/auth-client.ts",
        "lib/test-setup.ts",
        "vitest.config.mts",
        "vitest.setup.ts",
      ],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
    testTimeout: 15000,
  },
});
