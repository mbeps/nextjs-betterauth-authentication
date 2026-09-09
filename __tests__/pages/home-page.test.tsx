import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUseSession, mockHasPermission, mockSignOut } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockHasPermission: vi.fn(),
  mockSignOut: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/auth/auth-client", () => ({
  authClient: {
    useSession: mockUseSession,
    admin: {
      hasPermission: mockHasPermission,
    },
    signOut: mockSignOut,
  },
}));

import Home from "@/app/page";
import { ROUTES } from "@/lib/routes";

describe("Home Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockResolvedValue({ data: { success: false } });
  });

  it("renders loading indicator when session is pending", () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    });

    render(<Home />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders guest state with sign in link when unauthenticated", async () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    });

    render(<Home />);

    expect(screen.getByText("Welcome to Our App")).toBeInTheDocument();
    const loginLink = screen.getByRole("link", { name: "Sign In / Sign Up" });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", ROUTES.AUTH.LOGIN);
  });

  it("renders authenticated user navigation without admin link when not permitted", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: "Sarah Connor" },
      },
      isPending: false,
    });
    mockHasPermission.mockResolvedValue({ data: { success: false } });

    render(<Home />);

    expect(screen.getByText("Welcome Sarah Connor!")).toBeInTheDocument();

    const profileLink = screen.getByRole("link", { name: "Profile" });
    expect(profileLink).toHaveAttribute("href", ROUTES.PROFILE);

    const orgsLink = screen.getByRole("link", { name: "Organizations" });
    expect(orgsLink).toHaveAttribute("href", ROUTES.ORGANIZATIONS.DASHBOARD);

    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("renders Admin link when user has admin permissions", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: "Admin Boss" },
      },
      isPending: false,
    });
    mockHasPermission.mockResolvedValue({ data: { success: true } });

    render(<Home />);

    await waitFor(() => {
      const adminLink = screen.getByRole("link", { name: "Admin" });
      expect(adminLink).toBeInTheDocument();
      expect(adminLink).toHaveAttribute("href", ROUTES.ADMIN);
    });
  });

  it("triggers sign out when Sign Out button is clicked", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: "Sarah Connor" },
      },
      isPending: false,
    });

    render(<Home />);

    const signOutButton = screen.getByRole("button", { name: /sign out/i });
    fireEvent.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalledOnce();
  });
});

