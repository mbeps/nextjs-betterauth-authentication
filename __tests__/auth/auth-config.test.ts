import { beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/drizzle/schema";

const {
  mockFindFirst,
  mockSendWelcome,
  mockSendEmailVerification,
  mockSendPasswordReset,
  mockSendOrgInvite,
  mockSendDeleteAccount,
} = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockSendWelcome: vi.fn().mockResolvedValue(undefined),
  mockSendEmailVerification: vi.fn().mockResolvedValue(undefined),
  mockSendPasswordReset: vi.fn().mockResolvedValue(undefined),
  mockSendOrgInvite: vi.fn().mockResolvedValue(undefined),
  mockSendDeleteAccount: vi.fn().mockResolvedValue(undefined),
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
        findFirst: mockFindFirst,
      },
    },
  },
}));

vi.mock("@/lib/emails/welcome-email", () => ({
  sendWelcomeEmail: mockSendWelcome,
}));
vi.mock("@/lib/emails/email-verification", () => ({
  sendEmailVerificationEmail: mockSendEmailVerification,
}));
vi.mock("@/lib/emails/password-reset-email", () => ({
  sendPasswordResetEmail: mockSendPasswordReset,
}));
vi.mock("@/lib/emails/organization-invite-email", () => ({
  sendOrganizationInviteEmail: mockSendOrgInvite,
}));
vi.mock("@/lib/emails/delete-account-verification", () => ({
  sendDeleteAccountVerificationEmail: mockSendDeleteAccount,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

import { auth } from "@/lib/auth/auth";

describe("Better Auth Server Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("configures basic app options and credentials", () => {
    expect(auth.options.appName).toBe("Better Auth Demo");
    expect(auth.options.baseURL).toBe("http://localhost:3000");
    expect(auth.options.secret).toBe("mock_secret_at_least_32_characters_long");
  });

  describe("Social provider mapProfileToUser", () => {
    it("maps GitHub public_repos to favoriteNumber", () => {
      const mapGithub = auth.options.socialProviders?.github?.mapProfileToUser;
      expect(mapGithub).toBeDefined();

      const mappedWithRepos = mapGithub!({ public_repos: 42 } as any);
      expect(mappedWithRepos).toEqual({ favoriteNumber: 42 });

      const mappedWithNull = mapGithub!({ public_repos: null } as any);
      expect(mappedWithNull).toEqual({ favoriteNumber: 0 });

      const mappedWithoutRepos = mapGithub!({} as any);
      expect(mappedWithoutRepos).toEqual({ favoriteNumber: 0 });
    });

    it("maps Discord profile to default favoriteNumber 0", () => {
      const mapDiscord = auth.options.socialProviders?.discord?.mapProfileToUser;
      expect(mapDiscord).toBeDefined();

      const mapped = (mapDiscord as () => any)!();
      expect(mapped).toEqual({ favoriteNumber: 0 });
    });
  });

  describe("Database session hooks", () => {
    it("attaches activeOrganizationId from latest member record if found", async () => {
      mockFindFirst.mockResolvedValueOnce({ organizationId: "org-test-123" });

      const sessionBefore =
        auth.options.databaseHooks?.session?.create?.before;
      expect(sessionBefore).toBeDefined();

      const result = await (sessionBefore as any)({
        userId: "user-abc",
        id: "sess-1",
      });

      expect(mockFindFirst).toHaveBeenCalledOnce();
      expect(result).toEqual({
        data: {
          userId: "user-abc",
          id: "sess-1",
          activeOrganizationId: "org-test-123",
        },
      });
    });

    it("leaves activeOrganizationId undefined if user has no memberships", async () => {
      mockFindFirst.mockResolvedValueOnce(undefined);

      const sessionBefore =
        auth.options.databaseHooks?.session?.create?.before;
      expect(sessionBefore).toBeDefined();

      const result = await (sessionBefore as any)({
        userId: "user-no-org",
        id: "sess-2",
      });

      expect(mockFindFirst).toHaveBeenCalledOnce();
      expect(result).toEqual({
        data: {
          userId: "user-no-org",
          id: "sess-2",
          activeOrganizationId: undefined,
        },
      });
    });
  });

  describe("Email triggers and callbacks", () => {
    it("triggers sendChangeEmailConfirmation on email change", async () => {
      const changeEmailCallback =
        auth.options.user?.changeEmail?.sendChangeEmailConfirmation;
      expect(changeEmailCallback).toBeDefined();

      await (changeEmailCallback as any)({
        user: { id: "u-1", name: "Alice", email: "old@example.com" },
        url: "http://localhost:3000/confirm",
        newEmail: "new@example.com",
      });

      expect(mockSendEmailVerification).toHaveBeenCalledWith({
        user: expect.objectContaining({ email: "new@example.com" }),
        url: "http://localhost:3000/confirm",
      });
    });

    it("triggers sendDeleteAccountVerification on user deletion", async () => {
      const deleteUserCallback =
        auth.options.user?.deleteUser?.sendDeleteAccountVerification;
      expect(deleteUserCallback).toBeDefined();

      await (deleteUserCallback as any)({
        user: { id: "u-1", email: "delete@example.com", name: "Bob" },
        url: "http://localhost:3000/delete-verify",
      });

      expect(mockSendDeleteAccount).toHaveBeenCalledWith({
        user: { id: "u-1", email: "delete@example.com", name: "Bob" },
        url: "http://localhost:3000/delete-verify",
      });
    });

    it("triggers sendResetPassword on password reset request", async () => {
      const resetPasswordCallback =
        auth.options.emailAndPassword?.sendResetPassword;
      expect(resetPasswordCallback).toBeDefined();

      await (resetPasswordCallback as any)({
        user: { email: "reset@example.com", name: "Charlie" },
        url: "http://localhost:3000/reset",
      });

      expect(mockSendPasswordReset).toHaveBeenCalledWith({
        user: { email: "reset@example.com", name: "Charlie" },
        url: "http://localhost:3000/reset",
      });
    });

    it("triggers sendVerificationEmail on sign-up verification", async () => {
      const sendVerification =
        auth.options.emailVerification?.sendVerificationEmail;
      expect(sendVerification).toBeDefined();

      await (sendVerification as any)({
        user: { email: "verify@example.com", name: "Dave" },
        url: "http://localhost:3000/verify",
      });

      expect(mockSendEmailVerification).toHaveBeenCalledWith({
        user: { email: "verify@example.com", name: "Dave" },
        url: "http://localhost:3000/verify",
      });
    });
  });
});

