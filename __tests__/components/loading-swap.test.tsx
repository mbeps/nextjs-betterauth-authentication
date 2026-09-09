import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingSwap } from "@/components/ui/loading-swap";

describe("LoadingSwap", () => {
  it("renders children with visible class and spinner as invisible when isLoading is false", () => {
    render(<LoadingSwap isLoading={false}>Submit Button</LoadingSwap>);

    const childEl = screen.getByText("Submit Button");
    expect(childEl).toBeInTheDocument();
    expect(childEl).toHaveClass("visible");
    expect(childEl).not.toHaveClass("invisible");
  });

  it("renders children with invisible class and spinner as visible when isLoading is true", () => {
    render(<LoadingSwap isLoading={true}>Submit Button</LoadingSwap>);

    const childEl = screen.getByText("Submit Button");
    expect(childEl).toBeInTheDocument();
    expect(childEl).toHaveClass("invisible");
    expect(childEl).not.toHaveClass("visible");
  });

  it("applies custom className to inner containers", () => {
    render(
      <LoadingSwap isLoading={false} className="custom-test-class">
        Content
      </LoadingSwap>,
    );

    const childEl = screen.getByText("Content");
    expect(childEl).toHaveClass("custom-test-class");
  });
});

