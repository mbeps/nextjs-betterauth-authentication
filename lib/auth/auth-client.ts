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
 * Better Auth React client with passkey, two-factor, admin, and organization plugins.
 * @see https://docs.better-auth.com/client/react
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
