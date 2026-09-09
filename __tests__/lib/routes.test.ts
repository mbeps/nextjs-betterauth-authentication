import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/routes";

describe("ROUTES", () => {
  it("defines standard top-level routes", () => {
    expect(ROUTES.HOME).toBe("/");
    expect(ROUTES.ADMIN).toBe("/admin");
    expect(ROUTES.PROFILE).toBe("/profile");
  });

  it("defines authentication routes", () => {
    expect(ROUTES.AUTH.LOGIN).toBe("/auth/login");
    expect(ROUTES.AUTH.TWO_FACTOR).toBe("/auth/2fa");
    expect(ROUTES.AUTH.RESET_PASSWORD).toBe("/auth/reset-password");
  });

  it("defines organization routes and parameterized invite helper", () => {
    expect(ROUTES.ORGANIZATIONS.DASHBOARD).toBe("/organizations");
    expect(ROUTES.ORGANIZATIONS.INVITE("invite-xyz")).toBe(
      "/organizations/invites/invite-xyz",
    );
  });
});

