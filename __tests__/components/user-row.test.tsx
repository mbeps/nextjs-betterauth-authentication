import { render, screen } from "@testing-library/react";
import type { UserWithRole } from "better-auth/plugins/admin";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUseSession } = vi.hoisted(() => ({
  mockUseSession: vi.fn().mockReturnValue({ refetch: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/auth/auth-client", () => ({
  authClient: {
    useSession: mockUseSession,
    admin: {
      impersonateUser: vi.fn(),
      banUser: vi.fn(),
      unbanUser: vi.fn(),
      revokeUserSessions: vi.fn(),
      removeUser: vi.fn(),
    },
  },
}));

import { UserRow } from "@/app/admin/_components/user-row";
import { GLOBAL_ROLES } from "@/lib/auth/roles";

function renderInTable(user: UserWithRole, selfId: string) {
  return render(
    <table>
      <tbody>
        <UserRow user={user} selfId={selfId} />
      </tbody>
    </table>,
  );
}

describe("UserRow", () => {
  const baseUser: UserWithRole = {
    id: "user-target-1",
    name: "Bruce Wayne",
    email: "bruce@wayne.com",
    emailVerified: true,
    createdAt: new Date("2025-01-15T00:00:00Z"),
    updatedAt: new Date("2025-01-15T00:00:00Z"),
    role: GLOBAL_ROLES.USER,
    banned: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user information and role badge", () => {
    renderInTable(baseUser, "current-admin-id");

    expect(screen.getByText("Bruce Wayne")).toBeInTheDocument();
    expect(screen.getByText("bruce@wayne.com")).toBeInTheDocument();
    expect(screen.getByText("user")).toBeInTheDocument();
  });

  it("renders 'You' badge and suppresses actions menu when viewing the current user", () => {
    renderInTable(baseUser, "user-target-1");

    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders 'Banned' badge when user is banned", () => {
    const bannedUser: UserWithRole = {
      ...baseUser,
      banned: true,
    };

    renderInTable(bannedUser, "current-admin-id");
    expect(screen.getByText("Banned")).toBeInTheDocument();
  });

  it("renders 'Unverified' badge when user email is not verified", () => {
    const unverifiedUser: UserWithRole = {
      ...baseUser,
      emailVerified: false,
    };

    renderInTable(unverifiedUser, "current-admin-id");
    expect(screen.getByText("Unverified")).toBeInTheDocument();
  });

  it("renders action trigger button for other users", () => {
    renderInTable(baseUser, "other-admin-id");

    const actionButton = screen.getByRole("button");
    expect(actionButton).toBeInTheDocument();
  });
});

