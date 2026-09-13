import { describe, expect, it } from "vitest";
import { createSlug } from "@/lib/create-slug";

describe("createSlug", () => {
  it("converts uppercase text to lowercase", () => {
    expect(createSlug("My Organization")).toBe("my-organization");
  });

  it("replaces special characters and whitespace with hyphens", () => {
    expect(createSlug("Engineering & Operations!")).toBe("engineering-operations-");
    expect(createSlug("Hello   World")).toBe("hello-world");
  });

  it("trims outer whitespace before slugifying", () => {
    expect(createSlug("  trimmed slug  ")).toBe("trimmed-slug");
  });

  it("handles empty strings", () => {
    expect(createSlug("")).toBe("");
  });

  it("handles numbers and alphanumeric strings", () => {
    expect(createSlug("Team 101 Version 2")).toBe("team-101-version-2");
  });
});

