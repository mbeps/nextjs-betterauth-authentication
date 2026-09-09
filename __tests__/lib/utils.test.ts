import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges independent class names", () => {
    expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("resolves conflicting Tailwind classes with last-wins precedence", () => {
    expect(cn("px-2 py-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("handles conditional class values", () => {
    const isPrimary = true;
    const isSecondary = false;
    expect(
      cn("base-btn", isPrimary && "btn-primary", isSecondary && "btn-secondary"),
    ).toBe("base-btn btn-primary");
  });

  it("ignores falsy values, null, and undefined", () => {
    expect(cn("base", null, undefined, false, "")).toBe("base");
  });

  it("handles arrays and nested class values", () => {
    expect(cn(["btn", ["btn-large", null]])).toBe("btn btn-large");
  });
});

