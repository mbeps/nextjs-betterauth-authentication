"use client";

import { BetterAuthActionButton } from "@/components/auth/better-auth-action-button";
import { ROUTES } from "@/config/routes";
import { authClient } from "@/lib/auth/auth-client";
import {
  SUPPORTED_OAUTH_PROVIDER_DETAILS,
  SUPPORTED_OAUTH_PROVIDERS,
} from "@/lib/auth/o-auth-providers";

/**
 * Renders interactive social login buttons for all supported third-party OAuth identity providers.
 * Executes as a Client Component ("use client") iterating over registered providers to establish
 * federated authentication sessions via Better Auth.
 *
 * Security Context & OAuth Flow:
 * - Maps over `SUPPORTED_OAUTH_PROVIDERS` and binds each to `authClient.signIn.social`.
 * - Initiates the OAuth 2.0 / OIDC handshake redirecting the browser to the respective provider's
 *   authorization endpoint (e.g. GitHub, Google, Discord).
 * - Specifies `ROUTES.HOME` as the post-authentication callback URL once the provider redirects back
 *   and Better Auth sets the session cookie.
 * - Displays provider-specific icons and accessible branded labels wrapped in `BetterAuthActionButton`
 *   to handle loading spinners and error feedback gracefully.
 *
 * @returns Array of reactive OAuth authentication action buttons
 * @author Maruf Bepary
 */
export function SocialAuthButtons() {
  return SUPPORTED_OAUTH_PROVIDERS.map((provider) => {
    const Icon = SUPPORTED_OAUTH_PROVIDER_DETAILS[provider].Icon;

    return (
      <BetterAuthActionButton
        variant="outline"
        key={provider}
        action={() => {
          return authClient.signIn.social({
            provider,
            callbackURL: ROUTES.HOME,
          });
        }}
      >
        <Icon />
        {SUPPORTED_OAUTH_PROVIDER_DETAILS[provider].name}
      </BetterAuthActionButton>
    );
  });
}
