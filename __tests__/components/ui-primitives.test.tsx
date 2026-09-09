import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoadingSuspense } from "@/app/profile/_components/shared/loading-suspense";
import { Badge } from "@/components/ui/badge";
import { NumberInput } from "@/components/ui/number-input";
import { PasswordInput } from "@/components/ui/password-input";

describe("UI Primitives", () => {
  describe("PasswordInput", () => {
    it("renders as a password input by default with show password label", () => {
      render(<PasswordInput placeholder="Enter password" />);

      const input = screen.getByPlaceholderText("Enter password");
      expect(input).toHaveAttribute("type", "password");
      expect(screen.getByText("Show password")).toBeInTheDocument();
    });

    it("toggles to plain text on toggle button click and reverts on subsequent click", () => {
      render(<PasswordInput placeholder="Enter password" />);

      const input = screen.getByPlaceholderText("Enter password");
      const toggleButton = screen.getByRole("button", { name: /show password/i });

      // Click to show password
      fireEvent.click(toggleButton);
      expect(input).toHaveAttribute("type", "text");
      expect(screen.getByText("Hide password")).toBeInTheDocument();

      // Click again to hide password
      fireEvent.click(screen.getByRole("button", { name: /hide password/i }));
      expect(input).toHaveAttribute("type", "password");
      expect(screen.getByText("Show password")).toBeInTheDocument();
    });

    it("merges custom className with padding-right preservation", () => {
      render(
        <PasswordInput
          placeholder="Enter password"
          className="custom-pass-style"
        />,
      );

      const input = screen.getByPlaceholderText("Enter password");
      expect(input).toHaveClass("pr-9", "custom-pass-style");
    });
  });

  describe("NumberInput", () => {
    it("emits parsed numbers on numeric input change", () => {
      const onChange = vi.fn();
      render(<NumberInput value={10} onChange={onChange} />);

      const input = screen.getByRole("spinbutton");
      expect(input).toHaveValue(10);

      fireEvent.change(input, { target: { value: "25", valueAsNumber: 25 } });
      expect(onChange).toHaveBeenCalledWith(25);
    });

    it("emits null when value is not a valid number or emptied", () => {
      const onChange = vi.fn();
      render(<NumberInput value={5} onChange={onChange} />);

      const input = screen.getByRole("spinbutton");
      fireEvent.change(input, {
        target: { value: "", valueAsNumber: Number.NaN },
      });
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("renders empty string when value is undefined or null", () => {
      const { rerender } = render(
        <NumberInput value={null} onChange={vi.fn()} />,
      );
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveValue(null);

      rerender(<NumberInput value={undefined} onChange={vi.fn()} />);
      expect(input).toHaveValue(null);
    });
  });

  describe("Badge", () => {
    it("renders default variant with expected classes", () => {
      render(<Badge>Default Badge</Badge>);
      const badge = screen.getByText("Default Badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute("data-slot", "badge");
      expect(badge).toHaveClass("bg-primary", "text-primary-foreground");
    });

    it("renders secondary variant", () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      expect(screen.getByText("Secondary")).toHaveClass(
        "bg-secondary",
        "text-secondary-foreground",
      );
    });

    it("renders destructive variant", () => {
      render(<Badge variant="destructive">Destructive</Badge>);
      expect(screen.getByText("Destructive")).toHaveClass(
        "bg-destructive",
        "text-white",
      );
    });

    it("renders outline variant", () => {
      render(<Badge variant="outline">Outline</Badge>);
      expect(screen.getByText("Outline")).toHaveClass("text-foreground");
    });
  });

  describe("LoadingSuspense", () => {
    it("renders resolved children within suspense boundary", () => {
      render(
        <LoadingSuspense>
          <div>Ready content</div>
        </LoadingSuspense>,
      );

      expect(screen.getByText("Ready content")).toBeInTheDocument();
    });
  });
});

