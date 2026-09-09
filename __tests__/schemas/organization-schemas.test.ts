import { describe, expect, it } from "vitest";
import { ORG_ROLES } from "@/lib/auth/roles";
import { createInviteSchema } from "@/schemas/create-invite";
import { createOrganizationSchema } from "@/schemas/create-organization";

describe("Organization Schemas", () => {
  describe("createOrganizationSchema", () => {
    it("accepts non-empty organization name", () => {
      expect(
        createOrganizationSchema.safeParse({ name: "Acme Corp" }).success,
      ).toBe(true);
    });

    it("rejects empty organization name", () => {
      expect(createOrganizationSchema.safeParse({ name: "" }).success).toBe(
        false,
      );
    });
  });

  describe("createInviteSchema", () => {
    it("accepts valid member invite", () => {
      const result = createInviteSchema.safeParse({
        email: "colleague@example.com",
        role: ORG_ROLES.MEMBER,
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid admin invite", () => {
      const result = createInviteSchema.safeParse({
        email: "admin@example.com",
        role: ORG_ROLES.ADMIN,
      });
      expect(result.success).toBe(true);
    });

    it("rejects untrimmed email addresses because email check executes before trim", () => {
      const result = createInviteSchema.safeParse({
        email: "  spaced@example.com  ",
        role: ORG_ROLES.MEMBER,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid role like owner or arbitrary string", () => {
      expect(
        createInviteSchema.safeParse({
          email: "colleague@example.com",
          role: "owner",
        }).success,
      ).toBe(false);

      expect(
        createInviteSchema.safeParse({
          email: "colleague@example.com",
          role: "guest",
        }).success,
      ).toBe(false);
    });

    it("rejects invalid email formats", () => {
      expect(
        createInviteSchema.safeParse({
          email: "not-an-email",
          role: ORG_ROLES.MEMBER,
        }).success,
      ).toBe(false);
    });
  });
});

