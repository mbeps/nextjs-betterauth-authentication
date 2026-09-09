import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSendEmail } = vi.hoisted(() => ({
  mockSendEmail: vi.fn().mockResolvedValue({ MessageID: "msg-123" }),
}));

vi.mock("postmark", () => ({
  ServerClient: vi.fn().mockImplementation(function () {
    return { sendEmail: mockSendEmail };
  }),
}));

vi.mock("@/lib/env", () => ({
  env: {
    POSTMARK_SERVER_TOKEN: "mock_postmark_token",
    POSTMARK_FROM_EMAIL: "noreply@example.com",
    BETTER_AUTH_URL: "http://localhost:3000",
  },
}));

import { sendDeleteAccountVerificationEmail } from "@/lib/emails/delete-account-verification";
import { sendEmailVerificationEmail } from "@/lib/emails/email-verification";
import { sendOrganizationInviteEmail } from "@/lib/emails/organization-invite-email";
import { sendPasswordResetEmail } from "@/lib/emails/password-reset-email";
import { sendEmail } from "@/lib/emails/send-email";
import { sendWelcomeEmail } from "@/lib/emails/welcome-email";

describe("Transactional Emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendEmail", () => {
    it("delegates to Postmark client with configured sender address", async () => {
      await sendEmail({
        to: "user@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
        text: "Hello",
      });

      expect(mockSendEmail).toHaveBeenCalledOnce();
      expect(mockSendEmail).toHaveBeenCalledWith({
        From: "noreply@example.com",
        To: "user@example.com",
        Subject: "Test Subject",
        HtmlBody: "<p>Hello</p>",
        TextBody: "Hello",
      });
    });
  });

  describe("sendWelcomeEmail", () => {
    it("delivers a welcome greeting with user name", async () => {
      await sendWelcomeEmail({ name: "Alice", email: "alice@example.com" });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          To: "alice@example.com",
          Subject: "Welcome to Our App!",
          HtmlBody: expect.stringContaining("Hello Alice"),
          TextBody: expect.stringContaining("Hello Alice"),
        }),
      );
    });
  });

  describe("sendEmailVerificationEmail", () => {
    it("delivers an email verification link", async () => {
      await sendEmailVerificationEmail({
        user: { name: "Bob", email: "bob@example.com" },
        url: "http://localhost:3000/verify-email?token=xyz",
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          To: "bob@example.com",
          Subject: "Verify your email address",
          HtmlBody: expect.stringContaining("http://localhost:3000/verify-email?token=xyz"),
          TextBody: expect.stringContaining("http://localhost:3000/verify-email?token=xyz"),
        }),
      );
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("delivers a password reset link", async () => {
      await sendPasswordResetEmail({
        user: { name: "Charlie", email: "charlie@example.com" },
        url: "http://localhost:3000/reset-password?token=abc",
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          To: "charlie@example.com",
          Subject: "Reset your password",
          HtmlBody: expect.stringContaining("http://localhost:3000/reset-password?token=abc"),
          TextBody: expect.stringContaining("http://localhost:3000/reset-password?token=abc"),
        }),
      );
    });
  });

  describe("sendOrganizationInviteEmail", () => {
    it("delivers an invite email containing the full invite URL", async () => {
      await sendOrganizationInviteEmail({
        email: "invited@example.com",
        organization: { name: "Stark Industries" },
        inviter: { name: "Tony" },
        invitation: { id: "inv-999" },
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          To: "invited@example.com",
          Subject: "You're invited to join the Stark Industries organization",
          HtmlBody: expect.stringContaining(
            "http://localhost:3000/organizations/invites/inv-999",
          ),
          TextBody: expect.stringContaining(
            "http://localhost:3000/organizations/invites/inv-999",
          ),
        }),
      );
    });
  });

  describe("sendDeleteAccountVerificationEmail", () => {
    it("delivers an account deletion confirmation link", async () => {
      await sendDeleteAccountVerificationEmail({
        user: { name: "Dave", email: "dave@example.com" },
        url: "http://localhost:3000/confirm-deletion?token=del123",
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          To: "dave@example.com",
          Subject: "Delete your account",
          HtmlBody: expect.stringContaining(
            "http://localhost:3000/confirm-deletion?token=del123",
          ),
          TextBody: expect.stringContaining(
            "http://localhost:3000/confirm-deletion?token=del123",
          ),
        }),
      );
    });
  });
});

