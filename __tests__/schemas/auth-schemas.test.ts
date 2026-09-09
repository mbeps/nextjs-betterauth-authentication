import { describe, expect, it } from "vitest";
import { changePasswordSchema } from "@/schemas/change-password";
import { forgotPasswordSchema } from "@/schemas/forgot-password";
import { passkeySchema } from "@/schemas/passkey";
import { profileUpdateSchema } from "@/schemas/profile-update";
import { resetPasswordSchema } from "@/schemas/reset-password";
import { signInSchema } from "@/schemas/sign-in";
import { signUpSchema } from "@/schemas/sign-up";

describe("Auth Schemas", () => {
  describe("signInSchema", () => {
    it("accepts valid credentials", () => {
      const result = signInSchema.safeParse({
        email: "user@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email formats", () => {
      const result = signInSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects passwords shorter than 6 characters", () => {
      const result = signInSchema.safeParse({
        email: "user@example.com",
        password: "12345",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing fields", () => {
      expect(signInSchema.safeParse({}).success).toBe(false);
      expect(signInSchema.safeParse({ email: "user@example.com" }).success).toBe(false);
      expect(signInSchema.safeParse({ password: "password123" }).success).toBe(false);
    });
  });

  describe("signUpSchema", () => {
    it("accepts valid registration data", () => {
      const result = signUpSchema.safeParse({
        name: "Alice",
        email: "alice@example.com",
        password: "securepassword",
        favoriteNumber: 42,
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = signUpSchema.safeParse({
        name: "",
        email: "alice@example.com",
        password: "securepassword",
        favoriteNumber: 42,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer favoriteNumber", () => {
      const result = signUpSchema.safeParse({
        name: "Alice",
        email: "alice@example.com",
        password: "securepassword",
        favoriteNumber: 3.14,
      });
      expect(result.success).toBe(false);
    });

    it("rejects password with less than 6 characters", () => {
      const result = signUpSchema.safeParse({
        name: "Alice",
        email: "alice@example.com",
        password: "123",
        favoriteNumber: 7,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("accepts valid email", () => {
      expect(
        forgotPasswordSchema.safeParse({ email: "test@example.com" }).success,
      ).toBe(true);
    });

    it("rejects invalid email and empty email", () => {
      expect(
        forgotPasswordSchema.safeParse({ email: "invalid" }).success,
      ).toBe(false);
      expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("accepts valid new password of 6+ characters", () => {
      expect(
        resetPasswordSchema.safeParse({ password: "newpassword" }).success,
      ).toBe(true);
    });

    it("rejects password shorter than 6 characters", () => {
      expect(resetPasswordSchema.safeParse({ password: "12345" }).success).toBe(
        false,
      );
    });
  });

  describe("changePasswordSchema", () => {
    it("accepts valid password change payload", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "oldpassword",
        newPassword: "newpassword",
        revokeOtherSessions: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty currentPassword", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "",
        newPassword: "newpassword",
        revokeOtherSessions: false,
      });
      expect(result.success).toBe(false);
    });

    it("rejects newPassword shorter than 6 characters", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "oldpassword",
        newPassword: "short",
        revokeOtherSessions: false,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-boolean revokeOtherSessions", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "oldpassword",
        newPassword: "newpassword",
        revokeOtherSessions: "yes",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("profileUpdateSchema", () => {
    it("accepts valid profile update data", () => {
      const result = profileUpdateSchema.safeParse({
        name: "Bob",
        email: "bob@example.com",
        favoriteNumber: 99,
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty name or invalid email", () => {
      expect(
        profileUpdateSchema.safeParse({
          name: "",
          email: "bob@example.com",
          favoriteNumber: 99,
        }).success,
      ).toBe(false);

      expect(
        profileUpdateSchema.safeParse({
          name: "Bob",
          email: "bad-email",
          favoriteNumber: 99,
        }).success,
      ).toBe(false);
    });

    it("rejects non-integer favoriteNumber", () => {
      expect(
        profileUpdateSchema.safeParse({
          name: "Bob",
          email: "bob@example.com",
          favoriteNumber: "not-a-number",
        }).success,
      ).toBe(false);
    });
  });

  describe("passkeySchema", () => {
    it("accepts valid passkey name", () => {
      expect(passkeySchema.safeParse({ name: "MacBook TouchID" }).success).toBe(
        true,
      );
    });

    it("rejects empty passkey name", () => {
      expect(passkeySchema.safeParse({ name: "" }).success).toBe(false);
    });
  });
});

