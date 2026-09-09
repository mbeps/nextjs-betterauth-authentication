import { describe, expect, it, vi } from "vitest";
import * as schema from "@/drizzle/schema";

const { mockGetHandler, mockPostHandler } = vi.hoisted(() => ({
  mockGetHandler: vi.fn().mockImplementation(async (req: Request) => new Response("ok-get")),
  mockPostHandler: vi.fn().mockImplementation(async (req: Request) => new Response("ok-post")),
}));

vi.mock("@/lib/env", () => ({
  env: {
    BETTER_AUTH_SECRET: "mock_secret_at_least_32_characters_long",
    BETTER_AUTH_URL: "http://localhost:3000",
    CLIENT_ID_GITHUB: "mock_github_id",
    CLIENT_SECRET_GITHUB: "mock_github_secret",
    CLIENT_ID_DISCORD: "mock_discord_id",
    CLIENT_SECRET_DISCORD: "mock_discord_secret",
    POSTMARK_SERVER_TOKEN: "mock_postmark_token",
    POSTMARK_FROM_EMAIL: "noreply@example.com",
    DATABASE_URL: "postgresql://postgres:password@localhost:5432/better_auth_tutorial",
    NODE_ENV: "test",
  },
}));

vi.mock("@/drizzle/db", () => ({
  db: {
    _: { schema },
    ...schema,
    query: {
      member: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: vi.fn(() => ({
    GET: mockGetHandler,
    POST: mockPostHandler,
  })),
  nextCookies: vi.fn(() => ({ id: "next-cookies" })),
}));

import { GET, POST } from "@/app/api/auth/[...all]/route";

describe("Better Auth API Route Handlers", () => {
  it("exports GET handler and dispatches requests", async () => {
    expect(GET).toBeDefined();
    expect(typeof GET).toBe("function");

    const req = new Request("http://localhost:3000/api/auth/session");
    const res = await GET(req);

    expect(mockGetHandler).toHaveBeenCalledWith(req);
    expect(await res.text()).toBe("ok-get");
  });

  it("exports POST handler and dispatches requests", async () => {
    expect(POST).toBeDefined();
    expect(typeof POST).toBe("function");

    const req = new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", password: "password123" }),
    });
    const res = await POST(req);

    expect(mockPostHandler).toHaveBeenCalledWith(req);
    expect(await res.text()).toBe("ok-post");
  });
});

