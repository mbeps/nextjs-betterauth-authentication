import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockPush,
  mockUseSession,
  mockSignInSocial,
  mockSignInPasskey,
  mockSendVerificationEmail,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUseSession: vi.fn(),
  mockSignInSocial: vi.fn().mockResolvedValue({ error: null }),
  mockSignInPasskey: vi.fn().mockResolvedValue({ error: null }),
  mockSendVerificationEmail: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/lib/auth/auth-client", () => ({
  authClient: {
    useSession: mockUseSession,
    signIn: {
      social: mockSignInSocial,
      passkey: mockSignInPasskey,
    },
    sendVerificationEmail: mockSendVerificationEmail,
  },
}));

import { PasskeyButton } from "@/app/auth/login/_components/buttons/passkey-button";
import { SocialAuthButtons } from "@/app/auth/login/_components/buttons/social-auth-buttons";
import { EmailVerification } from "@/app/auth/login/_components/forms/email-verification";
import { ROUTES } from "@/lib/routes";

describe("Auth Flow Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: null,
      refetch: vi.fn(),
    });
  });

  describe("SocialAuthButtons", () => {
    it("renders both GitHub and Discord social authentication buttons", () => {
      render(<SocialAuthButtons />);

      expect(
        screen.getByRole("button", { name: /github/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /discord/i }),
      ).toBeInTheDocument();
    });

    it("triggers social sign-in with GitHub and callback URL", async () => {
      render(<SocialAuthButtons />);

      const githubButton = screen.getByRole("button", { name: /github/i });
      await act(async () => {
        fireEvent.click(githubButton);
      });

      expect(mockSignInSocial).toHaveBeenCalledWith({
        provider: "github",
        callbackURL: ROUTES.HOME,
      });
    });

    it("triggers social sign-in with Discord and callback URL", async () => {
      render(<SocialAuthButtons />);

      const discordButton = screen.getByRole("button", { name: /discord/i });
      await act(async () => {
        fireEvent.click(discordButton);
      });

      expect(mockSignInSocial).toHaveBeenCalledWith({
        provider: "discord",
        callbackURL: ROUTES.HOME,
      });
    });
  });

  describe("PasskeyButton", () => {
    it("triggers silent passkey autofill on mount", () => {
      render(<PasskeyButton />);

      expect(mockSignInPasskey).toHaveBeenCalledWith(
        { autoFill: true },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });

    it("triggers interactive passkey authentication when clicked", async () => {
      render(<PasskeyButton />);

      const button = screen.getByRole("button", { name: /use passkey/i });
      await act(async () => {
        fireEvent.click(button);
      });

      expect(mockSignInPasskey).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  describe("EmailVerification (Countdown & Resend with Fake Timers)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("counts down from 30 seconds and enables the resend button at zero", async () => {
      render(<EmailVerification email="student@example.com" />);

      const resendButton = screen.getByRole("button", {
        name: /resend email \(30\)/i,
      });
      expect(resendButton).toBeDisabled();

      // Advance by 15 seconds
      act(() => {
        vi.advanceTimersByTime(15000);
      });
      expect(
        screen.getByRole("button", { name: /resend email \(15\)/i }),
      ).toBeDisabled();

      // Advance remaining 15 seconds to zero
      act(() => {
        vi.advanceTimersByTime(15000);
      });

      const enabledButton = screen.getByRole("button", {
        name: /^resend email$/i,
      });
      expect(enabledButton).toBeEnabled();
    });

    it("triggers resend email and restarts countdown on click", async () => {
      render(<EmailVerification email="student@example.com" />);

      // Fast forward countdown to 0
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      const resendButton = screen.getByRole("button", {
        name: /^resend email$/i,
      });
      expect(resendButton).toBeEnabled();

      await act(async () => {
        fireEvent.click(resendButton);
      });

      expect(mockSendVerificationEmail).toHaveBeenCalledWith({
        email: "student@example.com",
        callbackURL: ROUTES.HOME,
      });

      // Countdown resets back to 30
      expect(
        screen.getByRole("button", { name: /resend email \(30\)/i }),
      ).toBeDisabled();
    });
  });
});

