import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockPush,
  mockRefresh,
  mockRequestPasswordReset,
  mockUpdateUser,
  mockChangeEmail,
  mockAcceptInvitation,
  mockRejectInvitation,
  mockSetActive,
  mockToastSuccess,
  mockToastError,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockRefresh: vi.fn(),
  mockRequestPasswordReset: vi.fn(),
  mockUpdateUser: vi.fn().mockResolvedValue({ error: null }),
  mockChangeEmail: vi.fn().mockResolvedValue({ error: null }),
  mockAcceptInvitation: vi.fn().mockResolvedValue({ error: null }),
  mockRejectInvitation: vi.fn().mockResolvedValue({ error: null }),
  mockSetActive: vi.fn().mockResolvedValue({ error: null }),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

vi.mock("@/lib/auth/auth-client", () => ({
  authClient: {
    requestPasswordReset: mockRequestPasswordReset,
    updateUser: mockUpdateUser,
    changeEmail: mockChangeEmail,
    organization: {
      acceptInvitation: mockAcceptInvitation,
      rejectInvitation: mockRejectInvitation,
      setActive: mockSetActive,
    },
  },
}));

import { ForgotPassword } from "@/app/auth/login/_components/forms/forgot-password";
import { InviteInformation } from "@/app/organizations/invites/[id]/_components/invite-information";
import { ProfileUpdateForm } from "@/app/profile/_components/profile/profile-update-form";
import { ROUTES } from "@/lib/routes";

describe("Forms & Action Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ForgotPassword Form", () => {
    it("calls openSignInTab callback when Back button is clicked", () => {
      const openSignInTab = vi.fn();
      render(<ForgotPassword openSignInTab={openSignInTab} />);

      fireEvent.click(screen.getByRole("button", { name: /back/i }));
      expect(openSignInTab).toHaveBeenCalledOnce();
    });

    it("submits valid email to requestPasswordReset", async () => {
      mockRequestPasswordReset.mockImplementation((_, opts?: any) => {
        opts?.onSuccess?.();
        return Promise.resolve({ error: null });
      });

      render(<ForgotPassword openSignInTab={vi.fn()} />);

      const emailInput = screen.getByRole("textbox", { name: /email/i });
      fireEvent.change(emailInput, { target: { value: "user@example.com" } });

      const submitButton = screen.getByRole("button", {
        name: /send reset email/i,
      });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith(
          {
            email: "user@example.com",
            redirectTo: ROUTES.AUTH.RESET_PASSWORD,
          },
          expect.any(Object),
        );
      });
    });
  });

  describe("ProfileUpdateForm", () => {
    const initialUser = {
      name: "Diana Prince",
      email: "diana@themyscira.com",
      favoriteNumber: 7,
    };

    it("updates only profile attributes when email is untouched", async () => {
      render(<ProfileUpdateForm user={initialUser} />);

      const nameInput = screen.getByRole("textbox", { name: /^name$/i });
      fireEvent.change(nameInput, { target: { value: "Diana of Themyscira" } });

      const submitBtn = screen.getByRole("button", { name: /update profile/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          name: "Diana of Themyscira",
          favoriteNumber: 7,
        });
      });
      expect(mockChangeEmail).not.toHaveBeenCalled();
    });

    it("triggers both updateUser and changeEmail when email address is modified", async () => {
      render(<ProfileUpdateForm user={initialUser} />);

      const emailInput = screen.getByRole("textbox", { name: /^email$/i });
      fireEvent.change(emailInput, { target: { value: "wonderwoman@jl.org" } });

      const submitBtn = screen.getByRole("button", { name: /update profile/i });
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          name: "Diana Prince",
          favoriteNumber: 7,
        });
        expect(mockChangeEmail).toHaveBeenCalledWith({
          newEmail: "wonderwoman@jl.org",
          callbackURL: ROUTES.PROFILE,
        });
      });
    });
  });

  describe("InviteInformation", () => {
    const invitation = {
      id: "inv-101",
      organizationId: "org-202",
    };

    it("accepts invitation, activates organization, and redirects to dashboard", async () => {
      mockAcceptInvitation.mockImplementation((_, opts?: any) => {
        opts?.onSuccess?.();
        return Promise.resolve({ error: null });
      });

      render(<InviteInformation invitation={invitation} />);

      const acceptButton = screen.getByRole("button", { name: /accept/i });
      await act(async () => {
        fireEvent.click(acceptButton);
      });

      expect(mockAcceptInvitation).toHaveBeenCalledWith(
        { invitationId: "inv-101" },
        expect.any(Object),
      );
      await waitFor(() => {
        expect(mockSetActive).toHaveBeenCalledWith({
          organizationId: "org-202",
        });
        expect(mockPush).toHaveBeenCalledWith(ROUTES.ORGANIZATIONS.DASHBOARD);
      });
    });

    it("rejects invitation and redirects home", async () => {
      mockRejectInvitation.mockImplementation((_, opts?: any) => {
        opts?.onSuccess?.();
        return Promise.resolve({ error: null });
      });

      render(<InviteInformation invitation={invitation} />);

      const rejectButton = screen.getByRole("button", { name: /reject/i });
      await act(async () => {
        fireEvent.click(rejectButton);
      });

      expect(mockRejectInvitation).toHaveBeenCalledWith(
        { invitationId: "inv-101" },
        expect.any(Object),
      );
      expect(mockPush).toHaveBeenCalledWith(ROUTES.HOME);
    });
  });
});

