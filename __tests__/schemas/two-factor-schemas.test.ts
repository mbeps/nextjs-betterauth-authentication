import { describe, expect, it } from "vitest";
import { backupCodeSchema } from "@/schemas/backup-code";
import { totpSchema } from "@/schemas/totp";
import { qrSchema, twoFactorAuthSchema } from "@/schemas/two-factor-auth";

describe("Two-Factor Schemas", () => {
  describe("twoFactorAuthSchema", () => {
    it("accepts valid password", () => {
      expect(twoFactorAuthSchema.safeParse({ password: "mypassword" }).success).toBe(
        true,
      );
    });

    it("rejects empty password", () => {
      expect(twoFactorAuthSchema.safeParse({ password: "" }).success).toBe(false);
    });
  });

  describe("qrSchema", () => {
    it("accepts token with exact length 6", () => {
      expect(qrSchema.safeParse({ token: "123456" }).success).toBe(true);
    });

    it("rejects token with length other than 6", () => {
      expect(qrSchema.safeParse({ token: "12345" }).success).toBe(false);
      expect(qrSchema.safeParse({ token: "1234567" }).success).toBe(false);
      expect(qrSchema.safeParse({ token: "" }).success).toBe(false);
    });
  });

  describe("totpSchema", () => {
    it("accepts code with exact length 6", () => {
      expect(totpSchema.safeParse({ code: "654321" }).success).toBe(true);
    });

    it("rejects code with length other than 6", () => {
      expect(totpSchema.safeParse({ code: "123" }).success).toBe(false);
      expect(totpSchema.safeParse({ code: "12345678" }).success).toBe(false);
    });
  });

  describe("backupCodeSchema", () => {
    it("accepts non-empty backup code", () => {
      expect(backupCodeSchema.safeParse({ code: "ABCD-1234" }).success).toBe(true);
    });

    it("rejects empty backup code", () => {
      expect(backupCodeSchema.safeParse({ code: "" }).success).toBe(false);
    });
  });
});

