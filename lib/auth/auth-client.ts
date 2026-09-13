import { passkeyClient } from "@better-auth/passkey/client";
import {
  adminClient,
  inferAdditionalFields,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ROUTES } from "@/config/routes";
import type { auth } from "@/lib/auth/auth";
import { ac, admin, user } from "@/lib/auth/permissions";
import { GLOBAL_ROLES } from "@/lib/auth/roles";

/**
 * Better Auth client-side SDK instance for React and browser components.
 * Configured with isomorphic plugins matching the server configuration:
 * Passkeys, Two-Factor Authentication (with automated redirect to 2FA challenge),
 * Admin access control, Organization management, and inferred custom user fields.
 * Use this client across UI components and client hooks for authentication, session querying, and user management.
 *
 * @see {@link https://docs.better-auth.com/client/react}
 * @see auth for corresponding server configuration
 * @author Maruf Bepary
 */
export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    passkeyClient(),
    twoFactorClient({
      onTwoFactorRedirect: () => {
        window.location.href = ROUTES.AUTH.TWO_FACTOR;
      },
    }),
    adminClient({
      ac,
      roles: {
        [GLOBAL_ROLES.ADMIN]: admin,
        [GLOBAL_ROLES.USER]: user,
      },
    }),
    organizationClient(),
  ],
});
