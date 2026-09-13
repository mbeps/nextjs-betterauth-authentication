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

import { ActionButton } from "@/components/ui/action-button";

describe("ActionButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Standard mode (no confirmation)", () => {
    it("executes action on click and displays success toast", async () => {
      const mockAction = vi
        .fn()
        .mockResolvedValue({ error: false, message: "Changes saved" });

      render(<ActionButton action={mockAction}>Save</ActionButton>);

      fireEvent.click(screen.getByRole("button", { name: /save/i }));

      expect(mockAction).toHaveBeenCalledOnce();
      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("Changes saved");
      });
      expect(mockToastError).not.toHaveBeenCalled();
    });

    it("displays error toast on failed action with message", async () => {
      const mockAction = vi
        .fn()
        .mockResolvedValue({ error: true, message: "Network failure" });

      render(<ActionButton action={mockAction}>Delete</ActionButton>);

      fireEvent.click(screen.getByRole("button", { name: /delete/i }));

      expect(mockAction).toHaveBeenCalledOnce();
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Network failure");
      });
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });

    it("falls back to default 'Error' message when error message is omitted", async () => {
      const mockAction = vi.fn().mockResolvedValue({ error: true });

      render(<ActionButton action={mockAction}>Action</ActionButton>);

      fireEvent.click(screen.getByRole("button", { name: /action/i }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Error");
      });
    });

    it("calls custom onClick handler if provided", async () => {
      const mockAction = vi.fn().mockResolvedValue({ error: false });
      const mockOnClick = vi.fn();

      render(
        <ActionButton action={mockAction} onClick={mockOnClick}>
          Custom
        </ActionButton>,
      );

      fireEvent.click(screen.getByRole("button", { name: /custom/i }));

      expect(mockAction).toHaveBeenCalledOnce();
      expect(mockOnClick).toHaveBeenCalledOnce();
    });
  });

  describe("Confirmation mode (requireAreYouSure)", () => {
    it("shows confirmation dialog and executes action when confirmed", async () => {
      const mockAction = vi
        .fn()
        .mockResolvedValue({ error: false, message: "Deleted" });

      render(
        <ActionButton
          action={mockAction}
          requireAreYouSure={true}
          areYouSureDescription="Permanently delete item?"
        >
          Delete Item
        </ActionButton>,
      );

      // Dialog is not open initially
      expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();

      // Click trigger button
      fireEvent.click(screen.getByRole("button", { name: /delete item/i }));

      // Dialog is displayed
      expect(screen.getByText("Are you sure?")).toBeInTheDocument();
      expect(screen.getByText("Permanently delete item?")).toBeInTheDocument();
      expect(mockAction).not.toHaveBeenCalled();

      // Click confirm action "Yes"
      fireEvent.click(screen.getByRole("button", { name: /yes/i }));

      expect(mockAction).toHaveBeenCalledOnce();
      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("Deleted");
      });
    });

    it("cancels without invoking action when cancel is clicked", async () => {
      const mockAction = vi.fn().mockResolvedValue({ error: false });

      render(
        <ActionButton action={mockAction} requireAreYouSure={true}>
          Dangerous
        </ActionButton>,
      );

      fireEvent.click(screen.getByRole("button", { name: /dangerous/i }));

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockAction).not.toHaveBeenCalled();
    });
  });
});

