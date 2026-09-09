import { describe, expect, it } from "vitest";
import {
  SUPPORTED_OAUTH_PROVIDERS,
  SUPPORTED_OAUTH_PROVIDER_DETAILS,
} from "@/lib/auth/o-auth-providers";

describe("OAuth Providers", () => {
  it("defines supported providers", () => {
    expect(SUPPORTED_OAUTH_PROVIDERS).toEqual(["github", "discord"]);
  });

  it("provides details and icons for each supported provider", () => {
    expect(SUPPORTED_OAUTH_PROVIDER_DETAILS.github.name).toBe("GitHub");
    expect(SUPPORTED_OAUTH_PROVIDER_DETAILS.github.Icon).toBeDefined();

    expect(SUPPORTED_OAUTH_PROVIDER_DETAILS.discord.name).toBe("Discord");
    expect(SUPPORTED_OAUTH_PROVIDER_DETAILS.discord.Icon).toBeDefined();
  });
});

