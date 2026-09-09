import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockToastError, mockToastSuccess } = vi.hoisted(() => ({
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mockToastError,
    success: mockToastSuccess,
  },
}));

import { BetterAuthActionButton } from "@/components/auth/buttons/better-auth-action-button";

describe("BetterAuthActionButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles successful Better Auth response and fires success toast", async () => {
    const mockAuthAction = vi.fn().mockResolvedValue({ error: null });

    render(
      <BetterAuthActionButton
        action={mockAuthAction}
        successMessage="Signed out successfully"
      >
        Sign Out
      </BetterAuthActionButton>,
    );

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    expect(mockAuthAction).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("Signed out successfully");
    });
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("handles Better Auth error response with message and fires error toast", async () => {
    const mockAuthAction = vi.fn().mockResolvedValue({
      error: { message: "Invalid credentials" },
    });

    render(
      <BetterAuthActionButton action={mockAuthAction}>
        Submit
      </BetterAuthActionButton>,
    );

    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(mockAuthAction).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Invalid credentials");
    });
  });

  it("falls back to 'Action failed' when error object lacks message", async () => {
    const mockAuthAction = vi.fn().mockResolvedValue({
      error: {},
    });

    render(
      <BetterAuthActionButton action={mockAuthAction}>
        Trigger
      </BetterAuthActionButton>,
    );

    fireEvent.click(screen.getByRole("button", { name: /trigger/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Action failed");
    });
  });
});

