import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPush, mockUseSession, mockStopImpersonating, mockRefetch } =
  vi.hoisted(() => ({
    mockPush: vi.fn(),
    mockUseSession: vi.fn(),
    mockStopImpersonating: vi.fn(),
    mockRefetch: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/lib/auth/auth-client", () => ({
  authClient: {
    useSession: mockUseSession,
    admin: {
      stopImpersonating: mockStopImpersonating,
    },
  },
}));

import { ImpersonationIndicator } from "@/components/auth/buttons/impersonation-indicator";
import { ROUTES } from "@/lib/routes";

describe("ImpersonationIndicator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when user is not impersonated", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "u-1", name: "Regular User" },
        session: { id: "s-1" },
      },
      refetch: mockRefetch,
    });

    const { container } = render(<ImpersonationIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when session is null", () => {
    mockUseSession.mockReturnValue({
      data: null,
      refetch: mockRefetch,
    });

    const { container } = render(<ImpersonationIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it("renders indicator button and stops impersonation when clicked", async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: "u-target", name: "Target User" },
        session: { id: "s-1", impersonatedBy: "admin-user-id" },
      },
      refetch: mockRefetch,
    });

    mockStopImpersonating.mockImplementation((_, opts?: any) => {
      opts?.onSuccess?.();
      return Promise.resolve({ error: null });
    });

    render(<ImpersonationIndicator />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    expect(mockStopImpersonating).toHaveBeenCalledOnce();
    expect(mockPush).toHaveBeenCalledWith(ROUTES.ADMIN);
    expect(mockRefetch).toHaveBeenCalledOnce();
  });
});

