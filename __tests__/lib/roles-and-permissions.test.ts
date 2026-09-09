import { describe, expect, it } from "vitest";
import { ac, admin, user } from "@/components/auth/utils/permissions";
import {
  GLOBAL_ROLES,
  INVITATION_STATUS,
  ORG_ROLES,
} from "@/lib/auth/roles";

describe("Roles and Permissions", () => {
  describe("Roles constants", () => {
    it("defines global roles", () => {
      expect(GLOBAL_ROLES).toEqual({
        ADMIN: "admin",
        USER: "user",
      });
    });

    it("defines organization roles", () => {
      expect(ORG_ROLES).toEqual({
        OWNER: "owner",
        ADMIN: "admin",
        MEMBER: "member",
      });
    });

    it("defines invitation statuses", () => {
      expect(INVITATION_STATUS).toEqual({
        PENDING: "pending",
        ACCEPTED: "accepted",
        REJECTED: "rejected",
        CANCELED: "canceled",
      });
    });
  });

  describe("Access control permissions", () => {
    it("exports access control instance", () => {
      expect(ac).toBeDefined();
    });

    it("includes list permission on user role statements", () => {
      expect(user.statements).toBeDefined();
      expect(user.statements.user).toContain("list");
    });

    it("configures admin role with admin statements", () => {
      expect(admin.statements).toBeDefined();
      expect(admin.statements.user).toBeDefined();
    });
  });
});

