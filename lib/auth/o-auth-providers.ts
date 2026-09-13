import type { ComponentProps, ElementType } from "react";
import { DiscordIcon } from "@/components/auth/discord-icon";
import { GitHubIcon } from "@/components/auth/git-hub-icon";

/**
 * List of social OAuth identity providers supported by the application.
 * Configured on the Better Auth server and consumed in client authentication components.
 *
 * @author Maruf Bepary
 */
export const SUPPORTED_OAUTH_PROVIDERS = ["github", "discord"] as const;

/**
 * String literal union representing supported social OAuth provider identifiers.
 *
 * @see SUPPORTED_OAUTH_PROVIDERS
 * @author Maruf Bepary
 */
export type SupportedOAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number];

/**
 * UI metadata and rendering affordances for supported OAuth providers.
 * Maps each provider identifier to its human-readable brand name and SVG brand icon component.
 * Used across login and registration forms to dynamically render provider buttons.
 *
 * @author Maruf Bepary
 */
export const SUPPORTED_OAUTH_PROVIDER_DETAILS: Record<
  SupportedOAuthProvider,
  {
    /** Human-readable brand name of the OAuth provider. */
    name: string;
    /** React component rendering the provider's SVG brand icon. */
    Icon: ElementType<ComponentProps<"svg">>;
  }
> = {
  discord: { name: "Discord", Icon: DiscordIcon },
  github: { name: "GitHub", Icon: GitHubIcon },
};
